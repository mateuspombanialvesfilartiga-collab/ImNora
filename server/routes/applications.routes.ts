import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, runQuery, executeTransaction } from '../db.js';
import { authenticate, requireRole, validateBody, validateParamId } from '../middleware.js';
import { logAudit } from '../security.js';

const router = Router();

// Schema for seller application
const applySchema = z.object({
  commissionPercent: z.number().min(0.5, 'A comissão mínima permitida é 0,5%.').max(15.0, 'A comissão máxima é 15%.'),
  message: z.string().max(1000, 'A mensagem não pode exceder 1000 caracteres.').optional()
}).strict();

// POST /api/properties/:id/apply: Autonomous seller applies to represent a property
router.post('/properties/:id/apply', authenticate, requireRole(['seller']), validateParamId('id'), validateBody(applySchema), (req: Request, res: Response) => {
  const propertyId = req.params.id;
  const sellerId = req.user!.id;
  const { commissionPercent, message } = req.body;

  // 1. Check if seller is verified and approved
  const seller = queryOne<{ verified_status: string; full_name: string }>(
    `SELECT verified_status, full_name FROM seller_profiles WHERE user_id = ?`,
    [sellerId]
  );

  if (!seller || seller.verified_status !== 'approved') {
    return res.status(403).json({
      error: 'Apenas corretores autônomos com CRECI aprovado e verificado podem se candidatar a imóveis.'
    });
  }

  // 2. Check property status
  const property = queryOne<{ id: string; owner_id: string; title: string; price: number; status: string }>(
    `SELECT id, owner_id, title, price, status FROM properties WHERE id = ?`,
    [propertyId]
  );

  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  if (property.status !== 'published_open') {
    return res.status(400).json({
      error: 'Este imóvel não está aberto a novas candidaturas (já possui corretor selecionado ou está pausado).'
    });
  }

  // 3. Check for existing application (UNIQUE constraint rule)
  const existingApp = queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM seller_applications WHERE property_id = ? AND seller_id = ?`,
    [propertyId, sellerId]
  );

  if (existingApp) {
    if (existingApp.status === 'withdrawn') {
      // Allow reactivation if previously withdrawn
      const now = new Date().toISOString();
      runQuery(
        `UPDATE seller_applications SET commission_percent = ?, message = ?, status = 'submitted', updated_at = ? WHERE id = ?`,
        [commissionPercent, message || null, now, existingApp.id]
      );
      logAudit(sellerId, 'APPLICATION_RESUBMITTED', 'seller_applications', existingApp.id, { propertyId, commissionPercent }, req);
      return res.json({ message: 'Candidatura reenviada com sucesso!', applicationId: existingApp.id });
    }
    return res.status(409).json({
      error: 'Você já possui uma candidatura ativa para este imóvel.'
    });
  }

  const appId = 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  executeTransaction(() => {
    runQuery(
      `INSERT INTO seller_applications (id, property_id, seller_id, commission_percent, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?)`,
      [appId, propertyId, sellerId, commissionPercent, message || null, now, now]
    );

    // Notify owner
    const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    runQuery(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, 'Nova candidatura de corretor!', ?, ?, 0, ?)`,
      [
        notifId,
        property.owner_id,
        `${seller.full_name} se candidatou para vender "${property.title}" propondo ${commissionPercent}% de comissão.`,
        `/dashboard`,
        now
      ]
    );
  });

  logAudit(sellerId, 'APPLICATION_SUBMITTED', 'seller_applications', appId, { propertyId, commissionPercent }, req);

  return res.status(201).json({
    message: 'Candidatura enviada com sucesso! O proprietário avaliará sua proposta e comissão.',
    applicationId: appId
  });
});

// GET /api/properties/:id/applications: Owner views all candidates for comparison
router.get('/properties/:id/applications', authenticate, requireRole(['owner', 'admin']), validateParamId('id'), (req: Request, res: Response) => {
  const propertyId = req.params.id;
  const userId = req.user!.id;

  const property = queryOne<{ id: string; owner_id: string; title: string; price: number; status: string }>(
    `SELECT id, owner_id, title, price, status FROM properties WHERE id = ?`,
    [propertyId]
  );

  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  if (req.user!.role === 'owner' && property.owner_id !== userId) {
    return res.status(403).json({ error: 'Você só pode visualizar as candidaturas dos seus próprios imóveis.' });
  }

  // Fetch all applications with rich seller profile, ratings, sales count
  const applications = queryAll(
    `SELECT
      sa.id, sa.property_id, sa.seller_id, sa.commission_percent, sa.message, sa.status, sa.created_at, sa.updated_at,
      sp.full_name as seller_name, sp.creci_number as seller_creci, sp.creci_state as seller_creci_state,
      sp.phone as seller_phone, sp.bio as seller_bio, sp.photo_url as seller_photo,
      sp.rating_avg as seller_rating, sp.reviews_count as seller_reviews_count, sp.sales_count as seller_sales_count,
      sp.verified_status as seller_verified_status
    FROM seller_applications sa
    JOIN seller_profiles sp ON sa.seller_id = sp.user_id
    WHERE sa.property_id = ?
    ORDER BY
      CASE sa.status
        WHEN 'accepted' THEN 1
        WHEN 'submitted' THEN 2
        WHEN 'under_review' THEN 3
        ELSE 4
      END,
      sa.commission_percent ASC,
      sp.rating_avg DESC`,
    [propertyId]
  );

  // Calculate estimated commission amount for each application
  const enriched = applications.map(app => ({
    ...app,
    estimatedCommissionValue: (property.price * app.commission_percent) / 100
  }));

  return res.json({
    property: {
      id: property.id,
      title: property.title,
      price: property.price,
      status: property.status
    },
    applications: enriched
  });
});

// POST /api/applications/:id/accept: The Core Action - Owner chooses one seller
// Must execute in an ATOMIC database transaction to guarantee consistency!
router.post('/:id/accept', authenticate, requireRole(['owner']), validateParamId('id'), (req: Request, res: Response) => {
  const applicationId = req.params.id;
  const ownerId = req.user!.id;

  const app = queryOne<{
    id: string;
    property_id: string;
    seller_id: string;
    commission_percent: number;
    status: string;
    owner_id: string;
    prop_title: string;
    seller_name: string;
  }>(
    `SELECT
      sa.id, sa.property_id, sa.seller_id, sa.commission_percent, sa.status,
      p.owner_id, p.title as prop_title,
      sp.full_name as seller_name
    FROM seller_applications sa
    JOIN properties p ON sa.property_id = p.id
    JOIN seller_profiles sp ON sa.seller_id = sp.user_id
    WHERE sa.id = ?`,
    [applicationId]
  );

  if (!app) {
    return res.status(404).json({ error: 'Candidatura não encontrada.' });
  }

  if (app.owner_id !== ownerId) {
    return res.status(403).json({ error: 'Você só pode aceitar candidaturas para imóveis de sua propriedade.' });
  }

  const now = new Date().toISOString();

  // ATOMIC DATABASE TRANSACTION
  executeTransaction(() => {
    // 1. Accept the chosen application
    runQuery(
      `UPDATE seller_applications SET status = 'accepted', updated_at = ? WHERE id = ?`,
      [now, applicationId]
    );

    // 2. Reject all other active applications for this property
    runQuery(
      `UPDATE seller_applications SET status = 'rejected', updated_at = ? WHERE property_id = ? AND id != ? AND status != 'withdrawn'`,
      [now, app.property_id, applicationId]
    );

    // 3. Update property to seller_selected with assigned_seller_id
    runQuery(
      `UPDATE properties SET status = 'seller_selected', assigned_seller_id = ?, updated_at = ? WHERE id = ?`,
      [app.seller_id, now, app.property_id]
    );

    // 4. Notify the accepted seller
    const notifAcceptedId = 'notif_' + Date.now() + '_acc';
    runQuery(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, 'Candidatura aceita!', ?, ?, 0, ?)`,
      [
        notifAcceptedId,
        app.seller_id,
        `Você foi escolhido para representar a venda do imóvel "${app.prop_title}" com comissão de ${app.commission_percent}%.`,
        '/dashboard',
        now
      ]
    );

    // 5. Notify rejected applicants
    const rejectedSellers = queryAll<{ seller_id: string }>(
      `SELECT seller_id FROM seller_applications WHERE property_id = ? AND id != ? AND status = 'rejected'`,
      [app.property_id, applicationId]
    );

    rejectedSellers.forEach((rej, idx) => {
      const notifRejId = 'notif_' + Date.now() + '_rej_' + idx;
      runQuery(
        `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, 'Candidatura não selecionada', ?, ?, 0, ?)`,
        [
          notifRejId,
          rej.seller_id,
          `O proprietário do imóvel "${app.prop_title}" selecionou outro corretor para representação.`,
          '/dashboard',
          now
        ]
      );
    });
  });

  logAudit(
    ownerId,
    'APPLICATION_ACCEPTED',
    'seller_applications',
    applicationId,
    {
      propertyId: app.property_id,
      selectedSellerId: app.seller_id,
      commissionPercent: app.commission_percent
    },
    req
  );

  return res.json({
    message: `Corretor ${app.seller_name} selecionado com sucesso com comissão acordada de ${app.commission_percent}%. O imóvel agora o exibe publicamente como responsável pela venda.`,
    assignedSellerId: app.seller_id,
    commissionPercent: app.commission_percent
  });
});

// POST /api/applications/:id/withdraw: Seller withdraws their application before a decision
router.post('/:id/withdraw', authenticate, requireRole(['seller']), validateParamId('id'), (req: Request, res: Response) => {
  const applicationId = req.params.id;
  const sellerId = req.user!.id;

  const app = queryOne<{ id: string; seller_id: string; status: string }>(
    `SELECT id, seller_id, status FROM seller_applications WHERE id = ?`,
    [applicationId]
  );

  if (!app) {
    return res.status(404).json({ error: 'Candidatura não encontrada.' });
  }

  if (app.seller_id !== sellerId) {
    return res.status(403).json({ error: 'Você só pode retirar suas próprias candidaturas.' });
  }

  if (app.status === 'accepted') {
    return res.status(400).json({ error: 'Não é possível retirar uma candidatura que já foi aceita pelo proprietário.' });
  }

  const now = new Date().toISOString();
  runQuery(
    `UPDATE seller_applications SET status = 'withdrawn', updated_at = ? WHERE id = ?`,
    [now, applicationId]
  );

  logAudit(sellerId, 'APPLICATION_WITHDRAWN', 'seller_applications', applicationId, {}, req);

  return res.json({ message: 'Candidatura retirada com sucesso.' });
});

// GET /api/seller/my-applications: Autonomous seller gets their applied properties and statuses
router.get('/seller/my-applications', authenticate, requireRole(['seller']), (req: Request, res: Response) => {
  const sellerId = req.user!.id;

  const applications = queryAll(
    `SELECT
      sa.id, sa.property_id, sa.commission_percent, sa.message, sa.status, sa.created_at, sa.updated_at,
      p.title as property_title, p.price as property_price, p.city as property_city, p.neighborhood as property_neighborhood,
      p.status as property_status,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as property_image
    FROM seller_applications sa
    JOIN properties p ON sa.property_id = p.id
    WHERE sa.seller_id = ?
    ORDER BY sa.created_at DESC`,
    [sellerId]
  );

  return res.json({ applications });
});

// GET /api/seller/my-properties: Properties the seller currently represents (where their application was accepted)
router.get('/seller/my-properties', authenticate, requireRole(['seller']), (req: Request, res: Response) => {
  const sellerId = req.user!.id;

  const properties = queryAll(
    `SELECT
      p.*,
      sa.commission_percent,
      op.full_name as owner_name, op.phone as owner_phone,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM conversations WHERE property_id = p.id AND (participant1_id = ? OR participant2_id = ?)) as active_conversations_count
    FROM properties p
    JOIN seller_applications sa ON sa.property_id = p.id AND sa.seller_id = ? AND sa.status = 'accepted'
    JOIN owner_profiles op ON p.owner_id = op.user_id
    WHERE p.assigned_seller_id = ?
    ORDER BY p.updated_at DESC`,
    [sellerId, sellerId, sellerId, sellerId]
  );

  return res.json({ properties });
});

export default router;

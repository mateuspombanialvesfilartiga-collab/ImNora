import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, runQuery, executeTransaction } from '../db.js';
import { authenticate, requireRole, validateBody, validateParamId } from '../middleware.js';
import { logAudit } from '../security.js';

const router = Router();

// Schema for completing a sale negotiation
const completeSaleSchema = z.object({
  propertyId: z.string().min(1),
  buyerId: z.string().min(1),
  finalSalePrice: z.number().positive('Valor final de venda deve ser maior que zero.')
}).strict();

// POST /api/negotiations/complete: Conclude transaction with transparent commission breakdown
router.post('/complete', authenticate, requireRole(['owner', 'seller', 'admin']), validateBody(completeSaleSchema), (req: Request, res: Response) => {
  const { propertyId, buyerId, finalSalePrice } = req.body;
  const currentUserId = req.user!.id;

  const property = queryOne<{
    id: string;
    owner_id: string;
    assigned_seller_id: string | null;
    title: string;
    price: number;
    status: string;
  }>(`SELECT id, owner_id, assigned_seller_id, title, price, status FROM properties WHERE id = ?`, [propertyId]);

  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  if (!property.assigned_seller_id) {
    return res.status(400).json({ error: 'O imóvel ainda não possui um vendedor autônomo selecionado.' });
  }

  if (req.user!.role === 'owner' && property.owner_id !== currentUserId) {
    return res.status(403).json({ error: 'Apenas o proprietário ou o corretor responsável podem concluir esta venda.' });
  }

  if (req.user!.role === 'seller' && property.assigned_seller_id !== currentUserId) {
    return res.status(403).json({ error: 'Apenas o corretor autônomo selecionado pode registrar a conclusão desta venda.' });
  }

  // Get accepted commission percentage from application
  const app = queryOne<{ commission_percent: number }>(
    `SELECT commission_percent FROM seller_applications WHERE property_id = ? AND seller_id = ? AND status = 'accepted'`,
    [propertyId, property.assigned_seller_id]
  );

  const sellerCommissionPercent = app?.commission_percent || 5.0;

  // Get platform fee setting from platform_settings
  const platformSetting = queryOne<{ setting_value: number }>(
    `SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_percent'`
  );
  const platformFeePercent = platformSetting ? platformSetting.setting_value : 1.5;

  // Calculate transparent financial values
  const sellerCommissionValue = (finalSalePrice * sellerCommissionPercent) / 100;
  const platformFeeValue = (finalSalePrice * platformFeePercent) / 100;
  const netOwnerValue = finalSalePrice - sellerCommissionValue - platformFeeValue;

  const negId = 'neg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const transId = 'trans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  executeTransaction(() => {
    // 1. Create completed negotiation record
    runQuery(
      `INSERT INTO negotiations (
        id, property_id, seller_id, buyer_id, owner_id, sale_price,
        seller_commission_percent, platform_fee_percent, status, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [
        negId, propertyId, property.assigned_seller_id, buyerId, property.owner_id,
        finalSalePrice, sellerCommissionPercent, platformFeePercent, now, now
      ]
    );

    // 2. Create transaction record
    runQuery(
      `INSERT INTO transactions (
        id, negotiation_id, property_id, final_price, seller_commission_value,
        platform_fee_value, net_owner_value, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transId, negId, propertyId, finalSalePrice, sellerCommissionValue,
        platformFeeValue, netOwnerValue, now
      ]
    );

    // 3. Update property status to sold
    runQuery(`UPDATE properties SET status = 'sold', updated_at = ? WHERE id = ?`, [now, propertyId]);

    // 4. Increment seller's sales_count
    runQuery(`UPDATE seller_profiles SET sales_count = sales_count + 1 WHERE user_id = ?`, [property.assigned_seller_id]);

    // 5. Notify parties and prompt for review
    const promptBuyerNotif = 'notif_' + Date.now() + '_buyer';
    runQuery(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, 'Venda Concluída! Avalie seu corretor', ?, ?, 0, ?)`,
      [
        promptBuyerNotif,
        buyerId,
        `Parabéns pela aquisição de "${property.title}"! Deixe sua avaliação sobre o corretor autônomo.`,
        `/dashboard`,
        now
      ]
    );

    const promptOwnerNotif = 'notif_' + Date.now() + '_owner';
    runQuery(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, 'Imóvel Vendido! Avalie a representação', ?, ?, 0, ?)`,
      [
        promptOwnerNotif,
        property.owner_id,
        `Venda de "${property.title}" concluída com sucesso! Deixe sua avaliação para ajudar outros proprietários.`,
        `/dashboard`,
        now
      ]
    );
  });

  logAudit(currentUserId, 'SALE_COMPLETED', 'negotiations', negId, {
    propertyId,
    finalSalePrice,
    sellerCommissionValue,
    platformFeeValue,
    netOwnerValue
  }, req);

  return res.json({
    message: 'Venda concluída com sucesso! Os valores foram liquidados e o imóvel foi marcado como vendido.',
    negotiationId: negId,
    transaction: {
      finalSalePrice,
      sellerCommissionPercent,
      sellerCommissionValue,
      platformFeePercent,
      platformFeeValue,
      netOwnerValue
    }
  });
});

// GET /api/negotiations/eligible-buyers: Returns real buyers in the system or with conversations on this property
router.get('/eligible-buyers', authenticate, requireRole(['owner', 'seller', 'admin']), (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string | undefined;
  
  let leads: { id: string; name: string; email: string }[] = [];
  if (propertyId) {
    leads = queryAll<{ id: string; name: string; email: string }>(
      `SELECT DISTINCT u.id, u.name, u.email
       FROM conversations c
       JOIN users u ON c.buyer_id = u.id
       WHERE c.property_id = ?`,
      [propertyId]
    );
  }

  const registeredBuyers = queryAll<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE role = 'buyer' LIMIT 20`
  );

  const map = new Map<string, { id: string; name: string; email: string }>();
  leads.forEach(b => map.set(b.id, b));
  registeredBuyers.forEach(b => map.set(b.id, b));

  return res.json({ buyers: Array.from(map.values()) });
});

// GET /api/negotiations/pending-reviews: Returns completed negotiations awaiting user review
router.get('/pending-reviews', authenticate, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  if (role !== 'buyer' && role !== 'owner') {
    return res.json({ pendingReviews: [] });
  }

  const pending = queryAll(
    `SELECT
      n.id as negotiation_id, n.property_id, n.seller_id, n.sale_price, n.completed_at,
      p.title as property_title,
      sp.full_name as seller_name, sp.photo_url as seller_photo, sp.creci_number, sp.creci_state
    FROM negotiations n
    JOIN properties p ON n.property_id = p.id
    JOIN seller_profiles sp ON n.seller_id = sp.user_id
    LEFT JOIN reviews r ON r.negotiation_id = n.id AND r.reviewer_id = ?
    WHERE (n.buyer_id = ? OR n.owner_id = ?) AND n.status = 'completed' AND r.id IS NULL`,
    [userId, userId, userId]
  );

  return res.json({ pendingReviews: pending });
});

export default router;

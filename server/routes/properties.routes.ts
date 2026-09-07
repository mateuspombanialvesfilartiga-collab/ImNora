import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, runQuery, executeTransaction } from '../db.js';
import { authenticate, requireRole, validateBody, validateParamId } from '../middleware.js';
import { logAudit } from '../security.js';

const router = Router();

// GET /api/properties: Public search & filtering
router.get('/', (req: Request, res: Response) => {
  const { city, type, minPrice, maxPrice, bedrooms, statusFilter, search } = req.query;

  let sql = `
    SELECT
      p.id, p.owner_id, p.assigned_seller_id, p.title, p.description,
      p.property_type, p.price, p.address, p.neighborhood, p.city, p.state,
      p.bedrooms, p.bathrooms, p.suites, p.parking_spots, p.area_sqm,
      p.status, p.created_at,
      sp.full_name as seller_name, sp.creci_number as seller_creci, sp.creci_state as seller_creci_state,
      sp.rating_avg as seller_rating, sp.reviews_count as seller_reviews_count, sp.photo_url as seller_photo,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM seller_applications WHERE property_id = p.id AND status IN ('submitted', 'under_review')) as open_applications_count
    FROM properties p
    LEFT JOIN seller_profiles sp ON p.assigned_seller_id = sp.user_id
    WHERE p.status != 'draft' AND p.status != 'paused'
  `;

  const params: any[] = [];

  if (city && typeof city === 'string' && city.trim() !== '') {
    sql += ` AND LOWER(p.city) LIKE ?`;
    params.push(`%${city.toLowerCase().trim()}%`);
  }

  if (type && typeof type === 'string' && type.trim() !== '' && type !== 'all') {
    sql += ` AND p.property_type = ?`;
    params.push(type.trim());
  }

  if (minPrice && !isNaN(Number(minPrice))) {
    sql += ` AND p.price >= ?`;
    params.push(Number(minPrice));
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    sql += ` AND p.price <= ?`;
    params.push(Number(maxPrice));
  }

  if (bedrooms && !isNaN(Number(bedrooms)) && Number(bedrooms) > 0) {
    sql += ` AND p.bedrooms >= ?`;
    params.push(Number(bedrooms));
  }

  if (statusFilter === 'open_applications') {
    sql += ` AND p.status = 'published_open'`;
  } else if (statusFilter === 'seller_assigned') {
    sql += ` AND p.status IN ('seller_selected', 'in_negotiation')`;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    sql += ` AND (LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.neighborhood) LIKE ?)`;
    const term = `%${search.toLowerCase().trim()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT 100`;

  const properties = queryAll(sql, params);
  return res.json({ properties });
});

// GET /api/properties/cities: Dynamically returns distinct cities from registered properties
router.get('/cities', (req: Request, res: Response) => {
  const rows = queryAll<{ city: string; state: string; count: number }>(`
    SELECT
      TRIM(city) as city,
      TRIM(state) as state,
      COUNT(*) as count
    FROM properties
    WHERE city IS NOT NULL
      AND TRIM(city) != ''
      AND status NOT IN ('draft', 'paused')
    GROUP BY TRIM(LOWER(city)), TRIM(UPPER(state))
    ORDER BY city ASC
  `);

  const cities = rows.map(r => ({
    city: r.city,
    state: r.state || '',
    label: r.state ? `${r.city} - ${r.state}` : r.city,
    count: r.count
  }));

  return res.json({ cities });
});

// GET /api/properties/:id: Detail view
router.get('/:id', validateParamId('id'), (req: Request, res: Response) => {
  const propertyId = req.params.id;

  const property = queryOne<any>(
    `SELECT
      p.*,
      sp.full_name as seller_name, sp.creci_number as seller_creci, sp.creci_state as seller_creci_state,
      sp.rating_avg as seller_rating, sp.reviews_count as seller_reviews_count, sp.sales_count as seller_sales_count,
      sp.photo_url as seller_photo, sp.bio as seller_bio, sp.verified_status as seller_verified_status,
      op.full_name as owner_name,
      (SELECT COUNT(*) FROM seller_applications WHERE property_id = p.id AND status IN ('submitted', 'under_review')) as open_applications_count
    FROM properties p
    LEFT JOIN seller_profiles sp ON p.assigned_seller_id = sp.user_id
    LEFT JOIN owner_profiles op ON p.owner_id = op.user_id
    WHERE p.id = ?`,
    [propertyId]
  );

  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  // Fetch images and features
  const images = queryAll<{ id: string; image_url: string; is_primary: number }>(
    `SELECT id, image_url, is_primary FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, display_order ASC`,
    [propertyId]
  );

  const features = queryAll<{ feature_name: string }>(
    `SELECT feature_name FROM property_features WHERE property_id = ?`,
    [propertyId]
  ).map(f => f.feature_name);

  // Sanitized owner info (only safe public representation)
  const safeOwner = {
    id: property.owner_id,
    name: property.owner_name ? property.owner_name.split(' ')[0] + ' (Proprietário)' : 'Proprietário'
  };

  delete property.owner_name;

  return res.json({
    property: {
      ...property,
      images,
      features,
      owner: safeOwner
    }
  });
});

// Schema helper to sanitize and normalize image inputs
const imageItemSchema = z.union([
  z.string().min(1, 'URL de imagem não pode estar vazia.'),
  z.object({
    imageUrl: z.string().min(1),
    isPrimary: z.boolean().optional()
  }),
  z.object({
    url: z.string().min(1),
    isPrimary: z.boolean().optional()
  })
]);

// POST /api/properties: Owner creates new property
const propertySchema = z.object({
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres.').max(120),
  description: z.string().min(20, 'Descrição detalhada com no mínimo 20 caracteres.').max(3000),
  propertyType: z.string().min(2, 'Selecione o tipo de imóvel.'),
  price: z.number().positive('Preço deve ser maior que zero.'),
  address: z.string().min(3).max(200),
  neighborhood: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2).toUpperCase(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  suites: z.number().int().nonnegative().optional().default(0),
  parkingSpots: z.number().int().nonnegative().optional().default(0),
  areaSqm: z.number().positive('Área deve ser maior que zero.'),
  images: z.union([
    z.array(imageItemSchema).min(1, 'Inclua pelo menos uma foto do imóvel.'),
    imageItemSchema
  ]),
  features: z.array(z.string()).optional().default([])
});

router.post('/', authenticate, requireRole(['owner']), validateBody(propertySchema), (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    title, description, propertyType, price, address, neighborhood,
    city, state, bedrooms, bathrooms, suites, parkingSpots, areaSqm,
    images: rawImages, features
  } = req.body;

  // Normalize image items to array of clean URL strings
  const rawList = Array.isArray(rawImages) ? rawImages : [rawImages];
  const sanitizedImages: string[] = rawList.map((item: any) => {
    let url = typeof item === 'string' ? item.trim() : (item.imageUrl || item.url || '').trim();
    if (!url) {
      return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
    }
    // If it's a data URL or already has protocol, leave as is
    if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    // If user provided a domain/path without protocol (e.g. images.unsplash.com/...)
    return 'https://' + url;
  }).filter(Boolean);

  if (sanitizedImages.length === 0) {
    sanitizedImages.push('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80');
  }

  const propId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  executeTransaction(() => {
    runQuery(
      `INSERT INTO properties (
        id, owner_id, assigned_seller_id, title, description, property_type,
        price, address, neighborhood, city, state, bedrooms, bathrooms, suites,
        parking_spots, area_sqm, status, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published_open', ?, ?)`,
      [
        propId, userId, title, description, propertyType,
        price, address, neighborhood, city, state, bedrooms, bathrooms, suites,
        parkingSpots, areaSqm, now, now
      ]
    );

    // Insert images
    sanitizedImages.forEach((url: string, index: number) => {
      const imgId = 'img_' + Date.now() + '_' + index;
      runQuery(
        `INSERT INTO property_images (id, property_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?, ?)`,
        [imgId, propId, url, index === 0 ? 1 : 0, index]
      );
    });

    // Insert features
    (features || []).forEach((feat: string) => {
      const featId = 'feat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      runQuery(
        `INSERT INTO property_features (id, property_id, feature_name) VALUES (?, ?, ?)`,
        [featId, propId, feat]
      );
    });
  });

  logAudit(userId, 'PROPERTY_CREATED', 'properties', propId, { title, price, city }, req);

  return res.status(201).json({
    message: 'Imóvel publicado com sucesso! Ele agora está aberto a candidaturas de vendedores autônomos.',
    propertyId: propId
  });
});

// POST /api/properties/:id/reopen: Section 4.4 - Owner reopens property for new seller applications
router.post('/:id/reopen', authenticate, requireRole(['owner']), validateParamId('id'), (req: Request, res: Response) => {
  const propertyId = req.params.id;
  const userId = req.user!.id;

  const prop = queryOne<{ id: string; owner_id: string; assigned_seller_id: string | null; status: string }>(
    `SELECT id, owner_id, assigned_seller_id, status FROM properties WHERE id = ?`,
    [propertyId]
  );

  if (!prop) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  if (prop.owner_id !== userId) {
    return res.status(403).json({ error: 'Apenas o proprietário pode reabrir as candidaturas deste imóvel.' });
  }

  const previousSellerId = prop.assigned_seller_id;
  const now = new Date().toISOString();

  executeTransaction(() => {
    // Reset property status and clear assigned seller
    runQuery(
      `UPDATE properties SET status = 'published_open', assigned_seller_id = NULL, updated_at = ? WHERE id = ?`,
      [now, propertyId]
    );

    // Notify previous seller if one was assigned
    if (previousSellerId) {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      runQuery(
        `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, 'Representação de imóvel encerrada', 'O proprietário reabriu o imóvel para novas candidaturas.', '/dashboard', 0, ?)`,
        [notifId, previousSellerId, now]
      );
    }
  });

  logAudit(userId, 'PROPERTY_REOPENED_FOR_APPLICATIONS', 'properties', propertyId, { previousSellerId }, req);

  return res.json({
    message: 'Imóvel reaberto com sucesso para novas candidaturas de vendedores autônomos.'
  });
});

// GET /api/properties/owner/my-properties: Owner's list of properties with active applications
router.get('/owner/my-properties', authenticate, requireRole(['owner']), (req: Request, res: Response) => {
  const ownerId = req.user!.id;

  const properties = queryAll(
    `SELECT
      p.*,
      sp.full_name as seller_name, sp.creci_number as seller_creci, sp.creci_state as seller_creci_state,
      sp.rating_avg as seller_rating, sp.reviews_count as seller_reviews_count, sp.photo_url as seller_photo,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM seller_applications WHERE property_id = p.id) as total_applications_count,
      (SELECT COUNT(*) FROM seller_applications WHERE property_id = p.id AND status IN ('submitted', 'under_review')) as pending_applications_count
    FROM properties p
    LEFT JOIN seller_profiles sp ON p.assigned_seller_id = sp.user_id
    WHERE p.owner_id = ?
    ORDER BY p.created_at DESC`,
    [ownerId]
  );

  return res.json({ properties });
});

// POST /api/properties/:id/favorite: Buyer favorites
router.post('/:id/favorite', authenticate, requireRole(['buyer']), validateParamId('id'), (req: Request, res: Response) => {
  const propertyId = req.params.id;
  const buyerId = req.user!.id;

  const existing = queryOne(
    `SELECT id FROM property_favorites WHERE property_id = ? AND user_id = ?`,
    [propertyId, buyerId]
  );

  if (existing) {
    runQuery(`DELETE FROM property_favorites WHERE property_id = ? AND user_id = ?`, [propertyId, buyerId]);
    return res.json({ favorited: false, message: 'Imóvel removido dos favoritos.' });
  } else {
    const favId = 'fav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    runQuery(
      `INSERT INTO property_favorites (id, property_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
      [favId, propertyId, buyerId, new Date().toISOString()]
    );
    return res.json({ favorited: true, message: 'Imóvel adicionado aos favoritos.' });
  }
});

// GET /api/properties/buyer/favorites
router.get('/buyer/favorites', authenticate, requireRole(['buyer']), (req: Request, res: Response) => {
  const buyerId = req.user!.id;

  const favorites = queryAll(
    `SELECT
      p.id, p.title, p.property_type, p.price, p.neighborhood, p.city, p.state, p.bedrooms, p.bathrooms, p.area_sqm, p.status,
      sp.full_name as seller_name, sp.rating_avg as seller_rating,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM property_favorites pf
    JOIN properties p ON pf.property_id = p.id
    LEFT JOIN seller_profiles sp ON p.assigned_seller_id = sp.user_id
    WHERE pf.user_id = ?
    ORDER BY pf.created_at DESC`,
    [buyerId]
  );

  return res.json({ favorites });
});

export default router;

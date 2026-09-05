import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db.js';
import { validateParamId } from '../middleware.js';

const router = Router();

// GET /api/sellers: Public list of approved sellers
router.get('/', (req: Request, res: Response) => {
  const { state, search } = req.query;

  let sql = `
    SELECT
      u.id, sp.full_name, sp.creci_number, sp.creci_state, sp.bio, sp.photo_url,
      sp.rating_avg, sp.reviews_count, sp.sales_count,
      (SELECT COUNT(*) FROM properties WHERE assigned_seller_id = u.id AND status IN ('seller_selected', 'in_negotiation')) as active_listings_count
    FROM users u
    JOIN seller_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'seller' AND u.is_active = 1 AND sp.verified_status = 'approved'
  `;

  const params: any[] = [];

  if (state && typeof state === 'string' && state.trim().length === 2) {
    sql += ` AND sp.creci_state = ?`;
    params.push(state.toUpperCase().trim());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    sql += ` AND (LOWER(sp.full_name) LIKE ? OR LOWER(sp.creci_number) LIKE ? OR LOWER(sp.bio) LIKE ?)`;
    const term = `%${search.toLowerCase().trim()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY sp.sales_count DESC, sp.rating_avg DESC LIMIT 50`;

  const sellers = queryAll(sql, params);
  return res.json({ sellers });
});

// GET /api/sellers/:id: Public seller profile with represented properties
router.get('/:id', validateParamId('id'), (req: Request, res: Response) => {
  const sellerId = req.params.id;

  const seller = queryOne<any>(
    `SELECT
      u.id, sp.full_name, sp.creci_number, sp.creci_state, sp.bio, sp.photo_url,
      sp.verified_status, sp.rating_avg, sp.reviews_count, sp.sales_count,
      u.created_at as member_since
    FROM users u
    JOIN seller_profiles sp ON u.id = sp.user_id
    WHERE u.id = ? AND u.role = 'seller' AND u.is_active = 1 AND sp.verified_status = 'approved'`,
    [sellerId]
  );

  if (!seller) {
    return res.status(404).json({ error: 'Corretor autônomo não encontrado ou ainda não verificado.' });
  }

  // Fetch properties represented currently
  const representedProperties = queryAll(
    `SELECT
      p.id, p.title, p.price, p.neighborhood, p.city, p.state, p.bedrooms, p.bathrooms, p.area_sqm, p.status,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM properties p
    WHERE p.assigned_seller_id = ? AND p.status IN ('seller_selected', 'in_negotiation')
    ORDER BY p.updated_at DESC`,
    [sellerId]
  );

  return res.json({
    seller: {
      ...seller,
      representedProperties
    }
  });
});

export default router;

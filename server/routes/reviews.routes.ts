import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, runQuery, executeTransaction } from '../db.js';
import { authenticate, requireRole, validateBody, validateParamId } from '../middleware.js';
import { logAudit } from '../security.js';

const router = Router();

const reviewSchema = z.object({
  negotiationId: z.string().min(1),
  ratingService: z.number().min(1).max(5),
  ratingCommunication: z.number().min(1).max(5),
  ratingProfessionalism: z.number().min(1).max(5),
  ratingOverall: z.number().min(1).max(5),
  comment: z.string().max(1000).optional()
}).strict();

// POST /api/reviews: Submit seller review
router.post('/', authenticate, requireRole(['buyer', 'owner']), validateBody(reviewSchema), (req: Request, res: Response) => {
  const reviewerId = req.user!.id;
  const reviewerRole = req.user!.role as 'buyer' | 'owner';
  const {
    negotiationId, ratingService, ratingCommunication,
    ratingProfessionalism, ratingOverall, comment
  } = req.body;

  // 1. Verify negotiation exists and is completed
  const neg = queryOne<{
    id: string;
    property_id: string;
    seller_id: string;
    buyer_id: string;
    owner_id: string;
    status: string;
  }>(`SELECT id, property_id, seller_id, buyer_id, owner_id, status FROM negotiations WHERE id = ?`, [negotiationId]);

  if (!neg) {
    return res.status(404).json({ error: 'Negociação não encontrada.' });
  }

  if (neg.status !== 'completed') {
    return res.status(400).json({ error: 'Só é possível avaliar o vendedor após a conclusão definitiva da venda.' });
  }

  if (reviewerRole === 'buyer' && neg.buyer_id !== reviewerId) {
    return res.status(403).json({ error: 'Você não é o comprador participante desta negociação.' });
  }

  if (reviewerRole === 'owner' && neg.owner_id !== reviewerId) {
    return res.status(403).json({ error: 'Você não é o proprietário participante desta negociação.' });
  }

  // 2. Check for duplicate review (UNIQUE constraint enforcement)
  const existingReview = queryOne<{ id: string }>(
    `SELECT id FROM reviews WHERE negotiation_id = ? AND reviewer_id = ?`,
    [negotiationId, reviewerId]
  );

  if (existingReview) {
    return res.status(409).json({ error: 'Você já avaliou esta negociação. Cada participante pode avaliar apenas uma vez por venda.' });
  }

  const reviewId = 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  executeTransaction(() => {
    // Insert review
    runQuery(
      `INSERT INTO reviews (
        id, seller_id, reviewer_id, reviewer_role, negotiation_id,
        rating_service, rating_communication, rating_professionalism, rating_overall,
        comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewId, neg.seller_id, reviewerId, reviewerRole, negotiationId,
        ratingService, ratingCommunication, ratingProfessionalism, ratingOverall,
        comment || null, now
      ]
    );

    // Recalculate seller average rating and review count
    const stats = queryOne<{ count: number; avg_overall: number }>(
      `SELECT COUNT(*) as count, AVG(rating_overall) as avg_overall FROM reviews WHERE seller_id = ?`,
      [neg.seller_id]
    );

    const newCount = stats?.count || 1;
    const newAvg = Math.round((stats?.avg_overall || ratingOverall) * 10) / 10;

    runQuery(
      `UPDATE seller_profiles SET rating_avg = ?, reviews_count = ? WHERE user_id = ?`,
      [newAvg, newCount, neg.seller_id]
    );
  });

  logAudit(reviewerId, 'REVIEW_SUBMITTED', 'reviews', reviewId, { sellerId: neg.seller_id, ratingOverall }, req);

  return res.status(201).json({
    message: 'Avaliação registrada com sucesso! Agradecemos por contribuir com a transparência do elo.',
    reviewId
  });
});

// GET /api/reviews/seller/:sellerId: Public reviews on seller profile
router.get('/seller/:sellerId', validateParamId('sellerId'), (req: Request, res: Response) => {
  const sellerId = req.params.sellerId;

  const reviews = queryAll(
    `SELECT
      r.id, r.reviewer_role, r.rating_service, r.rating_communication,
      r.rating_professionalism, r.rating_overall, r.comment, r.created_at,
      p.title as property_title,
      CASE r.reviewer_role
        WHEN 'buyer' THEN (SELECT full_name FROM buyer_profiles WHERE user_id = r.reviewer_id)
        WHEN 'owner' THEN (SELECT full_name FROM owner_profiles WHERE user_id = r.reviewer_id)
      END as reviewer_full_name
    FROM reviews r
    JOIN negotiations n ON r.negotiation_id = n.id
    JOIN properties p ON n.property_id = p.id
    WHERE r.seller_id = ?
    ORDER BY r.created_at DESC`,
    [sellerId]
  );

  // Anonymize reviewer full name to "Primeiro Nome + Papel" for privacy (Section 11.7)
  const safeReviews = reviews.map(r => ({
    id: r.id,
    reviewerRole: r.reviewer_role === 'buyer' ? 'Comprador' : 'Proprietário',
    reviewerName: r.reviewer_full_name ? r.reviewer_full_name.split(' ')[0] : 'Cliente',
    ratingOverall: r.rating_overall,
    ratingService: r.rating_service,
    ratingCommunication: r.rating_communication,
    ratingProfessionalism: r.rating_professionalism,
    comment: r.comment,
    propertyTitle: r.property_title,
    createdAt: r.created_at
  }));

  return res.json({ reviews: safeReviews });
});

export default router;

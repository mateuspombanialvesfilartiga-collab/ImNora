import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, runQuery } from '../db.js';
import { authenticate, validateBody, validateParamId } from '../middleware.js';
import { logAudit } from '../security.js';

const router = Router();

// Permitted conversation flow validator (Section 6 & Section 11.9)
export function isConversationPairAllowed(roleA: string, roleB: string): { allowed: boolean; type?: 'buyer_seller' | 'seller_owner'; reason?: string } {
  const roles = [roleA, roleB].sort(); // alphabetical: ['buyer', 'seller'] or ['owner', 'seller'] etc.

  if (roles[0] === 'buyer' && roles[1] === 'seller') {
    return { allowed: true, type: 'buyer_seller' };
  }

  if (roles[0] === 'owner' && roles[1] === 'seller') {
    return { allowed: true, type: 'seller_owner' };
  }

  if (roles[0] === 'buyer' && roles[1] === 'owner') {
    return {
      allowed: false,
      reason: 'Regra de negócio violada: Compradores e proprietários não podem conversar diretamente. Todo contato deve ser intermediado pelo vendedor autônomo responsável.'
    };
  }

  if (roles[0] === roles[1]) {
    return {
      allowed: false,
      reason: `Conversas entre usuários do mesmo papel (${roles[0]} ↔ ${roles[1]}) não são permitidas na plataforma.`
    };
  }

  return { allowed: false, reason: 'Fluxo de conversa não autorizado.' };
}

// GET /api/conversations: List conversations for current authenticated user
router.get('/', authenticate, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const conversationType = req.query.type as string | undefined;

  let sql = `SELECT
      c.id, c.property_id, c.participant1_id, c.participant2_id, c.conversation_type, c.last_message_at, c.created_at,
      p.title as property_title, p.price as property_price,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as property_image,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND read_at IS NULL) as unread_count
    FROM conversations c
    JOIN properties p ON c.property_id = p.id
    WHERE (c.participant1_id = ? OR c.participant2_id = ?)`;
  const params: any[] = [userId, userId, userId];

  if (conversationType && (conversationType === 'buyer_seller' || conversationType === 'seller_owner')) {
    sql += ` AND c.conversation_type = ?`;
    params.push(conversationType);
  }

  sql += ` ORDER BY c.last_message_at DESC`;

  const conversations = queryAll(sql, params);

  // Enrich with peer information
  const enriched = conversations.map(conv => {
    const peerId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id;
    const peerUser = queryOne<{ id: string; role: string }>(`SELECT id, role FROM users WHERE id = ?`, [peerId]);

    let peerName = 'Usuário elo';
    let peerRole = peerUser?.role || 'user';
    let peerPhoto = null;
    let peerCreci = null;

    if (peerRole === 'seller') {
      const s = queryOne<{ full_name: string; photo_url: string; creci_number: string; creci_state: string }>(
        `SELECT full_name, photo_url, creci_number, creci_state FROM seller_profiles WHERE user_id = ?`,
        [peerId]
      );
      peerName = s?.full_name || 'Corretor';
      peerPhoto = s?.photo_url;
      peerCreci = s ? `${s.creci_number}/${s.creci_state}` : null;
    } else if (peerRole === 'owner') {
      const o = queryOne<{ full_name: string }>(`SELECT full_name FROM owner_profiles WHERE user_id = ?`, [peerId]);
      peerName = o?.full_name ? o.full_name.split(' ')[0] + ' (Proprietário)' : 'Proprietário';
    } else if (peerRole === 'buyer') {
      const b = queryOne<{ full_name: string }>(`SELECT full_name FROM buyer_profiles WHERE user_id = ?`, [peerId]);
      peerName = b?.full_name || 'Comprador Interessado';
    }

    return {
      ...conv,
      peer: {
        id: peerId,
        name: peerName,
        role: peerRole,
        photo: peerPhoto,
        creci: peerCreci
      }
    };
  });

  return res.json({ conversations: enriched });
});

// GET /api/conversations/:id/messages: Fetch messages in a conversation
router.get('/:id/messages', authenticate, validateParamId('id'), (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const userId = req.user!.id;

  const conv = queryOne<{ id: string; participant1_id: string; participant2_id: string; property_id: string }>(
    `SELECT id, participant1_id, participant2_id, property_id FROM conversations WHERE id = ?`,
    [conversationId]
  );

  if (!conv) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }

  if (conv.participant1_id !== userId && conv.participant2_id !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado a esta conversa privada.' });
  }

  // Mark unread messages sent by peer as read
  const now = new Date().toISOString();
  runQuery(
    `UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
    [now, conversationId, userId]
  );

  const messages = queryAll(
    `SELECT id, conversation_id, sender_id, content, read_at, created_at FROM messages
     WHERE conversation_id = ? ORDER BY created_at ASC`,
    [conversationId]
  );

  return res.json({ messages });
});

// Schema to create / initiate a conversation
const startConvSchema = z.object({
  propertyId: z.string().min(1),
  recipientId: z.string().min(1),
  initialMessage: z.string().min(1).max(2000)
}).strict();

// POST /api/conversations: Start conversation (strictly validates allowed participant pairs)
router.post('/', authenticate, validateBody(startConvSchema), (req: Request, res: Response) => {
  const senderId = req.user!.id;
  const senderRole = req.user!.role;
  const { propertyId, recipientId, initialMessage } = req.body;

  if (senderId === recipientId) {
    return res.status(400).json({ error: 'Você não pode iniciar uma conversa consigo mesmo.' });
  }

  const recipient = queryOne<{ id: string; role: string; is_active: number }>(
    `SELECT id, role, is_active FROM users WHERE id = ?`,
    [recipientId]
  );

  if (!recipient || recipient.is_active !== 1) {
    return res.status(404).json({ error: 'Destinatário não encontrado ou inativo.' });
  }

  // SECTION 11.9: Strict Role Pair Check
  const pairCheck = isConversationPairAllowed(senderRole, recipient.role);
  if (!pairCheck.allowed) {
    return res.status(403).json({ error: pairCheck.reason });
  }

  // Check if conversation already exists for this property and pair
  let conv = queryOne<{ id: string }>(
    `SELECT id FROM conversations WHERE property_id = ? AND (
      (participant1_id = ? AND participant2_id = ?) OR
      (participant1_id = ? AND participant2_id = ?)
    )`,
    [propertyId, senderId, recipientId, recipientId, senderId]
  );

  const now = new Date().toISOString();

  if (!conv) {
    const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    runQuery(
      `INSERT INTO conversations (id, property_id, participant1_id, participant2_id, conversation_type, last_message_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [convId, propertyId, senderId, recipientId, pairCheck.type!, now, now]
    );
    conv = { id: convId };
  }

  // Insert message
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  runQuery(
    `INSERT INTO messages (id, conversation_id, sender_id, content, read_at, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`,
    [msgId, conv.id, senderId, initialMessage, now]
  );

  // Update conversation last_message_at
  runQuery(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [now, conv.id]);

  // Create notification for recipient
  const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  runQuery(
    `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
     VALUES (?, ?, 'Nova mensagem recebida', ?, ?, 0, ?)`,
    [notifId, recipientId, `Você recebeu uma nova mensagem sobre o imóvel no elo.`, `/chat/${conv.id}`, now]
  );

  return res.status(201).json({
    conversationId: conv.id,
    messageId: msgId
  });
});

// Send message in existing conversation
const sendMsgSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode ser vazia.').max(2000)
}).strict();

router.post('/:id/messages', authenticate, validateParamId('id'), validateBody(sendMsgSchema), (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const senderId = req.user!.id;
  const { content } = req.body;

  const conv = queryOne<{ id: string; participant1_id: string; participant2_id: string; property_id: string }>(
    `SELECT id, participant1_id, participant2_id, property_id FROM conversations WHERE id = ?`,
    [conversationId]
  );

  if (!conv) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }

  if (conv.participant1_id !== senderId && conv.participant2_id !== senderId) {
    return res.status(403).json({ error: 'Você não faz parte desta conversa.' });
  }

  const recipientId = conv.participant1_id === senderId ? conv.participant2_id : conv.participant1_id;
  const now = new Date().toISOString();
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  runQuery(
    `INSERT INTO messages (id, conversation_id, sender_id, content, read_at, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`,
    [msgId, conversationId, senderId, content, now]
  );

  runQuery(`UPDATE conversations SET last_message_at = ? WHERE id = ?`, [now, conversationId]);

  return res.status(201).json({
    message: {
      id: msgId,
      conversationId,
      senderId,
      content,
      readAt: null,
      createdAt: now
    }
  });
});

export default router;

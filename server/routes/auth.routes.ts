import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { queryOne, runQuery, executeTransaction } from '../db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  checkAccountLockout,
  handleFailedLogin,
  handleSuccessfulLogin,
  logAudit,
  rateLimiter
} from '../security.js';
import { authenticate, validateBody } from '../middleware.js';

const router = Router();

// Validation schema for registration
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  email: z.string().email('E-mail em formato inválido.').max(120),
  password: z.string().regex(passwordRegex, 'A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula e um número.'),
  role: z.enum(['buyer', 'seller', 'owner', 'admin']),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(100),
  phone: z.string().min(8, 'Telefone inválido.').max(25).optional(),
  // Specific to seller
  creciNumber: z.string().max(30).optional(),
  creciState: z.string().length(2, 'Estado do CRECI deve ter 2 letras (ex: SP, RJ).').optional(),
  bio: z.string().max(1000).optional(),
  // Specific to owner
  documentNumber: z.string().max(30).optional()
}).strict(); // Rejects unknown fields!

// Rate limited: max 5 requests per minute
router.post('/register', rateLimiter(5, 60 * 1000), validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, role, fullName, phone, creciNumber, creciState, bio, documentNumber } = req.body;

  // Check if email exists
  const existing = queryOne<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
  if (existing) {
    return res.status(409).json({ error: 'Já existe um cadastro com este e-mail no sistema.' });
  }

  // Seller validation specifics
  if (role === 'seller') {
    if (!creciNumber || !creciState) {
      return res.status(400).json({ error: 'Número e Estado do CRECI são obrigatórios para cadastro de vendedor autônomo.' });
    }
  }

  const now = new Date().toISOString();
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const passwordHash = await bcrypt.hash(password, 12);

  executeTransaction(() => {
    // 1. Insert User
    runQuery(
      `INSERT INTO users (id, email, password_hash, role, is_active, failed_login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, ?, ?)`,
      [userId, email.toLowerCase().trim(), passwordHash, role, now, now]
    );

    // 2. Insert corresponding Profile
    if (role === 'buyer') {
      runQuery(
        `INSERT INTO buyer_profiles (user_id, full_name, phone) VALUES (?, ?, ?)`,
        [userId, fullName, phone || null]
      );
    } else if (role === 'owner') {
      runQuery(
        `INSERT INTO owner_profiles (user_id, full_name, phone, document_number) VALUES (?, ?, ?, ?)`,
        [userId, fullName, phone || null, documentNumber || null]
      );
    } else if (role === 'seller') {
      // MASS ASSIGNMENT PROTECTION: verified_status is strictly set to 'pending' by server
      runQuery(
        `INSERT INTO seller_profiles (user_id, full_name, phone, creci_number, creci_state, bio, photo_url, verified_status, rating_avg, reviews_count, sales_count)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending', 5.0, 0, 0)`,
        [userId, fullName, phone || null, creciNumber!.toUpperCase(), creciState!.toUpperCase(), bio || null]
      );

      // Create seller verification entry
      const verId = 'ver_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      runQuery(
        `INSERT INTO seller_verifications (id, seller_id, creci_number, creci_state, document_url, status, admin_notes, submitted_at)
         VALUES (?, ?, ?, ?, NULL, 'pending', 'Aguardando validação da documentação pelo administrador', ?)`,
        [verId, userId, creciNumber!.toUpperCase(), creciState!.toUpperCase(), now]
      );
    } else if (role === 'admin') {
      const adminId = 'adm_' + Date.now();
      runQuery(
        `INSERT INTO admin_users (id, user_id, access_level, created_at) VALUES (?, ?, 'superadmin', ?)`,
        [adminId, userId, now]
      );
    }
  });

  logAudit(userId, 'USER_REGISTERED', 'users', userId, { email: email.toLowerCase().trim(), role }, req);

  // Generate tokens
  const accessToken = generateAccessToken({ userId, role });
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(userId);

  runQuery(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [tokenHash, userId, expiresAt, now]
  );

  setRefreshTokenCookie(res, rawToken);

  return res.status(201).json({
    message: role === 'seller'
      ? 'Cadastro realizado com sucesso! Seu CRECI foi submetido para verificação.'
      : 'Cadastro realizado com sucesso!',
    token: accessToken,
    user: {
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      fullName,
      sellerVerifiedStatus: role === 'seller' ? 'pending' : undefined
    }
  });
});

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('E-mail inválido.').max(120),
  password: z.string().min(1, 'Senha é obrigatória.').max(100)
}).strict();

// Rate limited: max 5 requests per minute
router.post('/login', rateLimiter(5, 60 * 1000), validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = queryOne<{
    id: string;
    email: string;
    password_hash: string;
    role: 'buyer' | 'seller' | 'owner' | 'admin';
    is_active: number;
    failed_login_attempts: number;
    locked_until: string | null;
  }>(
    `SELECT id, email, password_hash, role, is_active, failed_login_attempts, locked_until FROM users WHERE email = ?`,
    [normalizedEmail]
  );

  // Generic failure message to prevent email enumeration
  const genericError = 'E-mail ou senha inválidos.';

  if (!user) {
    return res.status(401).json({ error: genericError });
  }

  // Check account lockout
  const lockout = checkAccountLockout(user);
  if (lockout.isLocked) {
    return res.status(423).json({
      error: `Conta bloqueada temporariamente após múltiplas tentativas incorretas. Tente novamente em ${lockout.remainingMinutes} minutos.`
    });
  }

  if (user.is_active !== 1) {
    return res.status(403).json({ error: 'Esta conta foi suspensa ou desativada.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    handleFailedLogin(user.id, user.failed_login_attempts);
    logAudit(user.id, 'LOGIN_FAILED', 'users', user.id, { reason: 'bad_credentials' }, req);
    return res.status(401).json({ error: genericError });
  }

  // Reset failed attempts on success
  handleSuccessfulLogin(user.id);

  // Fetch role-specific details
  let fullName = '';
  let sellerVerifiedStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'suspended' | undefined;

  if (user.role === 'buyer') {
    const b = queryOne<{ full_name: string }>(`SELECT full_name FROM buyer_profiles WHERE user_id = ?`, [user.id]);
    fullName = b?.full_name || '';
  } else if (user.role === 'owner') {
    const o = queryOne<{ full_name: string }>(`SELECT full_name FROM owner_profiles WHERE user_id = ?`, [user.id]);
    fullName = o?.full_name || '';
  } else if (user.role === 'seller') {
    const s = queryOne<{ full_name: string; verified_status: any }>(
      `SELECT full_name, verified_status FROM seller_profiles WHERE user_id = ?`,
      [user.id]
    );
    fullName = s?.full_name || '';
    sellerVerifiedStatus = s?.verified_status;
  } else if (user.role === 'admin') {
    fullName = 'Administrador do elo';
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(user.id);
  const now = new Date().toISOString();

  runQuery(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [tokenHash, user.id, expiresAt, now]
  );

  setRefreshTokenCookie(res, rawToken);
  logAudit(user.id, 'LOGIN_SUCCESS', 'users', user.id, { role: user.role }, req);

  return res.json({
    token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName,
      sellerVerifiedStatus
    }
  });
});

// Demo endpoints retired: Only genuine registered profiles connected to database are supported
router.post('/quick-role-switch', (req: Request, res: Response) => {
  return res.status(400).json({
    error: 'Perfis de demonstração foram desativados. Cadastre um perfil verídico no sistema para acessar seu dashboard.'
  });
});

router.post('/demo-login', (req: Request, res: Response) => {
  return res.status(400).json({
    error: 'Perfis de demonstração foram desativados. Cadastre um perfil verídico no sistema para acessar seu dashboard.'
  });
});

// Refresh token rotation
router.post('/refresh', async (req: Request, res: Response) => {
  const rawToken = req.cookies?.elo_refresh_token;
  if (!rawToken) {
    return res.status(401).json({ error: 'Refresh token não fornecido.' });
  }

  const incomingHash = hashToken(rawToken);
  const stored = queryOne<{ token_hash: string; user_id: string; expires_at: string; revoked_at: string | null }>(
    `SELECT token_hash, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?`,
    [incomingHash]
  );

  if (!stored || stored.revoked_at || new Date(stored.expires_at).getTime() < Date.now()) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: 'Sessão expirada ou token revogado.' });
  }

  // Verify user still active
  const user = queryOne<{ id: string; role: 'buyer' | 'seller' | 'owner' | 'admin'; is_active: number }>(
    `SELECT id, role, is_active FROM users WHERE id = ?`,
    [stored.user_id]
  );

  if (!user || user.is_active !== 1) {
    clearRefreshTokenCookie(res);
    return res.status(403).json({ error: 'Conta inativa ou suspensa.' });
  }

  // Invalidate old token and issue new rotated token
  const now = new Date().toISOString();
  runQuery(`UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?`, [now, incomingHash]);

  const newAccess = generateAccessToken({ userId: user.id, role: user.role });
  const { rawToken: newRaw, tokenHash: newHash, expiresAt: newExpires } = generateRefreshToken(user.id);

  runQuery(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [newHash, user.id, newExpires, now]
  );

  setRefreshTokenCookie(res, newRaw);

  return res.json({ token: newAccess });
});

// Logout: revoke refresh token
router.post('/logout', (req: Request, res: Response) => {
  const rawToken = req.cookies?.elo_refresh_token;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    runQuery(`UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?`, [new Date().toISOString(), tokenHash]);
  }
  clearRefreshTokenCookie(res);
  return res.json({ message: 'Desconectado com sucesso.' });
});

// Current User Profile (safe projection)
router.get('/me', authenticate, (req: Request, res: Response) => {
  const u = req.user!;
  let profileData: any = {};

  if (u.role === 'buyer') {
    profileData = queryOne(`SELECT full_name, phone, preferences FROM buyer_profiles WHERE user_id = ?`, [u.id]);
  } else if (u.role === 'owner') {
    profileData = queryOne(`SELECT full_name, phone, document_number FROM owner_profiles WHERE user_id = ?`, [u.id]);
  } else if (u.role === 'seller') {
    profileData = queryOne(
      `SELECT full_name, phone, creci_number, creci_state, bio, photo_url, verified_status, rating_avg, reviews_count, sales_count
       FROM seller_profiles WHERE user_id = ?`,
      [u.id]
    );
  }

  // Count unread notifications
  const notifCount = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [u.id]
  );

  return res.json({
    user: {
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      sellerVerifiedStatus: u.sellerVerifiedStatus,
      unreadNotifications: notifCount?.count || 0,
      profile: profileData || {}
    }
  });
});

export default router;

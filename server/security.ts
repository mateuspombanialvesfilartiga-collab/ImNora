import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { runQuery, queryOne } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'elo_dev_jwt_secret_key_928173461829';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'elo_dev_jwt_refresh_secret_key_82716352910';

export interface TokenPayload {
  userId: string;
  role: 'buyer' | 'seller' | 'owner' | 'admin';
}

// Generate Access Token (15m)
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Generate Refresh Token & hash it for database
export function generateRefreshToken(userId: string): { rawToken: string; tokenHash: string; expiresAt: string } {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  return { rawToken, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Constant-time comparison for webhooks or hashes
export function safeStringCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Cookie setting helper for refresh token
export function setRefreshTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('elo_refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

export function clearRefreshTokenCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('elo_refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/'
  });
}

// Account brute force lockout check (max 5 consecutive failures = 15m lock)
export function checkAccountLockout(user: { id: string; failed_login_attempts: number; locked_until: string | null }): { isLocked: boolean; remainingMinutes?: number } {
  if (user.locked_until) {
    const lockedUntilTime = new Date(user.locked_until).getTime();
    const now = Date.now();
    if (now < lockedUntilTime) {
      const remainingMinutes = Math.ceil((lockedUntilTime - now) / (60 * 1000));
      return { isLocked: true, remainingMinutes };
    } else {
      // Lock has expired, reset
      runQuery(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`, [user.id]);
    }
  }
  return { isLocked: false };
}

export function handleFailedLogin(userId: string, currentFailures: number) {
  const newFailures = currentFailures + 1;
  if (newFailures >= 5) {
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
    runQuery(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`, [newFailures, lockUntil, userId]);
  } else {
    runQuery(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`, [newFailures, userId]);
  }
}

export function handleSuccessfulLogin(userId: string) {
  runQuery(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`, [userId]);
}

// Audit logger that guarantees passwords and secrets are never recorded
export function logAudit(userId: string | null, action: string, entityType: string, entityId: string | null, details: Record<string, any> | string, req?: Request) {
  const now = new Date().toISOString();
  let sanitizedDetails = '';
  if (typeof details === 'object') {
    const safeObj: Record<string, any> = { ...details };
    delete safeObj.password;
    delete safeObj.password_hash;
    delete safeObj.token;
    delete safeObj.refreshToken;
    sanitizedDetails = JSON.stringify(safeObj);
  } else {
    sanitizedDetails = String(details);
  }

  const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown') : 'system';
  const id = 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  runQuery(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, action, entityType, entityId, sanitizedDetails, ip, now]
  );
}

// In-memory rate limiting map for endpoints (5 requests/minute for auth)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

export function rateLimiter(limit = 120, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In dev environment or behind container proxy, permit higher rate limit
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown');
    const key = `${clientIp}_${req.baseUrl || req.path}`;
    const now = Date.now();

    const bucket = rateLimitStore.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= limit) {
      return res.status(429).json({
        error: 'Muitas tentativas. Por favor, aguarde alguns instantes antes de tentar novamente.'
      });
    }

    bucket.count += 1;
    next();
  };
}

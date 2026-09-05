import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './security.js';
import { queryOne } from './db.js';
import { ZodSchema, ZodError } from 'zod';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'buyer' | 'seller' | 'owner' | 'admin';
  isActive: boolean;
  sellerVerifiedStatus?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'suspended';
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Session revalidation on EVERY authenticated request against the database
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação necessária. Token ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload || !payload.userId) {
    return res.status(401).json({ error: 'Sessão expirada ou token inválido. Faça login novamente.' });
  }

  // Revalidate against DB: active, not locked, not deleted
  const user = queryOne<{
    id: string;
    email: string;
    role: 'buyer' | 'seller' | 'owner' | 'admin';
    is_active: number;
    locked_until: string | null;
  }>(
    `SELECT id, email, role, is_active, locked_until FROM users WHERE id = ?`,
    [payload.userId]
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado ou removido.' });
  }

  if (user.is_active !== 1) {
    return res.status(403).json({ error: 'Esta conta foi suspensa ou desativada.' });
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return res.status(403).json({ error: 'Conta bloqueada temporariamente devido a tentativas incorretas.' });
  }

  let sellerStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'suspended' | undefined;
  let fullName: string | undefined;

  if (user.role === 'seller') {
    const seller = queryOne<{ verified_status: any; full_name: string }>(
      `SELECT verified_status, full_name FROM seller_profiles WHERE user_id = ?`,
      [user.id]
    );
    sellerStatus = seller?.verified_status;
    fullName = seller?.full_name;

    // Check if seller was suspended
    if (sellerStatus === 'suspended') {
      return res.status(403).json({ error: 'O cadastro deste vendedor autônomo está suspenso.' });
    }
  } else if (user.role === 'owner') {
    const owner = queryOne<{ full_name: string }>(
      `SELECT full_name FROM owner_profiles WHERE user_id = ?`,
      [user.id]
    );
    fullName = owner?.full_name;
  } else if (user.role === 'buyer') {
    const buyer = queryOne<{ full_name: string }>(
      `SELECT full_name FROM buyer_profiles WHERE user_id = ?`,
      [user.id]
    );
    fullName = buyer?.full_name;
  } else if (user.role === 'admin') {
    fullName = 'Administrador do elo';
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: true,
    sellerVerifiedStatus: sellerStatus,
    fullName
  };

  next();
}

// Middleware to enforce specific roles (role comes strictly from DB session, never from client body)
export function requireRole(allowedRoles: ('buyer' | 'seller' | 'owner' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Ação restrita a usuários com perfil: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

// Validate request body using Zod schema, rejecting unexpected fields (.strict())
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const msg = issues.map((i: any) => `${i.path.join('.') || 'campo'}: ${i.message}`).join('; ');
        return res.status(400).json({ error: `Dados inválidos: ${msg}` });
      }
      return res.status(400).json({ error: 'Corpo da requisição inválido.' });
    }
  };
}

// Safe ID parameter validator to avoid DB crash / injection
export function validateParamId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName];
    if (!val || typeof val !== 'string' || val.trim().length === 0 || val.length > 80 || !/^[a-zA-Z0-9_\-]+$/.test(val)) {
      return res.status(400).json({ error: `Identificador '${paramName}' inválido.` });
    }
    next();
  };
}

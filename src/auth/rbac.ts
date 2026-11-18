import type { NextFunction, Request, Response } from 'express';

export type Role = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; tenantId: string; role: Role };
    }
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      res.status(role ? 403 : 401).json({ error: role ? 'Forbidden' : 'Unauthorized' });
      return;
    }
    next();
  };
}

export const ownerOnly = requireRole('OWNER');
export const adminOrOwner = requireRole('OWNER', 'ADMIN');
export const accountingRoles = requireRole('OWNER', 'ADMIN', 'ACCOUNTANT');

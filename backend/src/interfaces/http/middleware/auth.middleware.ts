// src/interfaces/http/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/app.config';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError';
import { UserRole } from '../../../domain/entities/User.entity';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  franchiseId?: string;
  permissions: Record<string, boolean>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(err);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Insufficient role permissions. Required: ${roles.join(', ')}, Got: ${req.user?.role}`));
      return;
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!req.user.permissions[permission]) {
      next(new ForbiddenError(`Missing permission: ${permission}`));
      return;
    }
    next();
  };
};

/**
 * A coach is locked to the single franchise they were assigned at login —
 * their JWT always carries that franchiseId, and the frontend never lets
 * them pick another one. This middleware is the server-side backstop for
 * that rule: even if a request is crafted by hand (or a stale client sends
 * a leftover franchiseId), a coach can never read or write data scoped to
 * a franchise other than their own. Managers and super_admins are
 * untouched — they're allowed to operate across franchises/academies.
 */
export const enforceCoachOwnFranchise = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  if (req.user.role !== 'coach') {
    next();
    return;
  }
  const requestedFranchiseId =
    (req.query.franchiseId as string | undefined) ?? (req.body?.franchiseId as string | undefined);
  if (requestedFranchiseId && req.user.franchiseId && requestedFranchiseId !== req.user.franchiseId) {
    next(new ForbiddenError('You can only access data within your assigned franchise'));
    return;
  }
  next();
};
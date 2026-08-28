import { Request, Response, NextFunction } from 'express';
import { authService, AuthJwtPayload } from '../services/auth.service';
import { AppError } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthJwtPayload;
    }
  }
}

/**
 * Middleware that strictly enforces valid JWT authentication
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware that attaches user payload if valid token is present, but does not block if omitted
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = authService.verifyToken(token);
    } catch {
      // Ignore token parse failure for optional auth
    }
  }
  next();
}

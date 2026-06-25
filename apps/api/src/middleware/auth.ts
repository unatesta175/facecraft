import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { env } from '../config/env';
import { prisma } from '../services/database.service';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  isPhotographer: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = jwt.verify(token, env.SESSION_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AuthenticationError('Invalid authentication token');
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: [user.role],
      permissions: [],
      isPhotographer: user.isPhotographer,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid authentication token'));
    } else {
      next(error);
    }
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const hasRole = allowedRoles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(
        new AuthorizationError(`Required roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
}

export function requirePhotographer(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationError());
  }

  if (!req.user.isPhotographer && !req.user.roles.includes('ADMIN')) {
    return next(new AuthorizationError('Photographer access required'));
  }

  next();
}

export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const hasPermission = requiredPermissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new AuthorizationError(`Required permissions: ${requiredPermissions.join(', ')}`)
      );
    }

    next();
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

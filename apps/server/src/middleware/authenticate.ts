import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Verify session is still active
    const session = await prisma.session.findUnique({
      where: { jti: payload.jti },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Session expired or revoked', 401, 'SESSION_EXPIRED');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

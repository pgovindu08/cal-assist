import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export async function createSession(userId: string) {
  const refreshExpiryMs = parseExpiry(env.JWT_REFRESH_EXPIRY);
  const expiresAt = new Date(Date.now() + refreshExpiryMs);

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const accessToken = signAccessToken(userId, session.jti);
  const refreshToken = signRefreshToken(userId, session.jti);

  return { accessToken, refreshToken, session };
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const session = await prisma.session.findUnique({
    where: { jti: payload.jti },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new AppError('Session expired or invalid', 401, 'SESSION_EXPIRED');
  }

  const accessToken = signAccessToken(session.userId, session.jti);
  return { accessToken, user: session.user };
}

export async function revokeSession(jti: string) {
  await prisma.session.deleteMany({ where: { jti } });
}

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000; // 7 days
  }
}

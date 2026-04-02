import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  jti: string;
  type: 'access' | 'refresh';
}

// jsonwebtoken v9 requires StringValue (branded string) for expiresIn — cast via unknown
type Expiry = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

export function signAccessToken(userId: string, jti: string): string {
  return jwt.sign({ userId, jti, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as unknown as Expiry,
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ userId, jti, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as unknown as Expiry,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

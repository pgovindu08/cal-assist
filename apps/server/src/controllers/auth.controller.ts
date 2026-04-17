import type { Request, Response, NextFunction } from 'express';
import type { User } from '@prisma/client';
import { z } from 'zod';
import { createSession, refreshSession, revokeSession } from '../services/auth.service';
import { register, login } from '../services/local-auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const REFRESH_COOKIE_NAME = 'calassist_refresh';
const isProduction = env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { accessToken, refreshToken } = await createSession(user.id);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

    // Detect platform — iOS app passes ?platform=ios which is encoded in OAuth state
    const platform = (req as any).oauthPlatform || 'web';

    if (platform === 'ios') {
      // Redirect back to iOS app via custom URL scheme
      // ASWebAuthenticationSession will intercept calassist://auth/callback
      res.redirect(
        `calassist://auth/callback?token=${encodeURIComponent(accessToken)}`
      );
    } else {
      // Standard web redirect
      res.redirect(
        `${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`
      );
    }
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      sendError(res, 'No refresh token', 401, 'NO_REFRESH_TOKEN');
      return;
    }

    const { accessToken, user } = await refreshSession(token);
    sendSuccess(res, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      const payload = verifyRefreshToken(token);
      await revokeSession(payload.jti);
    }

    res.clearCookie(REFRESH_COOKIE_NAME);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export function me(req: Request, res: Response): void {
  const user = (req as AuthenticatedRequest).user;
  sendSuccess(res, { user });
}

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function registerLocal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.safeParse(req.body);
    if (!input.success) {
      sendError(res, input.error.errors[0]?.message ?? 'Invalid input', 400, 'VALIDATION_ERROR');
      return;
    }

    const { accessToken, refreshToken, user } = await register(
      input.data.email,
      input.data.name,
      input.data.password
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user }, 201);
  } catch (err) {
    next(err);
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginLocal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.safeParse(req.body);
    if (!input.success) {
      sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      return;
    }

    const { accessToken, refreshToken, user } = await login(input.data.email, input.data.password);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
}

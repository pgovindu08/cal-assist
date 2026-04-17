import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, refresh, logout, me, registerLocal, loginLocal } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { env } from '../config/env';

const router = Router();

// Redirect to Google OAuth consent screen
// Supports ?platform=ios to redirect back to the iOS app via custom URL scheme
router.get(
  '/google',
  authRateLimiter,
  (req, res, next) => {
    const platform = (req.query.platform as string) || 'web';
    const state = Buffer.from(JSON.stringify({ platform })).toString('base64');
    passport.authenticate('google', {
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      accessType: 'offline',
      prompt: 'consent', // Force refresh token on every auth
      session: false,
      state,
    } as object)(req, res, next);
  }
);

// OAuth callback
router.get(
  '/google/callback',
  (req, res, next) => {
    const state = req.query.state as string | undefined;
    let platform = 'web';
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        platform = decoded.platform || 'web';
      } catch { /* ignore malformed state */ }
    }
    (req as any).oauthPlatform = platform;
    passport.authenticate('google', {
      failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed`,
      session: false,
    })(req, res, next);
  },
  googleCallback
);

// Email/password auth
router.post('/register', authRateLimiter, registerLocal);
router.post('/login', authRateLimiter, loginLocal);

// Token refresh
router.post('/refresh', refresh);

// Logout
router.post('/logout', authenticate, logout);

// Current user
router.get('/me', authenticate, me);

export default router;

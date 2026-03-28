import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, refresh, logout, me, registerLocal, loginLocal } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Redirect to Google OAuth consent screen
router.get(
  '/google',
  authRateLimiter,
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
    ],
    accessType: 'offline',
    prompt: 'consent', // Force refresh token on every auth
    session: false,
  })
);

// OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed', session: false }),
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

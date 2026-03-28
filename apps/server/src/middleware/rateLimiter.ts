import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse';

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests. Please wait a moment before trying again.', 429, 'RATE_LIMIT');
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many auth attempts. Please try again later.', 429, 'AUTH_RATE_LIMIT');
  },
});

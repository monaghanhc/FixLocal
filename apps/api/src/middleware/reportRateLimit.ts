import rateLimit from 'express-rate-limit';
import { env } from '../env.js';

export const reportRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many report requests. Please try again in a minute.',
  },
});

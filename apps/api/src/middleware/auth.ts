import { type NextFunction, type Request, type Response } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../env.js';

const jwtSecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
};

export const requireSupabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token.' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: ['HS256'],
    });

    if (typeof payload.sub !== 'string') {
      res.status(401).json({ error: 'Invalid auth token payload.' });
      return;
    }

    req.auth = {
      userId: payload.sub,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired auth token.' });
  }
};

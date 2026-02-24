import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from './env.js';
import { reportRouter } from './routes/reportRoutes.js';

export const app = express();
app.set('trust proxy', 1);

const corsOrigin = env.API_CORS_ORIGIN.trim();
const corsOrigins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins === '*' ? true : corsOrigins,
  }),
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', reportRouter);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  void next;
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed.',
      details: error.issues,
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({
      error: 'Malformed request body.',
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: error.message,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown server error.';
  res.status(500).json({
    error: message,
  });
});

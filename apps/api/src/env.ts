import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('report-photos'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  EMAIL_REPLY_TO: z.string().email().optional(),
  DEFAULT_CONTACT_NAME: z.string().default('311 Public Works Intake'),
  DEFAULT_CONTACT_EMAIL: z.string().email().default('311@example.gov'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(10),
});

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const parsed = envSchema.safeParse(
  isTestEnv
    ? {
        PORT: 4000,
        NODE_ENV: 'test',
        API_CORS_ORIGIN: '*',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_JWT_SECRET: 'test-jwt-secret',
        SUPABASE_STORAGE_BUCKET: 'report-photos',
        OPENAI_MODEL: 'gpt-4.1-mini',
        RESEND_API_KEY: 'test-resend-key',
        EMAIL_FROM: 'FixLocal Reports <reports@example.com>',
        DEFAULT_CONTACT_NAME: '311 Public Works Intake',
        DEFAULT_CONTACT_EMAIL: '311@example.gov',
        RATE_LIMIT_WINDOW_MS: 60000,
        RATE_LIMIT_MAX: 10,
        ...process.env,
      }
    : process.env,
);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${formatted}`);
}

export const env = parsed.data;

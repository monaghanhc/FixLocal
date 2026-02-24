import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  throw new Error('Missing Supabase credentials in environment.');
}

const argMap = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value];
  }),
);

const payloadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3).max(12).optional(),
  phone: z.string().optional(),
  is_default: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

const parsedPayload = payloadSchema.parse(argMap);

const supabase = createClient(parsedEnv.data.SUPABASE_URL, parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const run = async () => {
  const { data, error } = await supabase
    .from('authorities')
    .insert({
      name: parsedPayload.name,
      email: parsedPayload.email,
      city: parsedPayload.city,
      state: parsedPayload.state,
      zip: parsedPayload.zip ?? null,
      phone: parsedPayload.phone ?? null,
      is_default: parsedPayload.is_default ?? false,
    })
    .select('id, name, email, city, state, zip, is_default')
    .single();

  if (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }

  console.log('Authority added:', data);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

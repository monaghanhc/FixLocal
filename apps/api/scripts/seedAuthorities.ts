import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error('Missing Supabase credentials in environment.');
}

const supabase = createClient(parsed.data.SUPABASE_URL, parsed.data.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const seedRecords = [
  {
    name: 'San Francisco Public Works',
    email: 'pw@sfgov.org',
    phone: '415-554-6920',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    is_default: false,
  },
  {
    name: 'Austin Transportation and Public Works',
    email: 'transportation@austintexas.gov',
    phone: '512-974-2000',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    is_default: false,
  },
  {
    name: '311 Public Works Intake',
    email: '311@example.gov',
    phone: '311',
    city: 'Default',
    state: 'US',
    zip: null,
    is_default: true,
  },
];

const run = async () => {
  const { error } = await supabase.from('authorities').upsert(seedRecords, {
    onConflict: 'email',
  });

  if (error) {
    throw new Error(`Seed failed: ${error.message}`);
  }

  console.log(`Seeded ${seedRecords.length} authority records.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

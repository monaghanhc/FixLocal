import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config';

const fallbackUrl = 'https://example.supabase.co';
const fallbackAnonKey = 'invalid-anon-key';

export const supabase = createClient(
  appConfig.supabaseUrl || fallbackUrl,
  appConfig.supabaseAnonKey || fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

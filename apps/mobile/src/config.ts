const readEnv = (key: string): string => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const appConfig = {
  apiBaseUrl: readEnv('EXPO_PUBLIC_API_URL') || 'http://10.0.2.2:4000',
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
};

export const hasSupabaseConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);

import Constants from 'expo-constants';

type AppExtra = {
  apiUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

const readEnv = (key: string): string => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const readValue = (publicEnvKey: string, fallbackFromExtra?: string): string => {
  return readEnv(publicEnvKey) || fallbackFromExtra?.trim() || '';
};

const devFallbackApiBaseUrl = 'http://10.0.2.2:4000';

export const appConfig = {
  apiBaseUrl: readValue('EXPO_PUBLIC_API_URL', extra.apiUrl) || (__DEV__ ? devFallbackApiBaseUrl : ''),
  supabaseUrl: readValue('EXPO_PUBLIC_SUPABASE_URL', extra.supabaseUrl),
  supabaseAnonKey: readValue('EXPO_PUBLIC_SUPABASE_ANON_KEY', extra.supabaseAnonKey),
};

export const hasSupabaseConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
export const hasApiConfig = Boolean(appConfig.apiBaseUrl);

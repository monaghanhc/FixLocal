import type { ConfigContext, ExpoConfig } from 'expo/config';

const readEnv = (key: string, fallback = ''): string => {
  const value = process.env[key];
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = readEnv('EXPO_PUBLIC_EAS_PROJECT_ID');

  return {
    ...config,
    name: readEnv('EXPO_APP_NAME', 'FixLocal'),
    slug: readEnv('EXPO_APP_SLUG', 'fixlocal'),
    version: readEnv('EXPO_APP_VERSION', '1.0.0'),
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'fixlocal',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: readEnv('EXPO_IOS_BUNDLE_ID', 'com.fixlocal.app'),
      buildNumber: readEnv('EXPO_IOS_BUILD_NUMBER', '1'),
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'FixLocal uses your location to route civic reports to the right authority.',
        NSCameraUsageDescription: 'FixLocal uses your camera to capture photos of civic issues.',
        NSPhotoLibraryUsageDescription:
          'FixLocal accesses your photo library so you can attach issue photos.',
      },
    },
    android: {
      package: readEnv('EXPO_ANDROID_PACKAGE', 'com.fixlocal.app'),
      versionCode: Number.parseInt(readEnv('EXPO_ANDROID_VERSION_CODE', '1'), 10),
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['ACCESS_FINE_LOCATION', 'CAMERA', 'READ_EXTERNAL_STORAGE'],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', 'expo-image-picker', 'expo-location'],
    experiments: {
      typedRoutes: true,
    },
    updates: easProjectId
      ? {
          url: `https://u.expo.dev/${easProjectId}`,
        }
      : undefined,
    extra: {
      eas: easProjectId
        ? {
            projectId: easProjectId,
          }
        : undefined,
      apiUrl: readEnv('EXPO_PUBLIC_API_URL'),
      supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
      supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    },
  };
};

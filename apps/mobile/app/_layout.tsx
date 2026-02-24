import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '@/src/components/AuthGate';
import { useAuth, AuthProvider } from '@/src/providers/AuthProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const RootNavigator = () => {
  const { session, isLoading, initializationError } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Initializing FixLocal...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthGate initializationError={initializationError} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
});

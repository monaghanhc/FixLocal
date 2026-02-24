import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { hasSupabaseConfig } from '../config';
import { useAuth } from '../providers/AuthProvider';

type AuthGateProps = {
  initializationError: string | null;
};

const emailSchema = z.string().trim().email('Enter a valid email address.');

export const AuthGate = ({ initializationError }: AuthGateProps) => {
  const { signInAnonymously, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoadingAnon, setIsLoadingAnon] = useState(false);
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnonymous = async () => {
    setError(null);
    setIsLoadingAnon(true);
    try {
      await signInAnonymously();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not create anonymous session.');
    } finally {
      setIsLoadingAnon(false);
    }
  };

  const handleMagicLink = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email.');
      return;
    }

    setError(null);
    setIsLoadingMagicLink(true);
    try {
      await sendMagicLink(parsed.data);
      Alert.alert('Magic link sent', 'Check your inbox to sign in.');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to send magic link.');
    } finally {
      setIsLoadingMagicLink(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>FixLocal</Text>
        <Text style={styles.subtitle}>
          Report civic issues quickly with photo evidence and direct routing to local authorities.
        </Text>

        {!hasSupabaseConfig && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Supabase env vars are missing. Set `EXPO_PUBLIC_SUPABASE_URL` and
              `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
            </Text>
          </View>
        )}

        {initializationError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{initializationError}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, (!hasSupabaseConfig || isLoadingAnon) && styles.disabledButton]}
          disabled={!hasSupabaseConfig || isLoadingAnon}
          onPress={handleAnonymous}
        >
          <Text style={styles.primaryButtonText}>
            {isLoadingAnon ? 'Signing in...' : 'Continue Anonymously'}
          </Text>
        </Pressable>

        <Text style={styles.orText}>or</Text>

        <TextInput
          style={styles.input}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
        />
        <Pressable
          style={[styles.secondaryButton, (!hasSupabaseConfig || isLoadingMagicLink) && styles.disabledButton]}
          disabled={!hasSupabaseConfig || isLoadingMagicLink}
          onPress={handleMagicLink}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoadingMagicLink ? 'Sending...' : 'Send Magic Link'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  orText: {
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
});

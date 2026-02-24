import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ReportRecord } from '@fixlocal/shared';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, getReports } from '@/src/lib/api';
import { StatusBadge } from '@/src/components/StatusBadge';
import { useAuth } from '@/src/providers/AuthProvider';

const formatDate = (value: string): string => {
  return new Date(value).toLocaleString();
};

export default function HistoryScreen() {
  const { session } = useAuth();
  const netInfo = useNetInfo();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(
    async (refresh = false) => {
      if (!session) {
        setReports([]);
        setIsLoading(false);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);
      try {
        const data = await getReports(session.access_token, session.user.id);
        setReports(data);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(loadError.message);
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Could not load report history.');
        }
      } finally {
        if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [session],
  );

  useFocusEffect(
    useCallback(() => {
      void loadReports(false);
    }, [loadReports]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.centeredText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>Report History</Text>
        <Text style={styles.subheading}>
          Review sent, queued, and failed reports with timestamps and thumbnails.
        </Text>

        {netInfo.isConnected === false ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              You are offline. Showing cached state. Pull to refresh when back online.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadReports(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          onRefresh={() => void loadReports(true)}
          refreshing={isRefreshing}
          contentContainerStyle={reports.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>
                Create your first report from the Report Issue tab and it will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.issueType}>{item.issueType}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.locationText}>
                {item.city}, {item.state} {item.zip}
              </Text>
              <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>

              <View style={styles.row}>
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Text style={styles.placeholderText}>No image</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.authorityText}>To: {item.authorityName}</Text>
                  <Text style={styles.subjectText}>{item.emailSubject}</Text>
                  {item.failureReason ? (
                    <Text style={styles.failureText}>Failure: {item.failureReason}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centeredText: {
    color: '#475569',
    fontWeight: '600',
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
  },
  subheading: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  warningBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#facc15',
    backgroundColor: '#fef9c3',
    padding: 12,
  },
  warningText: {
    color: '#854d0e',
    fontWeight: '600',
    fontSize: 13,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '600',
  },
  retryText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 24,
    gap: 12,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 18,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueType: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
  locationText: {
    color: '#334155',
    fontSize: 13,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnail: {
    width: 74,
    height: 74,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  authorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  subjectText: {
    fontSize: 13,
    color: '#334155',
  },
  failureText: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
  },
});

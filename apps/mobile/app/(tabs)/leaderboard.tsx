import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLeaderboard } from '../../src/lib/api';

type LeaderboardEntry = {
  rank: number;
  displayName: string;
  reportCount: number;
  isCurrentUser: boolean;
};

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<'all' | 'weekly'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await getLeaderboard(period);
        setEntries(data.leaderboard);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Leaderboard</Text>
      <Text style={styles.subtitle}>Top contributors improving our community</Text>

      {/* Period Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'all' && styles.toggleActive]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[styles.toggleText, period === 'all' && styles.toggleTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'weekly' && styles.toggleActive]}
          onPress={() => setPeriod('weekly')}
        >
          <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No reports yet.</Text>
          <Text style={styles.emptySubtext}>Be the first to submit a report!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.rank)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
          renderItem={({ item }) => (
            <View style={[styles.row, item.isCurrentUser && styles.rowHighlight]}>
              <Text style={styles.rank}>{getRankEmoji(item.rank)}</Text>
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.displayName}
                  {item.isCurrentUser ? ' (You)' : ''}
                </Text>
                <Text style={styles.count}>
                  {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, color: '#666' },
  toggleTextActive: { color: '#007AFF', fontWeight: '600' },
  loader: { marginTop: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowHighlight: { borderWidth: 2, borderColor: '#007AFF' },
  rank: { fontSize: 24, width: 48, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  count: { fontSize: 14, color: '#666', marginTop: 2 },
});

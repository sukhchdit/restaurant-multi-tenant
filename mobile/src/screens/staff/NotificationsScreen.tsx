import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';
import api from '../../services/axiosInstance';

export default function NotificationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const notifications = data?.data?.data?.items ?? data?.data?.data ?? [];

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, !item.isRead && styles.unread]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item: any) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No notifications'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 1 },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  message: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  time: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: spacing.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

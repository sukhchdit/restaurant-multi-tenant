import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import StatusBadge from '../../components/common/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

export default function OrderTrackingScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => orderApi.getOrders({ pageSize: 10 }),
    refetchInterval: 15000,
  });

  const orders = data?.data?.data?.items ?? [];

  return (
    <FlatList
      style={styles.container}
      data={orders}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.total}>₹{item.totalAmount?.toFixed(2)}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      )}
      keyExtractor={(item: any) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No active orders'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  total: { fontSize: fontSize.lg, fontWeight: '600', color: colors.primary, marginTop: spacing.sm },
  time: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: spacing.xs },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

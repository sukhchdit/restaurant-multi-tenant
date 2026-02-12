import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';
import StatCard from '../../components/common/StatCard';

export default function DashboardScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => orderApi.getOrders({ pageSize: 5 }),
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.greeting}>Dashboard</Text>

      <View style={styles.statsGrid}>
        <StatCard title="Total Orders" value="--" color={colors.primary} />
        <StatCard title="Revenue" value="--" color={colors.secondary} />
        <StatCard title="Active Tables" value="--" color={colors.info} />
        <StatCard title="Pending KOTs" value="--" color={colors.warning} />
      </View>

      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <Text style={styles.emptyText}>Connect to API to see live data</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  greeting: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  loadingText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
});

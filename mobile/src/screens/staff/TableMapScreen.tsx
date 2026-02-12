import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';
import api from '../../services/axiosInstance';

const getTableColor = (status: string) => {
  switch (status) {
    case 'Available': return colors.secondary;
    case 'Occupied': return colors.error;
    case 'Reserved': return colors.warning;
    case 'Cleaning': return colors.info;
    default: return colors.gray[400];
  }
};

export default function TableMapScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables'),
  });

  const tables = data?.data?.data?.items ?? data?.data?.data ?? [];

  return (
    <FlatList
      style={styles.container}
      data={tables}
      numColumns={3}
      columnWrapperStyle={styles.row}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.tableCard, { borderColor: getTableColor(item.status) }]}>
          <Text style={styles.tableNumber}>T{item.tableNumber}</Text>
          <Text style={[styles.status, { color: getTableColor(item.status) }]}>{item.status}</Text>
          <Text style={styles.capacity}>{item.capacity} seats</Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item: any) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No tables found'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  row: { justifyContent: 'space-between' },
  tableCard: {
    flex: 0.31, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, alignItems: 'center', borderWidth: 2, elevation: 1,
  },
  tableNumber: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  status: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs },
  capacity: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

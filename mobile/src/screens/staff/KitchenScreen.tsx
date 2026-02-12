import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/orderApi';
import { KitchenOrderTicket, KOTStatus } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

const getKOTPriorityColor = (sentAt: string) => {
  const minutesAgo = (Date.now() - new Date(sentAt).getTime()) / 60000;
  if (minutesAgo > 20) return colors.error;
  if (minutesAgo > 10) return colors.warning;
  return colors.secondary;
};

export default function KitchenScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['kots'],
    queryFn: () => orderApi.getKOTs({ status: 'Sent,Acknowledged,Preparing' }),
    refetchInterval: 10000,
  });

  const updateKOT = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateKOTStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kots'] }),
  });

  const kots = data?.data?.data?.items ?? [];

  const renderKOT = ({ item }: { item: KitchenOrderTicket }) => (
    <View style={[styles.kotCard, { borderLeftColor: getKOTPriorityColor(item.sentAt) }]}>
      <View style={styles.kotHeader}>
        <Text style={styles.kotNumber}>{item.kotNumber}</Text>
        <Text style={styles.orderRef}>Order: {item.orderNumber}</Text>
      </View>
      {item.items.map((kotItem) => (
        <View key={kotItem.id} style={styles.kotItem}>
          <Text style={styles.kotItemText}>{kotItem.quantity}x {kotItem.menuItemName}</Text>
          {kotItem.notes && <Text style={styles.kotNotes}>{kotItem.notes}</Text>}
        </View>
      ))}
      <View style={styles.kotActions}>
        {item.status === 'Sent' && (
          <TouchableOpacity
            style={[styles.kotButton, { backgroundColor: colors.info }]}
            onPress={() => updateKOT.mutate({ id: item.id, status: 'Acknowledged' })}
          >
            <Text style={styles.kotButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Acknowledged' && (
          <TouchableOpacity
            style={[styles.kotButton, { backgroundColor: colors.warning }]}
            onPress={() => updateKOT.mutate({ id: item.id, status: 'Preparing' })}
          >
            <Text style={styles.kotButtonText}>Start Preparing</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Preparing' && (
          <TouchableOpacity
            style={[styles.kotButton, { backgroundColor: colors.secondary }]}
            onPress={() => updateKOT.mutate({ id: item.id, status: 'Ready' })}
          >
            <Text style={styles.kotButtonText}>Mark Ready</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={kots}
      renderItem={renderKOT}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No active KOTs'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.sm },
  row: { justifyContent: 'space-between' },
  kotCard: {
    flex: 0.48, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, elevation: 2, borderLeftWidth: 4,
  },
  kotHeader: { marginBottom: spacing.sm },
  kotNumber: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  orderRef: { fontSize: fontSize.xs, color: colors.textSecondary },
  kotItem: { paddingVertical: spacing.xs },
  kotItemText: { fontSize: fontSize.md, color: colors.text },
  kotNotes: { fontSize: fontSize.xs, color: colors.warning, fontStyle: 'italic' },
  kotActions: { marginTop: spacing.sm },
  kotButton: { borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  kotButtonText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

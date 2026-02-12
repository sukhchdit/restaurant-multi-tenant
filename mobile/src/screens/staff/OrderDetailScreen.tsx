import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { orderApi } from '../../services/orderApi';
import StatusBadge from '../../components/common/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

export default function OrderDetailScreen() {
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { orderId } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => orderApi.updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => Alert.alert('Error', error.response?.data?.message || 'Failed to update status'),
  });

  const order = data?.data?.data;

  if (isLoading || !order) {
    return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Info</Text>
        <Text style={styles.infoRow}>Type: {order.orderType}</Text>
        {order.tableNumber && <Text style={styles.infoRow}>Table: {order.tableNumber}</Text>}
        {order.customerName && <Text style={styles.infoRow}>Customer: {order.customerName}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.quantity}x {item.menuItemName}</Text>
            <Text style={styles.itemPrice}>₹{item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₹{order.subTotal.toFixed(2)}</Text>
        </View>
        {order.discountAmount > 0 && (
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.secondary }]}>-₹{order.discountAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Tax</Text>
          <Text style={styles.totalValue}>₹{order.taxAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={[styles.totalLabel, { fontWeight: '700' }]}>Total</Text>
          <Text style={[styles.totalValue, { fontWeight: '700', fontSize: fontSize.lg }]}>₹{order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {order.status === 'Pending' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus.mutate('Confirmed')}>
            <Text style={styles.actionText}>Confirm Order</Text>
          </TouchableOpacity>
        )}
        {order.status === 'Ready' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus.mutate('Served')}>
            <Text style={styles.actionText}>Mark Served</Text>
          </TouchableOpacity>
        )}
        {order.status === 'Served' && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={() => updateStatus.mutate('Completed')}>
            <Text style={styles.actionText}>Complete Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  loading: { textAlign: 'center', padding: spacing.xl, color: colors.textSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  orderNumber: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, elevation: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  infoRow: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xs },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemName: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  itemPrice: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.md, color: colors.text },
  actions: { gap: spacing.sm, marginBottom: spacing.xl },
  actionButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
  actionText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});

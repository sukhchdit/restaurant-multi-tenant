import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { orderApi } from '../../services/orderApi';
import { Order, OrderStatus } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';
import StatusBadge from '../../components/common/StatusBadge';

const statusTabs: (OrderStatus | 'All')[] = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Served'];

export default function OrderListScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>('All');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => orderApi.getOrders(activeTab !== 'All' ? { status: activeTab } : {}),
  });

  const orders = data?.data?.data?.items ?? [];

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.orderType}>{item.orderType} {item.tableNumber ? `- Table ${item.tableNumber}` : ''}</Text>
      <Text style={styles.orderTotal}>₹{item.totalAmount.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={statusTabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item && styles.activeTab]}
            onPress={() => setActiveTab(item)}
          >
            <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        style={styles.tabs}
        showsHorizontalScrollIndicator={false}
      />
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No orders found'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  tabs: { maxHeight: 50, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray[100], marginRight: spacing.xs },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
  activeTabText: { color: colors.white, fontWeight: '600' },
  list: { padding: spacing.md },
  orderCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  orderType: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  orderTotal: { fontSize: fontSize.md, fontWeight: '600', color: colors.primary, marginTop: spacing.xs },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

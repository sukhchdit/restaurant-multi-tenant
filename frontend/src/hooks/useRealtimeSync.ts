import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import type { RootState } from '@/store/store';
import { useSignalR } from './useSignalR';

const EVENT_QUERY_MAP: Record<string, string[]> = {
  OrderCreated: ['orders', 'tables', 'tables-for-order', 'table-order', 'dashboardStats', 'activeKOTs', 'auditLogs'],
  OrderUpdated: ['orders', 'tables', 'tables-for-order', 'table-order', 'dashboardStats', 'activeKOTs', 'auditLogs'],
  OrderStatusChanged: ['orders', 'tables', 'tables-for-order', 'table-order', 'dashboardStats', 'activeKOTs', 'payments', 'invoices', 'ledger', 'auditLogs', 'salesReport', 'revenueTrend', 'categoryDistribution', 'topItems'],
  OrderDeleted: ['orders', 'tables', 'tables-for-order', 'table-order', 'dashboardStats', 'activeKOTs', 'auditLogs'],
  MenuUpdated: ['menu', 'menuCategories', 'menu-for-order', 'inventory', 'auditLogs'],
  TableUpdated: ['tables', 'tables-for-order', 'auditLogs'],
  InventoryUpdated: ['inventory', 'menu', 'menuCategories', 'auditLogs'],
  StaffUpdated: ['staff', 'staff-waiters', 'auditLogs'],
  PaymentUpdated: ['payments', 'orders', 'dashboardStats', 'invoices', 'ledger', 'settlements', 'auditLogs', 'salesReport', 'revenueTrend', 'categoryDistribution', 'topItems'],
  DiscountUpdated: ['discounts', 'auditLogs'],
  BillingUpdated: ['invoices', 'payments', 'ledger', 'auditLogs'],
  NotificationUpdated: ['dashboardStats', 'notifications', 'unreadNotificationCount'],
};

export const useRealtimeSync = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const { on } = useSignalR('orders', isAuthenticated);

  useEffect(() => {
    const unsubs = Object.entries(EVENT_QUERY_MAP).map(([event, queryKeys]) =>
      on(event, () => {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [on, queryClient]);
};

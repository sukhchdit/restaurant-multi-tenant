import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSignalR } from './useSignalR';

const ORDER_QUERY_KEYS = ['orders', 'tables', 'tables-for-order', 'table-order', 'dashboardStats', 'activeKOTs'];

export const useOrderSignalR = () => {
  const queryClient = useQueryClient();
  const { on } = useSignalR('orders');

  useEffect(() => {
    const invalidateAll = () => {
      ORDER_QUERY_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    };

    const unsubs = [
      on('OrderStatusChanged', invalidateAll),
      on('OrderCreated', invalidateAll),
      on('OrderUpdated', invalidateAll),
      on('OrderDeleted', invalidateAll),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [on, queryClient]);
};

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { RootState } from '@/store/store';
import { useSignalR } from './useSignalR';

interface NotificationEvent {
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  createdBy?: string;
}

export const useNotificationToast = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const { on } = useSignalR('notifications', isAuthenticated);

  useEffect(() => {
    const unsub = on('NewNotification', (data: unknown) => {
      const notification = data as NotificationEvent;

      // Skip toast for the user who created the notification
      if (notification.createdBy && user?.id && notification.createdBy === user.id) {
        return;
      }

      toast(notification.title, {
        description: notification.message,
        duration: Infinity,
        action: {
          label: 'OK',
          onClick: () => {},
        },
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    });

    return unsub;
  }, [on, queryClient, user?.id]);
};

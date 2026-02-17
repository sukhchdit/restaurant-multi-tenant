import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/api/notificationApi';
import type { NotificationDto } from '@/services/api/notificationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Check,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  BellRing,
  BellOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { notificationTypeIcons, getRelativeTime } from '@/utils/notifications';

type FilterTab = 'all' | 'unread' | 'read';

export const Notifications = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  const isReadParam = filter === 'all' ? undefined : filter === 'read';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter, pageNumber],
    queryFn: () => notificationApi.getNotifications({ pageNumber, pageSize, isRead: isReadParam }),
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => notificationApi.getUnreadCount(),
  });

  const notifications = data?.data?.items ?? [];
  const totalCount = data?.data?.totalCount ?? 0;
  const totalPages = data?.data?.totalPages ?? 1;
  const hasPreviousPage = data?.data?.hasPreviousPage ?? false;
  const hasNextPage = data?.data?.hasNextPage ?? false;
  const unreadCount = unreadCountData?.data ?? 0;
  const readCount = totalCount > unreadCount ? totalCount - unreadCount : 0;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Notification marked as read');
    },
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      invalidateAll();
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const handleFilterChange = (tab: FilterTab) => {
    setFilter(tab);
    setPageNumber(1);
  };

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read', count: readCount },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex rounded-lg border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your restaurant activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex rounded-lg border border-border bg-card text-card-foreground">
        <div className="flex flex-1 items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Total</span>
          </div>
          <span className="text-xl font-bold">{totalCount}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Unread</span>
          </div>
          <span className="text-xl font-bold text-primary">{unreadCount}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Read</span>
          </div>
          <span className="text-xl font-bold">{readCount}</span>
        </div>
      </div>

      {/* Notification List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {filter === 'all' ? 'All Notifications' : filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'}
            </CardTitle>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => handleFilterChange(tab.key)}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">
                {filter === 'unread' ? 'All caught up!' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm">
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : filter === 'read'
                    ? 'Notifications you read will appear here.'
                    : 'New activity will show up here automatically.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: NotificationDto) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {notificationTypeIcons[notification.type] ?? <Bell className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Mark as read"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => deleteMutation.mutate(notification.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {pageNumber} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => p - 1)}
                  disabled={!hasPreviousPage}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

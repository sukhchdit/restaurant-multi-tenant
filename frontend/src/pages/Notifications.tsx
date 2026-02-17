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
  CheckCheck,
  ShoppingBag,
  ChefHat,
  XCircle,
  Utensils,
  AlertTriangle,
  Users,
  CreditCard,
  CalendarClock,
  Settings,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

type FilterTab = 'all' | 'unread' | 'read';

const notificationTypeIcons: Record<string, React.ReactNode> = {
  'order-placed': <ShoppingBag className="h-5 w-5 text-blue-500" />,
  'kot-created': <ChefHat className="h-5 w-5 text-orange-500" />,
  'order-accepted': <Check className="h-5 w-5 text-green-500" />,
  'order-rejected': <XCircle className="h-5 w-5 text-red-500" />,
  'order-ready': <Utensils className="h-5 w-5 text-emerald-500" />,
  'order-delivered': <CheckCheck className="h-5 w-5 text-green-600" />,
  'low-stock': <AlertTriangle className="h-5 w-5 text-amber-500" />,
  'staff-update': <Users className="h-5 w-5 text-purple-500" />,
  'payment-received': <CreditCard className="h-5 w-5 text-teal-500" />,
  'new-reservation': <CalendarClock className="h-5 w-5 text-indigo-500" />,
  'system': <Settings className="h-5 w-5 text-gray-500" />,
};

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: invalidateAll,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: invalidateAll,
  });

  const handleFilterChange = (tab: FilterTab) => {
    setFilter(tab);
    setPageNumber(1);
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {totalCount} notification{totalCount !== 1 ? 's' : ''}
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
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'read'
                    ? 'No read notifications yet.'
                    : 'You have no notifications yet.'}
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

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun, Settings, KeyRound, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { RootState, AppDispatch } from '@/store/store';
import { toggleDarkMode } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { notificationApi } from '@/services/api/notificationApi';
import type { NotificationDto } from '@/services/api/notificationApi';
import { notificationTypeIconsSm, getRelativeTime } from '@/utils/notifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLastLogin(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'popup'],
    queryFn: () => notificationApi.getNotifications({ pageSize: 5 }),
    refetchInterval: 30000,
  });

  const unreadCount = unreadCountData?.data ?? 0;
  const notifications = notificationsData?.data?.items ?? [];

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  const handleNotificationClick = (notification: NotificationDto) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    dispatch(logout());
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen, userMenuOpen]);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders, menu items, tables..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleTheme}
          className="relative"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-md border bg-popover text-popover-foreground shadow-md">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-primary"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 last:border-b-0 ${
                        !notification.isRead ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notificationTypeIconsSm[notification.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <p className={`truncate text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </p>
                )}
              </div>

              <div className="border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full py-1.5 text-sm text-primary"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/notifications');
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            {getInitials(user?.fullName)}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border bg-popover text-popover-foreground shadow-md">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last login: {formatLastLogin(user?.lastLoginAt)}
                </p>
              </div>
              <Separator />
              <div className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Change Password
                </button>
              </div>
              <Separator />
              <div className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-muted"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

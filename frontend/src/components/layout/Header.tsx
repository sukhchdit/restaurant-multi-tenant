import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import type { RootState } from '@/store/store';
import { toggleDarkMode } from '@/store/slices/uiSlice';
import { orderApi } from '@/services/api/orderApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => orderApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const pendingOrders = dashboardStats?.data?.pendingOrders ?? 0;

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

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
            {pendingOrders > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {pendingOrders}
              </Badge>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
              <h4 className="mb-3 font-semibold">Notifications</h4>
              {pendingOrders > 0 ? (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Bell className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">New Orders</p>
                    <p className="text-sm text-muted-foreground">
                      You have {pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </p>
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden items-center gap-3 rounded-lg bg-muted px-3 py-2 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role.replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

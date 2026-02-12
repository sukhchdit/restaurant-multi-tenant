import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import type { RootState } from '@/store/store';
import { toggleDarkMode } from '@/store/slices/uiSlice';
import { orderApi } from '@/services/api/orderApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => orderApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const pendingOrders = dashboardStats?.data?.pendingOrders ?? 0;

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2">
              <h4 className="mb-2 font-semibold">Notifications</h4>
              {pendingOrders > 0 ? (
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">New Orders</p>
                    <p className="text-sm text-muted-foreground">
                      You have {pendingOrders} pending orders
                    </p>
                  </div>
                </DropdownMenuItem>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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

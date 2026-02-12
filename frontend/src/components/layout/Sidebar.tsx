import { NavLink } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Table as TableIcon,
  ChefHat,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  Percent,
  UserCircle,
  Receipt,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Menu',
    path: '/menu',
    icon: UtensilsCrossed,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Orders',
    path: '/orders',
    icon: ShoppingCart,
    roles: ['restaurant_admin', 'manager', 'waiter', 'cashier'],
  },
  {
    name: 'Tables',
    path: '/tables',
    icon: TableIcon,
    roles: ['restaurant_admin', 'manager', 'waiter'],
  },
  {
    name: 'Kitchen',
    path: '/kitchen',
    icon: ChefHat,
    roles: ['kitchen', 'manager'],
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: Package,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Staff',
    path: '/staff',
    icon: Users,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Payments',
    path: '/payments',
    icon: CreditCard,
    roles: ['restaurant_admin', 'manager', 'cashier'],
  },
  {
    name: 'Discounts',
    path: '/discounts',
    icon: Percent,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: UserCircle,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    roles: ['restaurant_admin', 'manager', 'cashier'],
  },
  {
    name: 'Accounts',
    path: '/accounts',
    icon: BookOpen,
    roles: ['restaurant_admin', 'manager'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['restaurant_admin', 'manager', 'cashier'],
  },
  {
    name: 'Audit Logs',
    path: '/audit-logs',
    icon: ClipboardList,
    roles: ['restaurant_admin'],
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];

export const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logout());
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo & Restaurant Info */}
      <div className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate font-semibold text-sidebar-foreground">
              {user?.restaurantName || 'Restaurant'}
            </h2>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user?.role.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/80'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-5 w-5', isActive ? 'opacity-100' : 'opacity-70')} />
                    <span className="font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user?.fullName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-sidebar-accent-foreground">{user?.fullName}</p>
            <p className="truncate text-xs text-sidebar-accent-foreground/60">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

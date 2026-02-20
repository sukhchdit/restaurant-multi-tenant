import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
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
  CreditCard,
  Percent,
  UserCircle,
  Receipt,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Layers,
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
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Combos',
    path: '/combos',
    icon: Layers,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Orders',
    path: '/orders',
    icon: ShoppingCart,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Waiter', 'Cashier'],
  },
  {
    name: 'Tables',
    path: '/tables',
    icon: TableIcon,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Waiter'],
  },
  {
    name: 'Kitchen',
    path: '/kitchen',
    icon: ChefHat,
    roles: ['SuperAdmin', 'Kitchen', 'Manager'],
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: Package,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Staff',
    path: '/staff',
    icon: Users,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Payments',
    path: '/payments',
    icon: CreditCard,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier'],
  },
  {
    name: 'Discounts',
    path: '/discounts',
    icon: Percent,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: UserCircle,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier'],
  },
  {
    name: 'Accounts',
    path: '/accounts',
    icon: BookOpen,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier'],
  },
  {
    name: 'Audit Logs',
    path: '/audit-logs',
    icon: ClipboardList,
    roles: ['SuperAdmin', 'RestaurantAdmin'],
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];

const STORAGE_KEY = 'sidebar-collapsed';

export const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch { /* ignore */ }
  }, [collapsed]);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Collapse toggle badge on right border */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-7 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-sm transition-colors hover:opacity-90"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft className="h-3.5 w-3.5" />
        }
      </button>

      {/* Logo & Restaurant Info */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="truncate font-semibold text-sidebar-foreground">
                {user?.restaurantName || 'Restaurant'}
              </h2>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {user?.role.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/80'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'opacity-100' : 'opacity-70')} />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

    </aside>
  );
};

import { createBrowserRouter } from 'react-router';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { MenuManagement } from '@/pages/MenuManagement';
import { OrderManagement } from '@/pages/OrderManagement';
import { TableManagement } from '@/pages/TableManagement';
import { KitchenDisplay } from '@/pages/KitchenDisplay';
import { Inventory } from '@/pages/Inventory';
import { StaffManagement } from '@/pages/StaffManagement';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { CustomerApp } from '@/pages/CustomerApp';
import { Payments } from '@/pages/Payments';
import { Discounts } from '@/pages/Discounts';
import { Customers } from '@/pages/Customers';
import { Billing } from '@/pages/Billing';
import { Accounts } from '@/pages/Accounts';
import { AuditLogs } from '@/pages/AuditLogs';
import { Notifications } from '@/pages/Notifications';
import { Combos } from '@/pages/Combos';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/customer',
    Component: CustomerApp,
  },
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'menu',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <MenuManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'combos',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <Combos />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Waiter', 'Cashier']}>
            <OrderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tables',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Waiter']}>
            <TableManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kitchen',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'Kitchen', 'Manager']}>
            <KitchenDisplay />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <StaffManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier']}>
            <Payments />
          </ProtectedRoute>
        ),
      },
      {
        path: 'discounts',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <Discounts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <Customers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'billing',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier']}>
            <Billing />
          </ProtectedRoute>
        ),
      },
      {
        path: 'accounts',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager']}>
            <Accounts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Manager', 'Cashier']}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin']}>
            <AuditLogs />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

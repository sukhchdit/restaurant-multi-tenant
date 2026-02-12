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
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <MenuManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager', 'waiter', 'cashier']}>
            <OrderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tables',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager', 'waiter']}>
            <TableManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kitchen',
        element: (
          <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
            <KitchenDisplay />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <StaffManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager', 'cashier']}>
            <Payments />
          </ProtectedRoute>
        ),
      },
      {
        path: 'discounts',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <Discounts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <Customers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'billing',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager', 'cashier']}>
            <Billing />
          </ProtectedRoute>
        ),
      },
      {
        path: 'accounts',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager']}>
            <Accounts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin', 'manager', 'cashier']}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['restaurant_admin']}>
            <AuditLogs />
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

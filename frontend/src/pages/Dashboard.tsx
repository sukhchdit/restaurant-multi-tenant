import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import type { RootState } from '@/store/store';
import { orderApi } from '@/services/api/orderApi';
import { reportApi } from '@/services/api/reportApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Table as TableIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const orderTypeData = [
  { name: 'Dine-in', value: 45, color: '#dc2626' },
  { name: 'Takeaway', value: 25, color: '#16a34a' },
  { name: 'Delivery', value: 20, color: '#eab308' },
  { name: 'Online', value: 10, color: '#3b82f6' },
];

export const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => orderApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderApi.getOrders({ pageSize: 5, pageNumber: 1 }),
  });

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['salesReport', 'weekly'],
    queryFn: () => reportApi.getSalesReport({ period: 'weekly' }),
  });

  const stats = dashboardStats?.data;
  const recentOrders = ordersResponse?.data?.items ?? [];
  const salesData = salesReport?.data?.periodData ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.fullName}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening at {user?.restaurantName || 'your restaurant'} today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Time</p>
          <p className="text-lg font-semibold">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todayOrders ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-secondary">+12%</span> from yesterday
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(stats?.todayRevenue ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-secondary">+8%</span> from yesterday
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.activeTables ?? 0}/{stats?.totalTables ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalTables
                    ? ((stats.activeTables / stats.totalTables) * 100).toFixed(0)
                    : 0}
                  % occupancy
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {stats?.lowStockItems ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Needs restocking</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full flex-1" />
              ))
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-1 items-center justify-between rounded-lg border border-primary/40 bg-primary/[0.03] p-4 transition-all hover:border-primary/60 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.customerName || 'Guest'}</p>
                      <Badge variant={order.orderType === 'dine-in' ? 'default' : 'secondary'}>
                        {order.orderType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.tableNumber || 'No table'} &bull; {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'default'
                          : order.status === 'preparing'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Order Status Overview */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full flex-1" />
              ))
            ) : (
              <>
                <div className="flex flex-1 items-center justify-between rounded-lg border border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-amber-600" />
                    <div>
                      <p className="font-semibold">Pending Orders</p>
                      <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats?.pendingOrders ?? 0}
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-between rounded-lg border border-blue-600 bg-blue-50 p-4 dark:bg-blue-950/20">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold">Preparing</p>
                      <p className="text-sm text-muted-foreground">In kitchen</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.preparingOrders ?? 0}
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-between rounded-lg border border-green-600 bg-green-50 p-4 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold">Ready to Serve</p>
                      <p className="text-sm text-muted-foreground">Prepared & ready</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.readyOrders ?? 0}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats && stats.lowStockItems > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm">
              {stats.lowStockItems} items are running low on stock and need restocking.
            </p>
            <Link to="/inventory">
              <Button variant="destructive">View Inventory</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

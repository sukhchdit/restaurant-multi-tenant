export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  periodData: { label: string; revenue: number; orders: number }[];
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TopMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  orderCount: number;
  revenue: number;
}

export interface RevenueChart {
  month: string;
  revenue: number;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  totalTables: number;
  lowStockItems: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
}

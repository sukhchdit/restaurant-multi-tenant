import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/services/api/reportApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, TrendingUp, DollarSign, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last-7' | 'last-30' | 'custom';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPresetDates(preset: Exclude<Preset, 'custom'>): { start: string; end: string } {
  const now = new Date();
  const today = formatDate(now);
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: formatDate(yesterday), end: formatDate(yesterday) };
    }
    case 'week': {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return { start: formatDate(monday), end: today };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(monthStart), end: today };
    }
    case 'last-7': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return { start: formatDate(weekAgo), end: today };
    }
    case 'last-30': {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 29);
      return { start: formatDate(monthAgo), end: today };
    }
  }
}

function derivePeriod(startDate: string, endDate: string): 'daily' | 'weekly' | 'monthly' {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 'daily';
  if (diffDays <= 7) return 'weekly';
  return 'monthly';
}

export const Reports = () => {
  const defaultDates = getPresetDates('today');
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activePreset, setActivePreset] = useState<Preset>('today');

  const handlePreset = (preset: Exclude<Preset, 'custom'>) => {
    const dates = getPresetDates(preset);
    setStartDate(dates.start);
    setEndDate(dates.end);
    setStartTime('');
    setEndTime('');
    setActivePreset(preset);
  };

  const period = useMemo(() => derivePeriod(startDate, endDate), [startDate, endDate]);

  const filterParams = useMemo(() => ({
    startDate,
    endDate,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
  }), [startDate, endDate, startTime, endTime]);

  const monthCount = useMemo(() => {
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
  }, [startDate, endDate]);

  const { data: salesResponse, isLoading: salesLoading, isFetching: salesFetching } = useQuery({
    queryKey: ['salesReport', startDate, endDate, startTime, endTime, period],
    queryFn: () => reportApi.getSalesReport({ period, ...filterParams }),
  });

  const { data: revenueTrendResponse, isLoading: trendLoading, isFetching: trendFetching } = useQuery({
    queryKey: ['revenueTrend', startDate, endDate, startTime, endTime],
    queryFn: () => reportApi.getRevenueTrend({ months: monthCount, ...filterParams }),
  });

  const { data: categoryResponse, isLoading: categoryLoading, isFetching: categoryFetching } = useQuery({
    queryKey: ['categoryDistribution', startDate, endDate, startTime, endTime],
    queryFn: () => reportApi.getCategoryDistribution(filterParams),
  });

  const { data: topItemsResponse, isLoading: topItemsLoading, isFetching: topItemsFetching } = useQuery({
    queryKey: ['topItems', startDate, endDate, startTime, endTime],
    queryFn: () => reportApi.getTopItems({ limit: 5, ...filterParams }),
  });

  const salesReport = salesResponse?.data;
  const revenueTrend = revenueTrendResponse?.data ?? [];
  const categoryData = categoryResponse?.data ?? [];
  const topItems = topItemsResponse?.data ?? [];

  const handleExportPdf = async () => {
    try {
      const blob = await reportApi.exportPdf({ type: 'sales', ...filterParams });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Failed to export report');
    }
  };

  const isLoading = salesLoading || trendLoading || categoryLoading || topItemsLoading;
  const isFetching = salesFetching || trendFetching || categoryFetching || topItemsFetching;

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom Range' },
    { key: 'last-7', label: 'Last 7 Days' },
    { key: 'last-30', label: 'Last 30 Days' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && !isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          <Button onClick={handleExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.key}
                variant={activePreset === p.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => p.key === 'custom' ? setActivePreset('custom') : handlePreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From Date</label>
              <Input
                type="date"
                className="h-9"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setActivePreset('custom'); }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To Date</label>
              <Input
                type="date"
                className="h-9"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setActivePreset('custom'); }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From Time</label>
              <Input
                type="time"
                className="h-9"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setActivePreset('custom'); }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To Time</label>
              <Input
                type="time"
                className="h-9"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setActivePreset('custom'); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    Rs. {(salesReport?.totalRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <ShoppingCart className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{salesReport?.totalOrders ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    Rs. {(salesReport?.averageOrderValue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {categoryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {topItemsLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs. {item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.orderCount} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

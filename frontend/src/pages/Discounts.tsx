import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/api/axiosInstance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Plus,
  Edit,
  Trash2,
  Percent,
  Tag,
  Calendar,
  Ticket,
  Copy,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api.types';

interface Discount {
  id: string;
  name: string;
  discountType: 'percentage' | 'flat';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableOn?: string;
  categoryId?: string;
  menuItemId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  autoApply: boolean;
  createdAt: string;
}

interface Coupon {
  id: string;
  code: string;
  discountId: string;
  discountName?: string;
  maxUsageCount: number;
  usedCount: number;
  maxPerCustomer?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

const discountApi = {
  getDiscounts: async (): Promise<ApiResponse<Discount[]>> => {
    const response = await axiosInstance.get('/discounts');
    return response.data;
  },
  createDiscount: async (data: Partial<Discount>): Promise<ApiResponse<Discount>> => {
    const response = await axiosInstance.post('/discounts', data);
    return response.data;
  },
  updateDiscount: async (id: string, data: Partial<Discount>): Promise<ApiResponse<Discount>> => {
    const response = await axiosInstance.put(`/discounts/${id}`, data);
    return response.data;
  },
  deleteDiscount: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/discounts/${id}`);
    return response.data;
  },
  toggleActive: async (id: string): Promise<ApiResponse<Discount>> => {
    const response = await axiosInstance.patch(`/discounts/${id}/toggle`);
    return response.data;
  },
  getCoupons: async (): Promise<ApiResponse<Coupon[]>> => {
    const response = await axiosInstance.get('/discounts/coupons');
    return response.data;
  },
  createCoupon: async (data: {
    code: string;
    discountId: string;
    maxUsageCount: number;
    maxPerCustomer?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Coupon>> => {
    const response = await axiosInstance.post('/discounts/coupons', data);
    return response.data;
  },
  deleteCoupon: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/discounts/coupons/${id}`);
    return response.data;
  },
  toggleCouponActive: async (id: string): Promise<ApiResponse<Coupon>> => {
    const response = await axiosInstance.patch(`/discounts/coupons/${id}/toggle`);
    return response.data;
  },
};

export const Discounts = () => {
  // Discount dialog state
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    applicableOn: 'all' as string,
  });

  // Coupon dialog state
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountId: '',
    maxUsageCount: '100',
    maxPerCustomer: '',
    startDate: '',
    endDate: '',
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: discountsResponse, isLoading: discountsLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.getDiscounts(),
  });

  const { data: couponsResponse, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => discountApi.getCoupons(),
  });

  const discounts = discountsResponse?.data ?? [];
  const coupons = couponsResponse?.data ?? [];

  // Discount mutations
  const createDiscountMutation = useMutation({
    mutationFn: (data: Partial<Discount>) => discountApi.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount created');
      closeDiscountDialog();
    },
    onError: () => toast.error('Failed to create discount'),
  });

  const updateDiscountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Discount> }) =>
      discountApi.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount updated');
      closeDiscountDialog();
    },
    onError: () => toast.error('Failed to update discount'),
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: (id: string) => discountApi.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted');
    },
    onError: () => toast.error('Failed to delete discount'),
  });

  const toggleDiscountMutation = useMutation({
    mutationFn: (id: string) => discountApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount status updated');
    },
    onError: () => toast.error('Failed to toggle discount'),
  });

  // Coupon mutations
  const createCouponMutation = useMutation({
    mutationFn: discountApi.createCoupon,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['coupons'] });
        toast.success('Coupon created');
        closeCouponDialog();
      } else {
        toast.error(response.message || 'Failed to create coupon');
      }
    },
    onError: () => toast.error('Failed to create coupon'),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => discountApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const toggleCouponMutation = useMutation({
    mutationFn: (id: string) => discountApi.toggleCouponActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon status updated');
    },
    onError: () => toast.error('Failed to toggle coupon'),
  });

  // Discount dialog helpers
  const openCreateDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      name: '',
      discountType: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      startDate: '',
      endDate: '',
      applicableOn: 'all',
    });
    setDiscountDialogOpen(true);
  };

  const openEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name,
      discountType: discount.discountType,
      value: String(discount.value),
      minOrderAmount: discount.minOrderAmount ? String(discount.minOrderAmount) : '',
      maxDiscountAmount: discount.maxDiscountAmount ? String(discount.maxDiscountAmount) : '',
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      applicableOn: discount.applicableOn || 'all',
    });
    setDiscountDialogOpen(true);
  };

  const closeDiscountDialog = () => {
    setDiscountDialogOpen(false);
    setEditingDiscount(null);
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Discount> = {
      name: discountForm.name,
      discountType: discountForm.discountType,
      value: parseFloat(discountForm.value),
      minOrderAmount: discountForm.minOrderAmount ? parseFloat(discountForm.minOrderAmount) : undefined,
      maxDiscountAmount: discountForm.maxDiscountAmount ? parseFloat(discountForm.maxDiscountAmount) : undefined,
      startDate: discountForm.startDate || undefined,
      endDate: discountForm.endDate || undefined,
      applicableOn: discountForm.applicableOn,
    };

    if (editingDiscount) {
      updateDiscountMutation.mutate({ id: editingDiscount.id, data: payload });
    } else {
      createDiscountMutation.mutate(payload);
    }
  };

  // Coupon dialog helpers
  const openCreateCoupon = () => {
    setCouponForm({
      code: '',
      discountId: '',
      maxUsageCount: '100',
      maxPerCustomer: '',
      startDate: '',
      endDate: '',
    });
    setCouponDialogOpen(true);
  };

  const closeCouponDialog = () => {
    setCouponDialogOpen(false);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCouponMutation.mutate({
      code: couponForm.code,
      discountId: couponForm.discountId,
      maxUsageCount: parseInt(couponForm.maxUsageCount) || 100,
      maxPerCustomer: couponForm.maxPerCustomer ? parseInt(couponForm.maxPerCustomer) : undefined,
      startDate: couponForm.startDate || undefined,
      endDate: couponForm.endDate || undefined,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  const isLoading = discountsLoading || couponsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  const activeDiscounts = discounts.filter((d) => d.isActive);
  const activeCoupons = coupons.filter((c) => c.isActive);
  const expiredDiscounts = discounts.filter(
    (d) => d.endDate && new Date(d.endDate) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discounts & Coupons</h1>
        <p className="text-muted-foreground">
          Manage promotional discounts and coupon codes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discounts</p>
                <p className="text-2xl font-bold">{discounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Ticket className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Offers</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeDiscounts.length + activeCoupons.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{expiredDiscounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discounts" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="discounts">
              <Tag className="mr-2 h-4 w-4" />
              Discounts ({discounts.length})
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Ticket className="mr-2 h-4 w-4" />
              Coupon Codes ({coupons.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Discounts Tab */}
        <TabsContent value="discounts">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateDiscount}>
                <Plus className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discounts.map((discount) => {
                const isExpired = discount.endDate
                  ? new Date(discount.endDate) < new Date()
                  : false;
                return (
                  <Card key={discount.id} className="transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{discount.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {discount.discountType}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpired && <Badge variant="destructive">Expired</Badge>}
                            <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                              {discount.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-center rounded-lg bg-muted p-4">
                          <p className="text-3xl font-bold text-primary">
                            {discount.discountType === 'percentage'
                              ? `${discount.value}%`
                              : `Rs. ${discount.value.toFixed(2)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {discount.discountType === 'percentage' ? 'Off' : 'Flat Discount'}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          {discount.minOrderAmount != null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Min Order</span>
                              <span>Rs. {discount.minOrderAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {discount.maxDiscountAmount != null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max Discount</span>
                              <span>Rs. {discount.maxDiscountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {discount.applicableOn && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Applies To</span>
                              <Badge variant="outline" className="capitalize">
                                {discount.applicableOn}
                              </Badge>
                            </div>
                          )}
                          {(discount.startDate || discount.endDate) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valid</span>
                              <span className="text-xs">
                                {discount.startDate
                                  ? new Date(discount.startDate).toLocaleDateString()
                                  : '-'}{' '}
                                -{' '}
                                {discount.endDate
                                  ? new Date(discount.endDate).toLocaleDateString()
                                  : '-'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <Switch
                            checked={discount.isActive}
                            onCheckedChange={() => toggleDiscountMutation.mutate(discount.id)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDiscount(discount)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this discount?')) {
                                  deleteDiscountMutation.mutate(discount.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {discounts.length === 0 && (
                <Card className="col-span-full p-12">
                  <div className="text-center">
                    <Percent className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Discounts</h3>
                    <p className="mt-2 text-muted-foreground">
                      Create your first discount to get started
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateCoupon} disabled={discounts.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => {
                const isExpired = coupon.endDate
                  ? new Date(coupon.endDate) < new Date()
                  : false;
                const usagePercent =
                  coupon.maxUsageCount > 0
                    ? Math.round((coupon.usedCount / coupon.maxUsageCount) * 100)
                    : 0;
                const isExhausted = coupon.usedCount >= coupon.maxUsageCount;

                return (
                  <Card key={coupon.id} className="transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-2 py-1 text-lg font-bold">
                                {coupon.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => copyCode(coupon.code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            {coupon.discountName && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Linked to: {coupon.discountName}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {isExpired && <Badge variant="destructive">Expired</Badge>}
                            {isExhausted && !isExpired && (
                              <Badge variant="destructive">Exhausted</Badge>
                            )}
                            <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        {/* Usage bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-medium">
                              {coupon.usedCount} / {coupon.maxUsageCount}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 90
                                  ? 'bg-red-500'
                                  : usagePercent >= 70
                                    ? 'bg-orange-500'
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {coupon.maxPerCustomer != null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Per Customer</span>
                              <span>{coupon.maxPerCustomer} uses</span>
                            </div>
                          )}
                          {(coupon.startDate || coupon.endDate) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valid</span>
                              <span className="text-xs">
                                {coupon.startDate
                                  ? new Date(coupon.startDate).toLocaleDateString()
                                  : '-'}{' '}
                                -{' '}
                                {coupon.endDate
                                  ? new Date(coupon.endDate).toLocaleDateString()
                                  : '-'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <Switch
                            checked={coupon.isActive}
                            onCheckedChange={() => toggleCouponMutation.mutate(coupon.id)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this coupon?')) {
                                deleteCouponMutation.mutate(coupon.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {coupons.length === 0 && (
                <Card className="col-span-full p-12">
                  <div className="text-center">
                    <Ticket className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Coupon Codes</h3>
                    <p className="mt-2 text-muted-foreground">
                      {discounts.length === 0
                        ? 'Create a discount first, then generate coupon codes for it'
                        : 'Create coupon codes linked to your discounts'}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Edit Discount' : 'Create Discount'}
            </DialogTitle>
            <DialogDescription>
              {editingDiscount
                ? 'Update the discount details'
                : 'Set up a new promotional discount'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDiscountSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={discountForm.name}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, name: e.target.value })
                }
                placeholder="Summer Sale"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <SearchableSelect
                  value={discountForm.discountType}
                  onValueChange={(v) =>
                    setDiscountForm({
                      ...discountForm,
                      discountType: v as 'percentage' | 'flat',
                    })
                  }
                  options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'flat', label: 'Flat Amount' },
                  ]}
                  placeholder="Select type"
                />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.value}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, value: e.target.value })
                  }
                  placeholder={discountForm.discountType === 'percentage' ? '20' : '5.00'}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Min Order Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.minOrderAmount}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, minOrderAmount: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.maxDiscountAmount}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, maxDiscountAmount: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={discountForm.startDate}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={discountForm.endDate}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable To</Label>
              <SearchableSelect
                value={discountForm.applicableOn}
                onValueChange={(v) =>
                  setDiscountForm({ ...discountForm, applicableOn: v })
                }
                options={[
                  { value: 'all', label: 'All Orders' },
                  { value: 'dine-in', label: 'Dine-In' },
                  { value: 'takeaway', label: 'Takeaway' },
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'online', label: 'Online' },
                ]}
                placeholder="Select applicable to"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeDiscountDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createDiscountMutation.isPending || updateDiscountMutation.isPending
                }
              >
                {createDiscountMutation.isPending || updateDiscountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingDiscount ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Coupon Code</DialogTitle>
            <DialogDescription>
              Generate a coupon code linked to an existing discount
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCouponSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                }
                placeholder="SUMMER2026"
                required
              />
              <p className="text-xs text-muted-foreground">
                Will be converted to uppercase automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label>Linked Discount</Label>
              <SearchableSelect
                value={couponForm.discountId}
                onValueChange={(v) =>
                  setCouponForm({ ...couponForm, discountId: v })
                }
                options={discounts.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.discountType === 'percentage' ? `${d.value}%` : `Rs.${d.value}`})`,
                }))}
                placeholder="Select discount"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Usage Count</Label>
                <Input
                  type="number"
                  value={couponForm.maxUsageCount}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, maxUsageCount: e.target.value })
                  }
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Max Per Customer</Label>
                <Input
                  type="number"
                  value={couponForm.maxPerCustomer}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, maxPerCustomer: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={couponForm.startDate}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={couponForm.endDate}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeCouponDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCouponMutation.isPending || !couponForm.discountId}>
                {createCouponMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Coupon'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

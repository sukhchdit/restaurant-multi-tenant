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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Edit, Trash2, Percent, Tag, Calendar } from 'lucide-react';
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
};

export const Discounts = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    applicableOn: 'all' as string,
  });
  const queryClient = useQueryClient();

  const { data: discountsResponse, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.getDiscounts(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Discount>) => discountApi.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount created');
      closeDialog();
    },
    onError: () => toast.error('Failed to create discount'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Discount> }) =>
      discountApi.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount updated');
      closeDialog();
    },
    onError: () => toast.error('Failed to update discount'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountApi.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted');
    },
    onError: () => toast.error('Failed to delete discount'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => discountApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount status updated');
    },
    onError: () => toast.error('Failed to toggle discount'),
  });

  const discounts = discountsResponse?.data ?? [];

  const openCreate = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      discountType: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      startDate: '',
      endDate: '',
      applicableOn: 'all',
    });
    setDialogOpen(true);
  };

  const openEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      discountType: discount.discountType,
      value: String(discount.value),
      minOrderAmount: discount.minOrderAmount ? String(discount.minOrderAmount) : '',
      maxDiscountAmount: discount.maxDiscountAmount ? String(discount.maxDiscountAmount) : '',
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      applicableOn: discount.applicableOn || 'all',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDiscount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Discount> = {
      name: formData.name,
      discountType: formData.discountType,
      value: parseFloat(formData.value),
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      applicableOn: formData.applicableOn,
    };

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

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
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts & Coupons</h1>
          <p className="text-muted-foreground">
            Manage promotional discounts and coupon codes
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts</p>
                <p className="text-2xl font-bold">{discounts.length}</p>
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
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {discounts.filter((d) => d.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">
                  {discounts.filter((d) => d.endDate && new Date(d.endDate) < new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {discounts.map((discount) => {
          const isExpired = discount.endDate ? new Date(discount.endDate) < new Date() : false;
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
                          {discount.startDate ? new Date(discount.startDate).toLocaleDateString() : '—'} –{' '}
                          {discount.endDate ? new Date(discount.endDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <Switch
                      checked={discount.isActive}
                      onCheckedChange={() => toggleMutation.mutate(discount.id)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(discount)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this discount?')) {
                            deleteMutation.mutate(discount.id);
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Summer Sale"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <SearchableSelect
                  value={formData.discountType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, discountType: v as 'percentage' | 'flat' })
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
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder={formData.discountType === 'percentage' ? '20' : '5.00'}
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
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderAmount: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscountAmount: e.target.value })
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
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable To</Label>
              <SearchableSelect
                value={formData.applicableOn}
                onValueChange={(v) =>
                  setFormData({ ...formData, applicableOn: v })
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
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingDiscount ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

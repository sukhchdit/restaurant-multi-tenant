import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/api/axiosInstance';
import { menuApi } from '@/services/api/menuApi';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  Calendar,
  IndianRupee,
  Loader2,
  CheckIcon,
  ChevronDown,
  X,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api.types';
import type { MenuItem } from '@/types/menu.types';

interface ComboItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  description?: string;
  comboPrice: number;
  originalTotalPrice: number;
  comboDiscount: number;
  imageUrl?: string;
  isAvailable: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  items: ComboItem[];
}

interface ComboFormItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

const comboApi = {
  getCombos: async (): Promise<ApiResponse<Combo[]>> => {
    const response = await axiosInstance.get('/combos');
    return response.data;
  },
  createCombo: async (data: {
    name: string;
    description?: string;
    comboPrice: number;
    startDate?: string;
    endDate?: string;
    items: { menuItemId: string; quantity: number }[];
  }): Promise<ApiResponse<Combo>> => {
    const response = await axiosInstance.post('/combos', data);
    return response.data;
  },
  updateCombo: async (
    id: string,
    data: {
      name: string;
      description?: string;
      comboPrice: number;
      startDate?: string;
      endDate?: string;
      items: { menuItemId: string; quantity: number }[];
    }
  ): Promise<ApiResponse<Combo>> => {
    const response = await axiosInstance.put(`/combos/${id}`, data);
    return response.data;
  },
  deleteCombo: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/combos/${id}`);
    return response.data;
  },
  toggleAvailability: async (id: string): Promise<ApiResponse<Combo>> => {
    const response = await axiosInstance.patch(`/combos/${id}/toggle`);
    return response.data;
  },
};

export const Combos = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formComboPrice, setFormComboPrice] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formItems, setFormItems] = useState<ComboFormItem[]>([]);

  const queryClient = useQueryClient();

  // Queries
  const { data: combosResponse, isLoading: combosLoading } = useQuery({
    queryKey: ['combos'],
    queryFn: comboApi.getCombos,
  });

  const { data: menuItemsResponse } = useQuery({
    queryKey: ['menu-items-for-combo'],
    queryFn: () => menuApi.getItems({ pageSize: 500 }),
  });

  const combos = combosResponse?.data ?? [];
  const menuItems: MenuItem[] = useMemo(() => {
    if (!menuItemsResponse?.data) return [];
    const data = menuItemsResponse.data;
    // Handle paginated response (data has .items) or plain array
    if ('items' in data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  }, [menuItemsResponse]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: comboApi.createCombo,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['combos'] });
        toast.success('Combo created');
        closeDialog();
      } else {
        toast.error(response.message || 'Failed to create combo');
      }
    },
    onError: () => toast.error('Failed to create combo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof comboApi.updateCombo>[1] }) =>
      comboApi.updateCombo(id, data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['combos'] });
        toast.success('Combo updated');
        closeDialog();
      } else {
        toast.error(response.message || 'Failed to update combo');
      }
    },
    onError: () => toast.error('Failed to update combo'),
  });

  const deleteMutation = useMutation({
    mutationFn: comboApi.deleteCombo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      toast.success('Combo deleted');
    },
    onError: () => toast.error('Failed to delete combo'),
  });

  const toggleMutation = useMutation({
    mutationFn: comboApi.toggleAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      toast.success('Combo status updated');
    },
    onError: () => toast.error('Failed to toggle combo'),
  });

  // Calculated values
  const originalTotal = formItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const comboPriceNum = parseFloat(formComboPrice) || 0;
  const comboDiscount = originalTotal > 0 ? originalTotal - comboPriceNum : 0;
  const discountPercent =
    originalTotal > 0 ? Math.round((comboDiscount / originalTotal) * 100) : 0;

  // Dialog helpers
  const openCreate = () => {
    setEditingCombo(null);
    setFormName('');
    setFormDescription('');
    setFormComboPrice('');
    setFormStartDate('');
    setFormEndDate('');
    setFormItems([]);
    setDialogOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setFormName(combo.name);
    setFormDescription(combo.description || '');
    setFormComboPrice(String(combo.comboPrice));
    setFormStartDate(combo.startDate ? combo.startDate.split('T')[0] : '');
    setFormEndDate(combo.endDate ? combo.endDate.split('T')[0] : '');
    setFormItems(
      combo.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.menuItemName,
        price: item.menuItemPrice,
        quantity: item.quantity,
      }))
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCombo(null);
  };

  const toggleProduct = (item: MenuItem) => {
    setFormItems((prev) => {
      const existing = prev.find((p) => p.menuItemId === item.id);
      if (existing) {
        return prev.filter((p) => p.menuItemId !== item.id);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setFormItems((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
    );
  };

  const removeProduct = (menuItemId: string) => {
    setFormItems((prev) => prev.filter((p) => p.menuItemId !== menuItemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const payload = {
      name: formName,
      description: formDescription || undefined,
      comboPrice: comboPriceNum,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      items: formItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    };

    if (editingCombo) {
      updateMutation.mutate({ id: editingCombo.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (combosLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
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
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const activeCombos = combos.filter((c) => c.isAvailable);
  const expiredCombos = combos.filter(
    (c) => c.endDate && new Date(c.endDate) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Combo Offers</h1>
          <p className="text-muted-foreground">
            Create and manage combo deals for your menu items
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Combo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Combos</p>
                <p className="text-2xl font-bold">{combos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCombos.length}</p>
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
                <p className="text-2xl font-bold">{expiredCombos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combos Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {combos.map((combo) => {
          const isExpired = combo.endDate ? new Date(combo.endDate) < new Date() : false;
          const savingsPercent =
            combo.originalTotalPrice > 0
              ? Math.round((combo.comboDiscount / combo.originalTotalPrice) * 100)
              : 0;

          return (
            <Card key={combo.id} className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg">{combo.name}</h3>
                      {combo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {combo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 ml-2">
                      {isExpired && <Badge variant="destructive">Expired</Badge>}
                      <Badge variant={combo.isAvailable ? 'default' : 'secondary'}>
                        {combo.isAvailable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Products Included
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {combo.items.map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.menuItemName}
                          {item.quantity > 1 && ` x${item.quantity}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="rounded-lg bg-muted p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original Price</span>
                      <span className="line-through text-muted-foreground">
                        Rs. {combo.originalTotalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Combo Price</span>
                      <span className="text-xl font-bold text-primary">
                        Rs. {combo.comboPrice.toFixed(2)}
                      </span>
                    </div>
                    {combo.comboDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium">You Save</span>
                        <span className="text-green-600 font-medium">
                          Rs. {combo.comboDiscount.toFixed(2)} ({savingsPercent}% off)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Validity */}
                  {(combo.startDate || combo.endDate) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valid</span>
                      <span className="text-xs">
                        {combo.startDate
                          ? new Date(combo.startDate).toLocaleDateString()
                          : '-'}{' '}
                        -{' '}
                        {combo.endDate
                          ? new Date(combo.endDate).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <Switch
                      checked={combo.isAvailable}
                      onCheckedChange={() => toggleMutation.mutate(combo.id)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(combo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this combo?')) {
                            deleteMutation.mutate(combo.id);
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

        {combos.length === 0 && (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Layers className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No Combos</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first combo offer to get started
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? 'Edit Combo' : 'Create Combo'}
            </DialogTitle>
            <DialogDescription>
              {editingCombo
                ? 'Update the combo details and products'
                : 'Create a new combo offer with selected menu items'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Combo Name */}
            <div className="space-y-2">
              <Label>Combo Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Family Feast Combo"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="A delicious family meal deal"
              />
            </div>

            {/* Products Included (Multi-select) */}
            <div className="space-y-2">
              <Label>Products Included *</Label>
              <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="border-input flex h-9 w-full items-center justify-between rounded-md border bg-input-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="text-muted-foreground">
                      {formItems.length === 0
                        ? 'Select menu items...'
                        : `${formItems.length} item${formItems.length > 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search menu items..." />
                    <CommandList className="max-h-64">
                      <CommandEmpty>No items found.</CommandEmpty>
                      <CommandGroup>
                        {menuItems.map((item) => {
                          const isSelected = formItems.some(
                            (p) => p.menuItemId === item.id
                          );
                          return (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={() => toggleProduct(item)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {item.name}
                                  <span className="ml-2 text-muted-foreground text-xs">
                                    Rs. {item.price.toFixed(2)}
                                  </span>
                                </span>
                                <CheckIcon
                                  className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                                />
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected items with quantity */}
              {formItems.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  {formItems.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          Rs. {item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => removeProduct(item.menuItemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Original Total Price</Label>
                <Input
                  value={originalTotal > 0 ? `Rs. ${originalTotal.toFixed(2)}` : '-'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-calculated</p>
              </div>
              <div className="space-y-2">
                <Label>Combo Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formComboPrice}
                  onChange={(e) => setFormComboPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Combo Discount</Label>
                <Input
                  value={
                    comboDiscount > 0
                      ? `Rs. ${comboDiscount.toFixed(2)} (${discountPercent}%)`
                      : '-'
                  }
                  disabled
                  className={`bg-muted ${comboDiscount > 0 ? 'text-green-600 font-medium' : ''}`}
                />
                <p className="text-xs text-muted-foreground">Auto-calculated</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCombo ? (
                  'Update Combo'
                ) : (
                  'Create Combo'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

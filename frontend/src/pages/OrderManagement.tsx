import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/services/api/orderApi';
import { menuApi } from '@/services/api/menuApi';
import { tableApi } from '@/services/api/tableApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Eye, Trash2, Clock, CheckCircle, Minus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, OrderStatus, OrderType, CreateOrderRequest, UpdateOrderRequest } from '@/types/order.types';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  served: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [orderType, setOrderType] = useState<string>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [orderItems, setOrderItems] = useState<{ menuItemId: string; name: string; quantity: number; price: number }[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<UpdateOrderRequest>({});
  const [editTableId, setEditTableId] = useState('');
  const [editItems, setEditItems] = useState<{ menuItemId: string; name: string; quantity: number; price: number }[]>([]);
  const queryClient = useQueryClient();

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', searchTerm],
    queryFn: () => orderApi.getOrders({ search: searchTerm || undefined, pageSize: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const { data: menuResponse } = useQuery({
    queryKey: ['menu-for-order'],
    queryFn: () => menuApi.getItems({ isAvailable: true, pageSize: 200 }),
    enabled: newOrderOpen || editDialogOpen,
  });

  const { data: tablesResponse } = useQuery({
    queryKey: ['tables-for-order', 'available'],
    queryFn: () => tableApi.getTables({ availableOnly: true }),
    enabled: (newOrderOpen && orderType === 'dine-in') || (editDialogOpen && (editForm.orderType || editingOrder?.orderType) === 'dine-in'),
  });

  const menuItems = menuResponse?.data?.items ?? [];
  const availableTables = tablesResponse?.data ?? [];

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created');
      resetNewOrderForm();
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => orderApi.deleteOrder(id, 'Deleted by staff'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
    },
    onError: () => {
      toast.error('Failed to delete order');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      orderApi.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated');
      setEditDialogOpen(false);
      setEditingOrder(null);
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      specialNotes: order.specialNotes || '',
      orderType: order.orderType,
    });
    setEditTableId(order.tableId || '');
    setEditItems(
      order.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.menuItemName,
        quantity: item.quantity,
        price: item.unitPrice,
      }))
    );
    setEditDialogOpen(true);
  };

  const addEditItem = (item: { id: string; name: string; price: number }) => {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  };

  const removeEditItem = (menuItemId: string) => {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.menuItemId !== menuItemId);
    });
  };

  const resetNewOrderForm = () => {
    setNewOrderOpen(false);
    setOrderType('dine-in');
    setCustomerName('');
    setCustomerPhone('');
    setSpecialNotes('');
    setOrderItems([]);
  };

  const addItemToOrder = (item: { id: string; name: string; price: number }) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  };

  const removeItemFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.menuItemId !== menuItemId);
    });
  };

  const [selectedTableId, setSelectedTableId] = useState('');

  const orders = ordersResponse?.data?.items ?? [];

  const filterOrders = (status?: OrderStatus) => {
    let filtered = orders;
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    return filtered;
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const viewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{order.customerName || 'Guest'}</h3>
                <Badge variant="outline" className="text-xs">
                  {order.orderNumber}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {order.tableNumber || 'No table'} - {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <Badge className={statusColors[order.status]}>
              {order.status}
            </Badge>
          </div>

          {/* Items */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItemName}
                </span>
                <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-1 border-t border-border pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subTotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => viewOrder(order)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(order)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {order.status === 'pending' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleStatusUpdate(order.id, 'confirmed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            )}

            {order.status === 'confirmed' && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => handleStatusUpdate(order.id, 'preparing')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Prepare
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteOrder(order.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage all restaurant orders
          </p>
        </div>
        <Button onClick={() => setNewOrderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search orders by customer, table, or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing ({filterOrders('preparing').length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({filterOrders('ready').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterOrders('completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrders().map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrders('pending').map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preparing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrders('preparing').map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrders('ready').map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrders('completed').map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={(open) => { if (!open) resetNewOrderForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>Create a new order by selecting items from the menu.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (orderItems.length === 0) {
                toast.error('Please add at least one item to the order');
                return;
              }
              const request: CreateOrderRequest = {
                orderType: orderType as CreateOrderRequest['orderType'],
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                specialNotes: specialNotes || undefined,
                tableId: selectedTableId || undefined,
                items: orderItems.map((i) => ({
                  menuItemId: i.menuItemId,
                  quantity: i.quantity,
                })),
              };
              createOrderMutation.mutate(request);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Type *</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'dine-in' && (
                <div className="space-y-2">
                  <Label>Table</Label>
                  <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.tableNumber} ({table.capacity} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91-..."
                />
              </div>
            </div>

            {/* Menu Item Selection */}
            <div className="space-y-2">
              <Label>Menu Items *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-between"
                    onClick={() => addItemToOrder({ id: item.id, name: item.name, price: item.price })}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="ml-2 text-muted-foreground">${item.price.toFixed(2)}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Items */}
            {orderItems.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Items</Label>
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {orderItems.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItemFromOrder(item.menuItemId)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => addItemToOrder({ id: item.menuItemId, name: item.name, price: item.price })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-2 w-16 text-right text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Special Notes</Label>
              <Textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetNewOrderForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order {editingOrder?.orderNumber} — add items, change quantities, or update details.
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editItems.length === 0) {
                  toast.error('Order must have at least one item');
                  return;
                }
                const data: UpdateOrderRequest = {
                  ...editForm,
                  tableId: editTableId || undefined,
                  items: editItems.map((i) => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                  })),
                };
                updateOrderMutation.mutate({ id: editingOrder.id, data });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select
                    value={editForm.orderType || editingOrder.orderType}
                    onValueChange={(value) => setEditForm({ ...editForm, orderType: value as OrderType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editForm.orderType || editingOrder.orderType) === 'dine-in' && (
                  <div className="space-y-2">
                    <Label>Table</Label>
                    <Select value={editTableId} onValueChange={setEditTableId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.tableNumber} ({table.capacity} seats)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editForm.customerName || ''}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    placeholder="Guest"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editForm.customerPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    placeholder="+91-..."
                  />
                </div>
              </div>

              {/* Menu Item Selection */}
              <div className="space-y-2">
                <Label>Add Menu Items</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-between"
                      onClick={() => addEditItem({ id: item.id, name: item.name, price: item.price })}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="ml-2 text-muted-foreground">${item.price.toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Current Items */}
              {editItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Order Items</Label>
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    {editItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeEditItem(item.menuItemId)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => addEditItem({ id: item.menuItemId, name: item.name, price: item.price })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="ml-2 w-16 text-right text-sm font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-semibold">
                      <span>Subtotal</span>
                      <span>${editItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Special Notes</Label>
                <Textarea
                  value={editForm.specialNotes || ''}
                  onChange={(e) => setEditForm({ ...editForm, specialNotes: e.target.value })}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOrderMutation.isPending}>
                  {updateOrderMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName || 'Guest'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">{selectedOrder.tableNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge>{selectedOrder.orderType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="mb-2 font-semibold">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between rounded-lg bg-muted p-3"
                    >
                      <div>
                        <p className="font-medium">{item.menuItemName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subTotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${selectedOrder.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => {
                    handleStatusUpdate(selectedOrder.id, value);
                    setSelectedOrder({ ...selectedOrder, status: value as OrderStatus });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="served">Served</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

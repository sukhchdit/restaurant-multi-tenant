import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/services/api/orderApi';
import { menuApi } from '@/services/api/menuApi';
import { tableApi } from '@/services/api/tableApi';
import { staffApi } from '@/services/api/staffApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import {
  Search, Plus, Eye, Trash2, Clock, CheckCircle, Minus, Pencil,
  List, Columns2, Columns3, Columns4, ClipboardList,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Leaf, Printer, RotateCcw, X,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutHint } from '@/components/keyboard/KeyboardShortcutHint';
import { printBill } from '@/components/order/PrintBill';
import type { Order, OrderStatus, OrderType, CreateOrderRequest, UpdateOrderRequest } from '@/types/order.types';
import type { MenuItem } from '@/types/menu.types';

const PAGE_SIZE = 15;

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  served: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
  served: ['completed'],
  completed: [],
  cancelled: [],
};

const MenuItemSearch = ({
  items,
  onSelect,
  label = 'Menu Items',
  required = false,
}: {
  items: MenuItem[];
  onSelect: (item: { id: string; name: string; price: number; isHalf?: boolean }) => void;
  label?: string;
  required?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: MenuItem) => {
    const effectivePrice = item.discountedPrice ?? item.price;
    onSelect({ id: item.id, name: item.name, price: effectivePrice, isHalf: item.isHalf });
    setSearch(item.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}{required ? ' *' : ''}</Label>}
      <div ref={containerRef} className="relative" onBlur={handleBlur}>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 focus-within:ring-1 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); inputRef.current?.select(); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
            }}
          />
          <Badge variant="secondary" className="shrink-0 text-xs">{items.length} items</Badge>
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No items match &ldquo;{search}&rdquo;
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.isVeg && (
                        <Leaf className="h-3.5 w-3.5 shrink-0 text-green-600" />
                      )}
                      <span className="truncate">{item.name}</span>
                      {item.isHalf && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Half</Badge>
                      )}
                      {item.categoryName && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-medium">
                      {item.discountedPrice != null && item.discountedPrice < item.price ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-green-600">
                            ${item.discountedPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>${item.price.toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const OrderManagement = () => {
  // ── Main tab state ──
  const [mainTab, setMainTab] = useState<'orders' | 'new-order'>('orders');

  // ── Orders List state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [gridCols, setGridCols] = useState<1 | 2 | 3 | 4>(4);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<UpdateOrderRequest>({});
  const [editTableId, setEditTableId] = useState('');
  const [editItems, setEditItems] = useState<{ menuItemId: string; name: string; quantity: number; price: number }[]>([]);

  // ── New Order form state ──
  const [orderType, setOrderType] = useState<string>('dine-in');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [orderItems, setOrderItems] = useState<{ menuItemId: string; name: string; quantity: number; price: number; isHalf?: boolean }[]>([]);
  const [newOrderStagedItem, setNewOrderStagedItem] = useState<{ id: string; name: string; price: number; isHalf?: boolean } | null>(null);
  const [newOrderStagedQty, setNewOrderStagedQty] = useState(1);
  const [newOrderIsHalf, setNewOrderIsHalf] = useState(false);

  // ── Payment fields ──
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isGstApplied, setIsGstApplied] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', searchTerm, activeTab, pageNumber],
    queryFn: () => orderApi.getOrders({
      search: searchTerm || undefined,
      status: activeTab !== 'all' ? activeTab : undefined,
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
  });

  const { data: menuResponse } = useQuery({
    queryKey: ['menu-for-order'],
    queryFn: () => menuApi.getItems({ isAvailable: true, pageSize: 200 }),
    enabled: mainTab === 'new-order' || editDialogOpen,
  });

  const { data: allTablesRes } = useQuery({
    queryKey: ['tables-for-order', 'all'],
    queryFn: () => tableApi.getTables(),
  });

  const { data: newOrderTablesRes } = useQuery({
    queryKey: ['tables-for-order', 'available'],
    queryFn: () => tableApi.getTables({ availableOnly: true }),
    enabled: mainTab === 'new-order' && orderType === 'dine-in',
  });

  const { data: waitersRes } = useQuery({
    queryKey: ['staff-waiters'],
    queryFn: () => staffApi.getStaff({ role: 'Waiter' }),
    enabled: mainTab === 'new-order',
  });

  const menuItems = menuResponse?.data?.items ?? [];
  const newOrderTables = newOrderTablesRes?.data ?? [];
  const allTables = allTablesRes?.data ?? [];
  const availableTablesCount = allTables.filter((t) => t.status === 'available').length;
  const waiters = waitersRes?.data?.items ?? [];
  const editOrderTables = allTables.filter(
    (t) => t.status === 'available' || t.id === editingOrder?.tableId
  );

  // ── Computed pricing (New Order) ──
  const subTotal = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [orderItems]
  );
  const discountAmount = useMemo(
    () => Math.round(subTotal * discountPercentage) / 100,
    [subTotal, discountPercentage]
  );
  const taxableAmount = subTotal - discountAmount;
  const gstAmount = useMemo(
    () => (isGstApplied ? Math.round(taxableAmount * gstPercentage) / 100 : 0),
    [isGstApplied, taxableAmount, gstPercentage]
  );
  const vatAmount = useMemo(
    () => Math.round(taxableAmount * vatPercentage) / 100,
    [taxableAmount, vatPercentage]
  );
  const grandTotal = useMemo(
    () => taxableAmount + gstAmount + vatAmount + extraCharges,
    [taxableAmount, gstAmount, vatAmount, extraCharges]
  );

  // ── Mutations ──
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateOrderStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
      if (response.data && selectedOrder?.id === response.data.id) {
        setSelectedOrder(response.data);
      }
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
      toast.success('Order created');
      resetNewOrderForm();
      setMainTab('orders');
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => orderApi.deleteOrder(id, 'Deleted by staff'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
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
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
      toast.success('Order updated');
      setEditDialogOpen(false);
      setEditingOrder(null);
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  // ── Form helpers ──
  const resetNewOrderForm = () => {
    setOrderType('dine-in');
    setSelectedTableId('');
    setWaiterId('');
    setCustomerName('');
    setCustomerPhone('');
    setSpecialNotes('');
    setOrderItems([]);
    setNewOrderStagedItem(null);
    setNewOrderStagedQty(1);
    setNewOrderIsHalf(false);
    setPaymentMethod('cash');
    setDiscountPercentage(0);
    setIsGstApplied(false);
    setGstPercentage(0);
    setVatPercentage(0);
    setExtraCharges(0);
    setPaidAmount(0);
  };

  const stageNewOrderItem = (item: { id: string; name: string; price: number; isHalf?: boolean }) => {
    setNewOrderStagedItem(item);
    setNewOrderStagedQty(1);
    setNewOrderIsHalf(item.isHalf ?? false);
  };

  const confirmNewOrderStagedItem = () => {
    if (!newOrderStagedItem) return;
    const qty = newOrderIsHalf ? 1 : newOrderStagedQty;
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === newOrderStagedItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === newOrderStagedItem.id
            ? { ...i, quantity: newOrderIsHalf ? 1 : i.quantity + qty }
            : i
        );
      }
      return [...prev, {
        menuItemId: newOrderStagedItem.id,
        name: newOrderStagedItem.name,
        quantity: qty,
        price: newOrderStagedItem.price,
        isHalf: newOrderIsHalf,
      }];
    });
    setNewOrderStagedItem(null);
    setNewOrderStagedQty(1);
    setNewOrderIsHalf(false);
  };

  const deleteItemFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

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

  const handleSubmitNewOrder = () => {
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
      waiterId: waiterId || undefined,
      paymentMethod: paymentMethod || undefined,
      discountPercentage,
      extraCharges,
      isGstApplied,
      gstPercentage,
      vatPercentage,
      paidAmount,
      items: orderItems.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      })),
    };
    createOrderMutation.mutate(request);
  };

  const handlePrintBill = () => {
    const waiter = waiters.find((w) => w.id === waiterId);
    const table = newOrderTables.find((t) => t.id === selectedTableId);
    printBill({
      orderNumber: 'NEW',
      date: new Date().toLocaleString(),
      customerName: customerName || 'Guest',
      tableNumber: table?.tableNumber,
      waiterName: waiter?.fullName,
      items: orderItems.map((i) => ({ name: i.name, rate: i.price, qty: i.quantity })),
      subTotal,
      discountPercentage,
      discountAmount,
      gstAmount,
      vatAmount,
      extraCharges,
      grandTotal,
      paidAmount,
    });
  };

  // ── Data ──
  const orders = ordersResponse?.data?.items ?? [];
  const paginatedData = ordersResponse?.data;
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPageNumber(1);
  };

  const pageShortcuts = useMemo(() => ({
    'n': () => setMainTab('new-order'),
    '/': () => searchInputRef.current?.focus(),
    '1': () => handleTabChange('all'),
    '2': () => handleTabChange('pending'),
    '3': () => handleTabChange('preparing'),
    '4': () => handleTabChange('ready'),
    '5': () => handleTabChange('completed'),
  }), []);

  useKeyboardShortcuts(pageShortcuts);

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

  const gridColsClass = {
    1: 'grid gap-4 grid-cols-1',
    2: 'grid gap-4 grid-cols-1 lg:grid-cols-2',
    3: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[gridCols];

  // ── Order Card component ──
  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="flex flex-col overflow-hidden border border-primary/20 bg-primary/[0.03] transition-all hover:border-primary/40 hover:shadow-lg">
      {/* Card body */}
      <CardContent className="flex-1 p-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold truncate">{order.customerName || 'Guest'}</h3>
              <span className="shrink-0 text-xs text-muted-foreground">{order.orderNumber}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {order.tableNumber ? `Table ${order.tableNumber}` : 'No table'} &bull; {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <Badge className={cn('shrink-0', statusColors[order.status])}>
            {order.status}
          </Badge>
        </div>

        {/* Items */}
        <div className="mt-4 space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}x {item.menuItemName}
              </span>
              <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-1">
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
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-red-600">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => viewOrder(order)}>
          <Eye className="mr-2 h-4 w-4" /> View
        </Button>
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEditDialog(order)} title="Edit order">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {order.status === 'pending' && (
          <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleStatusUpdate(order.id, 'confirmed')}>
            <CheckCircle className="mr-2 h-4 w-4" /> Confirm
          </Button>
        )}
        {order.status === 'confirmed' && (
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
            <Clock className="mr-2 h-4 w-4" /> Prepare
          </Button>
        )}
        <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteOrder(order.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
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
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
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
      {/* Header with inline tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'orders' | 'new-order')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">
              Track and manage all restaurant orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="orders">Orders List</TabsTrigger>
            </TabsList>
            <Button onClick={() => setMainTab('new-order')}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
              <KeyboardShortcutHint shortcut="N" />
            </Button>
          </div>
        </div>

        {/* ════════════════════════════ ORDERS LIST TAB ════════════════════════════ */}
        <TabsContent value="orders">
          <div className="space-y-6 mt-4">
            {/* Stats — compact inline bar */}
            <div className="flex rounded-lg border border-border bg-card text-card-foreground">
              <div className="flex flex-1 items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Total Orders</span>
                <span className="text-xl font-bold">{totalCount}</span>
              </div>
              <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Pending</span>
                <span className="text-xl font-bold text-yellow-600">{orders.filter((o) => o.status === 'pending').length}</span>
              </div>
              <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Preparing</span>
                <span className="text-xl font-bold text-green-600">{orders.filter((o) => o.status === 'preparing').length}</span>
              </div>
              <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Ready</span>
                <span className="text-xl font-bold text-orange-600">{orders.filter((o) => o.status === 'ready').length}</span>
              </div>
              <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Available Tables</span>
                <span className="text-xl font-bold text-blue-600">{availableTablesCount}<span className="text-sm font-normal text-muted-foreground ml-1">/ {allTables.length}</span></span>
              </div>
            </div>

            {/* Search + View Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by customer, table, or order ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="hidden lg:flex items-center gap-1 rounded-lg border border-border p-1">
                {([
                  { cols: 1 as const, icon: List, label: 'List view' },
                  { cols: 2 as const, icon: Columns2, label: '2 columns' },
                  { cols: 3 as const, icon: Columns3, label: '3 columns' },
                  { cols: 4 as const, icon: Columns4, label: '4 columns' },
                ]).map(({ cols, icon: Icon, label }) => (
                  <Button
                    key={cols}
                    size="icon"
                    variant={gridCols === cols ? 'default' : 'ghost'}
                    className="h-8 w-8"
                    title={label}
                    onClick={() => setGridCols(cols)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Order Status Tabs + Grid */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                {([
                  { value: 'all', label: 'All Orders' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'preparing', label: 'Preparing' },
                  { value: 'ready', label: 'Ready' },
                  { value: 'completed', label: 'Completed' },
                ]).map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                    {activeTab === value && (
                      <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                        {totalCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mb-3" />
                    <p className="font-medium">
                      {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
                    </p>
                    <p className="text-sm">
                      {activeTab === 'all'
                        ? 'Create your first order to get started.'
                        : `There are no orders with "${activeTab}" status.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={gridColsClass}>
                      {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {(pageNumber - 1) * PAGE_SIZE + 1}&ndash;{Math.min(pageNumber * PAGE_SIZE, totalCount)} of {totalCount}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageNumber <= 1} onClick={() => setPageNumber(1)} title="First page">
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => Math.max(1, p - 1))} title="Previous page">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="px-3 text-sm font-medium">
                            Page {pageNumber} of {totalPages}
                          </span>
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))} title="Next page">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageNumber >= totalPages} onClick={() => setPageNumber(totalPages)} title="Last page">
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {totalPages <= 1 && totalCount > 0 && (
                      <div className="border-t border-border pt-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {totalCount} order{totalCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </TabsContent>

        {/* ════════════════════════════ NEW ORDER TAB ════════════════════════════ */}
        <TabsContent value="new-order">
          <div className="mt-4 space-y-5">
            {/* Row 1: Order Type, Table, Waiter, Customer Name, Mobile, + New Order button */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              <div className="space-y-2">
                <Label className="font-medium">Order Type *</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'dine-in' ? (
                <div className="space-y-2">
                  <Label className="font-medium">Table No</Label>
                  <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                    <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                    <SelectContent>
                      {newOrderTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.tableNumber} ({table.capacity} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="font-medium">Table No</Label>
                  <Input disabled placeholder="N/A" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-medium">Waiter</Label>
                <Select value={waiterId} onValueChange={setWaiterId}>
                  <SelectTrigger><SelectValue placeholder="Select waiter" /></SelectTrigger>
                  <SelectContent>
                    {waiters.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Customer Name</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Guest" />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Mobile No</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91-..." />
              </div>

              <Button
                className="h-9"
                onClick={handleSubmitNewOrder}
                disabled={createOrderMutation.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                {createOrderMutation.isPending ? 'Creating...' : 'New Order'}
              </Button>
            </div>

            {/* Row 2: Product search, Qty, Half, Add */}
            <div className="flex items-end gap-3">
              <div className="w-1/2">
                <MenuItemSearch
                  items={menuItems}
                  onSelect={stageNewOrderItem}
                  label="Select Product"
                  required
                />
              </div>

              {newOrderStagedItem && (
                <div className="flex items-end gap-2">
                  <span className="h-9 flex items-center text-sm font-medium max-w-[160px] truncate" title={newOrderStagedItem.name}>
                    {newOrderStagedItem.name}
                  </span>
                  <div className="space-y-2">
                    <Label className="text-xs">Qty</Label>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={newOrderIsHalf || newOrderStagedQty <= 1} onClick={() => setNewOrderStagedQty((q) => Math.max(1, q - 1))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={newOrderIsHalf ? 1 : newOrderStagedQty}
                        onChange={(e) => setNewOrderStagedQty(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={newOrderIsHalf}
                        className="h-9 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={newOrderIsHalf} onClick={() => setNewOrderStagedQty((q) => q + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 h-9">
                    <Checkbox
                      id="new-order-half"
                      checked={newOrderIsHalf}
                      onCheckedChange={(v) => setNewOrderIsHalf(v === true)}
                    />
                    <Label htmlFor="new-order-half" className="text-sm cursor-pointer">Half</Label>
                  </div>

                  <span className="h-9 flex items-center text-sm font-semibold min-w-[60px]">
                    ${(newOrderStagedItem.price * (newOrderIsHalf ? 1 : newOrderStagedQty)).toFixed(2)}
                  </span>

                  <Button className="h-9 bg-green-600 hover:bg-green-700 text-white" onClick={confirmNewOrderStagedItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => { setNewOrderStagedItem(null); setNewOrderStagedQty(1); setNewOrderIsHalf(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium w-12">#</th>
                    <th className="px-4 py-2 text-left font-medium">Product</th>
                    <th className="px-4 py-2 text-right font-medium w-24">Rate</th>
                    <th className="px-4 py-2 text-center font-medium w-16">Qty</th>
                    <th className="px-4 py-2 text-right font-medium w-24">Amount</th>
                    <th className="px-4 py-2 text-center font-medium w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No items added yet. Search and add products above.
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item, idx) => (
                      <tr key={item.menuItemId} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2">
                          {item.name}
                          {item.isHalf && <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Half</Badge>}
                        </td>
                        <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteItemFromOrder(item.menuItemId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Section */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Payment Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Payment Mode</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Total Amount</Label>
                    <Input value={`$${subTotal.toFixed(2)}`} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Discount %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Discount Amt</Label>
                    <Input value={`$${discountAmount.toFixed(2)}`} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Total</Label>
                    <Input value={`$${taxableAmount.toFixed(2)}`} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">GST</Label>
                    <Input value={`$${gstAmount.toFixed(2)}`} readOnly className="bg-muted" />
                  </div>
                </div>

                {/* Payment Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  <div className="flex items-center gap-2 h-9">
                    <Checkbox
                      id="gst-checkbox"
                      checked={isGstApplied}
                      onCheckedChange={(v) => setIsGstApplied(v === true)}
                    />
                    <Label htmlFor="gst-checkbox" className="text-sm cursor-pointer">Is GST</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">GST %</Label>
                    <Input
                      type="number"
                      min={0}
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                      disabled={!isGstApplied}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Paid Amount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Extra Charges</Label>
                    <Input
                      type="number"
                      min={0}
                      value={extraCharges}
                      onChange={(e) => setExtraCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">G.Total</Label>
                    <Input value={`$${grandTotal.toFixed(2)}`} readOnly className="bg-muted font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">VAT %</Label>
                    <Input
                      type="number"
                      min={0}
                      value={vatPercentage}
                      onChange={(e) => setVatPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Notes */}
            <Textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={2}
            />

            {/* Footer Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handlePrintBill} disabled={orderItems.length === 0}>
                <Printer className="mr-2 h-4 w-4" /> Print Bill
              </Button>
              <Button onClick={handleSubmitNewOrder} disabled={createOrderMutation.isPending || orderItems.length === 0}>
                {createOrderMutation.isPending ? 'Creating...' : 'Save Order'}
              </Button>
              <Button variant="secondary" onClick={resetNewOrderForm}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Order
              </Button>
              <Button variant="ghost" onClick={() => { resetNewOrderForm(); setMainTab('orders'); }}>
                <X className="mr-2 h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════ EDIT ORDER DIALOG ════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[60vw] max-w-[60vw] sm:max-w-[60vw] max-h-[80vh] overflow-y-auto p-6">
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                      <SelectContent>
                        {editOrderTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.tableNumber} ({table.capacity} seats)
                            {table.id === editingOrder.tableId ? ' (current)' : ''}
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

              <MenuItemSearch
                items={menuItems}
                onSelect={addEditItem}
                label="Add Menu Items"
              />

              {editItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Order Items</Label>
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    {editItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => removeEditItem(item.menuItemId)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => addEditItem({ id: item.menuItemId, name: item.name, price: item.price })}>
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

      {/* ════════════════════════════ VIEW ORDER DIALOG ════════════════════════════ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[60vw] max-w-[60vw] sm:max-w-[60vw] max-h-[80vh] overflow-y-auto">
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
                      className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                    >
                      <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                      <span className="font-semibold">${item.totalPrice.toFixed(2)}</span>
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
                    <span>Discount ({selectedOrder.discountPercentage}%)</span>
                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({selectedOrder.gstPercentage}%)</span>
                    <span>${selectedOrder.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.vatAmount > 0 && (
                  <div className="flex justify-between">
                    <span>VAT ({selectedOrder.vatPercentage}%)</span>
                    <span>${selectedOrder.vatAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.extraCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Extra Charges</span>
                    <span>${selectedOrder.extraCharges.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                {selectedOrder.paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Paid</span>
                    <span>${selectedOrder.paidAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Print from view dialog */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  printBill({
                    orderNumber: selectedOrder.orderNumber,
                    date: new Date(selectedOrder.createdAt).toLocaleString(),
                    customerName: selectedOrder.customerName || 'Guest',
                    tableNumber: selectedOrder.tableNumber,
                    waiterName: selectedOrder.waiterName,
                    items: selectedOrder.items.map((i) => ({ name: i.menuItemName, rate: i.unitPrice, qty: i.quantity })),
                    subTotal: selectedOrder.subTotal,
                    discountPercentage: selectedOrder.discountPercentage,
                    discountAmount: selectedOrder.discountAmount,
                    gstAmount: selectedOrder.gstAmount,
                    vatAmount: selectedOrder.vatAmount,
                    extraCharges: selectedOrder.extraCharges,
                    grandTotal: selectedOrder.totalAmount,
                    paidAmount: selectedOrder.paidAmount,
                  });
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Print Bill
              </Button>

              {validTransitions[selectedOrder.status].length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Update Status</p>
                  <div className="flex gap-2">
                    {validTransitions[selectedOrder.status].map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === 'cancelled' ? 'destructive' : 'default'}
                        className="flex-1"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => handleStatusUpdate(selectedOrder.id, next)}
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : statusLabels[next]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-1">
                  This order is {selectedOrder.status} — no further status changes.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

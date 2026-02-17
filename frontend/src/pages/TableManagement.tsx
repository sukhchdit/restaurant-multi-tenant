import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableApi } from '@/services/api/tableApi';
import { orderApi } from '@/services/api/orderApi';
import { menuApi } from '@/services/api/menuApi';
import { staffApi } from '@/services/api/staffApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Search, Plus, Pencil, Trash2, Minus,
  Leaf, Printer, RotateCcw, X,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutHint } from '@/components/keyboard/KeyboardShortcutHint';
import { printBill } from '@/components/order/PrintBill';
import type { RestaurantTable, TableStatus, CreateTableRequest } from '@/types/table.types';
import type { Order, OrderStatus, CreateOrderRequest, UpdateOrderRequest } from '@/types/order.types';
import type { MenuItem } from '@/types/menu.types';

const statusDotColors: Record<TableStatus, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-amber-500',
};

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  served: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const emptyTableForm: CreateTableRequest = {
  tableNumber: '',
  capacity: 4,
  floorNumber: 1,
  section: '',
};

/* ── MenuItemSearch (same as OrderManagement) ── */
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

export const TableManagement = () => {
  // ── Table state ──
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [tableForm, setTableForm] = useState<CreateTableRequest>({ ...emptyTableForm });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTableForm, setEditTableForm] = useState<CreateTableRequest>({ ...emptyTableForm });
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // ── Order form state ──
  const [orderType, setOrderType] = useState<string>('dine-in');
  const [waiterId, setWaiterId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [orderItems, setOrderItems] = useState<{ menuItemId: string; name: string; quantity: number; price: number; isHalf?: boolean }[]>([]);
  const [stagedItem, setStagedItem] = useState<{ id: string; name: string; price: number; isHalf?: boolean } | null>(null);
  const [stagedQty, setStagedQty] = useState(1);
  const [stagedIsHalf, setStagedIsHalf] = useState(false);

  // ── Payment fields ──
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isGstApplied, setIsGstApplied] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const queryClient = useQueryClient();

  const pageShortcuts = useMemo(() => ({
    'n': () => setAddDialogOpen(true),
  }), []);

  useKeyboardShortcuts(pageShortcuts);

  // ── Queries ──
  const { data: tablesResponse, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getTables(),
  });

  const { data: menuResponse } = useQuery({
    queryKey: ['menu-for-order'],
    queryFn: () => menuApi.getItems({ isAvailable: true, pageSize: 200 }),
    enabled: !!selectedTable,
  });

  const { data: waitersRes } = useQuery({
    queryKey: ['staff-waiters'],
    queryFn: () => staffApi.getStaff({ role: 'Waiter' }),
    enabled: !!selectedTable,
  });

  // ── Existing order query (for occupied tables) ──
  const activeOrderId = selectedTable?.currentOrderId ?? null;
  const { data: existingOrderRes, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['table-order', activeOrderId],
    queryFn: () => orderApi.getOrderById(activeOrderId!),
    enabled: !!activeOrderId,
  });
  const existingOrder = existingOrderRes?.data ?? null;
  const isEditingOrder = !!activeOrderId && !!existingOrder;

  const menuItems = menuResponse?.data?.items ?? [];
  const waiters = waitersRes?.data?.items ?? [];
  const tables = tablesResponse?.data ?? [];
  const availableTables = tables.filter((t) => t.status === 'available').length;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const reservedTables = tables.filter((t) => t.status === 'reserved').length;

  // Auto-select first table on initial load
  useEffect(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [tables]);

  // ── Populate form from existing order ──
  const populateFormFromOrder = useCallback((order: Order) => {
    setOrderType(order.orderType);
    setWaiterId(order.waiterId ?? '');
    setCustomerName(order.customerName ?? '');
    setCustomerPhone(order.customerPhone ?? '');
    setSpecialNotes(order.specialNotes ?? '');
    setOrderItems(
      order.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.menuItemName,
        quantity: item.quantity,
        price: item.unitPrice,
        isHalf: false,
      }))
    );
    setStagedItem(null);
    setStagedQty(1);
    setStagedIsHalf(false);
    setPaymentMethod(order.paymentMethod ?? 'cash');
    setDiscountPercentage(order.discountPercentage ?? 0);
    setIsGstApplied(order.isGstApplied ?? false);
    setGstPercentage(order.gstPercentage ?? 0);
    setVatPercentage(order.vatPercentage ?? 0);
    setExtraCharges(order.extraCharges ?? 0);
    setPaidAmount(order.paidAmount ?? 0);
  }, []);

  // Auto-populate when existing order loads
  useEffect(() => {
    if (existingOrder) {
      populateFormFromOrder(existingOrder);
    }
  }, [existingOrder, populateFormFromOrder]);

  // ── Computed pricing ──
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

  // ── Table mutations ──
  const createTableMutation = useMutation({
    mutationFn: (data: CreateTableRequest) => tableApi.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table created');
      setAddDialogOpen(false);
      setTableForm({ ...emptyTableForm });
    },
    onError: () => {
      toast.error('Failed to create table');
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTableRequest> }) =>
      tableApi.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table updated');
      setEditDialogOpen(false);
      setEditingTableId(null);
    },
    onError: () => {
      toast.error('Failed to update table');
    },
  });

  // ── Order mutation ──
  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
      toast.success('Order created');
      resetOrderForm();
      setSelectedTable(null);
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      orderApi.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-order'] });
      queryClient.invalidateQueries({ queryKey: ['table-order'] });
      toast.success('Order updated');
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  // ── Helpers ──
  const openEditDialog = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTableId(table.id);
    setEditTableForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      floorNumber: table.floorNumber,
      section: table.section || '',
    });
    setEditDialogOpen(true);
  };

  const resetOrderForm = () => {
    setOrderType('dine-in');
    setWaiterId('');
    setCustomerName('');
    setCustomerPhone('');
    setSpecialNotes('');
    setOrderItems([]);
    setStagedItem(null);
    setStagedQty(1);
    setStagedIsHalf(false);
    setPaymentMethod('cash');
    setDiscountPercentage(0);
    setIsGstApplied(false);
    setGstPercentage(0);
    setVatPercentage(0);
    setExtraCharges(0);
    setPaidAmount(0);
  };

  const selectTable = (table: RestaurantTable) => {
    if (selectedTable?.id === table.id) return;
    resetOrderForm();
    setSelectedTable(table);
  };

  const stageItem = (item: { id: string; name: string; price: number; isHalf?: boolean }) => {
    setStagedItem(item);
    setStagedQty(1);
    setStagedIsHalf(item.isHalf ?? false);
  };

  const confirmStagedItem = () => {
    if (!stagedItem) return;
    const qty = stagedIsHalf ? 1 : stagedQty;
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === stagedItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === stagedItem.id
            ? { ...i, quantity: stagedIsHalf ? 1 : i.quantity + qty }
            : i
        );
      }
      return [...prev, {
        menuItemId: stagedItem.id,
        name: stagedItem.name,
        quantity: qty,
        price: stagedItem.price,
        isHalf: stagedIsHalf,
      }];
    });
    setStagedItem(null);
    setStagedQty(1);
    setStagedIsHalf(false);
  };

  const deleteItemFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const handleSubmitOrder = () => {
    if (!selectedTable) return;
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    const items = orderItems.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    }));

    if (isEditingOrder && existingOrder) {
      // Update existing order
      const data: UpdateOrderRequest = {
        orderType: orderType as UpdateOrderRequest['orderType'],
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        specialNotes: specialNotes || undefined,
        tableId: selectedTable.id,
        waiterId: waiterId || undefined,
        paymentMethod: paymentMethod || undefined,
        discountPercentage,
        extraCharges,
        isGstApplied,
        gstPercentage,
        vatPercentage,
        paidAmount,
        items,
      };
      updateOrderMutation.mutate({ id: existingOrder.id, data });
    } else {
      // Create new order
      const request: CreateOrderRequest = {
        orderType: orderType as CreateOrderRequest['orderType'],
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        specialNotes: specialNotes || undefined,
        tableId: selectedTable.id,
        waiterId: waiterId || undefined,
        paymentMethod: paymentMethod || undefined,
        discountPercentage,
        extraCharges,
        isGstApplied,
        gstPercentage,
        vatPercentage,
        paidAmount,
        items,
      };
      createOrderMutation.mutate(request);
    }
  };

  const handlePrintBill = () => {
    if (!selectedTable) return;
    const waiter = waiters.find((w) => w.id === waiterId);
    printBill({
      orderNumber: existingOrder?.orderNumber ?? 'NEW',
      date: existingOrder ? new Date(existingOrder.createdAt).toLocaleString() : new Date().toLocaleString(),
      customerName: customerName || 'Guest',
      tableNumber: selectedTable.tableNumber,
      waiterName: waiter?.fullName ?? existingOrder?.waiterName,
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">Select a table to create an order</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
          <KeyboardShortcutHint shortcut="N" />
        </Button>
      </div>

      {/* Stats — compact inline bar */}
      <div className="flex rounded-lg border border-border bg-card text-card-foreground">
        <div className="flex flex-1 items-center justify-between px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Total Tables</span>
          <span className="text-xl font-bold">{tables.length}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Available</span>
          <span className="text-xl font-bold text-green-600">{availableTables}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Occupied</span>
          <span className="text-xl font-bold text-red-600">{occupiedTables}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Reserved</span>
          <span className="text-xl font-bold text-amber-600">{reservedTables}</span>
        </div>
      </div>

      {/* Sidebar + Order Form Layout */}
      <div className="flex gap-4" style={{ minHeight: '70vh' }}>
        {/* Left Sidebar — Table List */}
        <div className="w-52 shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tables</h2>
          </div>
          <div className="p-1">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => selectTable(table)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition-colors cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedTable?.id === table.id
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                    : ''
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusDotColors[table.status])} />
                  <span className="truncate font-medium">{table.tableNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => openEditDialog(table, e)}
                  className={cn(
                    'shrink-0 rounded p-1 transition-colors',
                    selectedTable?.id === table.id
                      ? 'hover:bg-primary-foreground/20 text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  title="Edit table"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
            {tables.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tables yet. Add one above.
              </p>
            )}
          </div>
        </div>

        {/* Right Side — Order Form or Empty State */}
        <div className="flex-1 rounded-lg border border-border bg-card p-5 overflow-y-auto">
          {!selectedTable ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Select a table from the sidebar</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click on a table to create or view an order
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Loading state for existing order */}
              {activeOrderId && isLoadingOrder && (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              )}

              {/* Existing order info banner */}
              {isEditingOrder && (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Order {existingOrder.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(existingOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={orderStatusColors[existingOrder.status]}>
                      {existingOrder.status}
                    </Badge>
                  </div>
                  {existingOrder.waiterName && (
                    <p className="text-sm text-muted-foreground">
                      Waiter: {existingOrder.waiterName}
                    </p>
                  )}
                </div>
              )}

              {/* Row 1: Order Type, Table No (readonly), Waiter, Customer, Mobile, + New Order */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="font-medium">Order Type *</Label>
                  <SearchableSelect
                    value={orderType}
                    onValueChange={setOrderType}
                    options={[
                      { value: 'dine-in', label: 'Dine In' },
                      { value: 'takeaway', label: 'Takeaway' },
                      { value: 'delivery', label: 'Delivery' },
                      { value: 'online', label: 'Online' },
                    ]}
                    placeholder="Select type"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Table No</Label>
                  <Input value={selectedTable.tableNumber} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Waiter</Label>
                  <SearchableSelect
                    value={waiterId}
                    onValueChange={setWaiterId}
                    options={waiters.map((w) => ({
                      value: w.id,
                      label: w.fullName,
                    }))}
                    placeholder="Select waiter"
                  />
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
                  onClick={handleSubmitOrder}
                  disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {isEditingOrder
                    ? (updateOrderMutation.isPending ? 'Updating...' : 'Update Order')
                    : (createOrderMutation.isPending ? 'Creating...' : 'New Order')
                  }
                </Button>
              </div>

              {/* Row 2: Product search, Qty, Half, Add */}
              <div className="flex items-end gap-3">
                <div className="w-1/2">
                  <MenuItemSearch
                    items={menuItems}
                    onSelect={stageItem}
                    label="Select Product"
                    required
                  />
                </div>

                {stagedItem && (
                  <div className="flex items-end gap-2">
                    <span className="h-9 flex items-center text-sm font-medium max-w-[160px] truncate" title={stagedItem.name}>
                      {stagedItem.name}
                    </span>
                    <div className="space-y-2">
                      <Label className="text-xs">Qty</Label>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={stagedIsHalf || stagedQty <= 1} onClick={() => setStagedQty((q) => Math.max(1, q - 1))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={stagedIsHalf ? 1 : stagedQty}
                          onChange={(e) => setStagedQty(Math.max(1, parseInt(e.target.value) || 1))}
                          disabled={stagedIsHalf}
                          className="h-9 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={stagedIsHalf} onClick={() => setStagedQty((q) => q + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 h-9">
                      <Checkbox
                        id="table-order-half"
                        checked={stagedIsHalf}
                        onCheckedChange={(v) => setStagedIsHalf(v === true)}
                      />
                      <Label htmlFor="table-order-half" className="text-sm cursor-pointer">Half</Label>
                    </div>

                    <span className="h-9 flex items-center text-sm font-semibold min-w-[60px]">
                      ${(stagedItem.price * (stagedIsHalf ? 1 : stagedQty)).toFixed(2)}
                    </span>

                    <Button className="h-9 bg-green-600 hover:bg-green-700 text-white" onClick={confirmStagedItem}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => { setStagedItem(null); setStagedQty(1); setStagedIsHalf(false); }}>
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
                      <SearchableSelect
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        options={[
                          { value: 'cash', label: 'Cash' },
                          { value: 'card', label: 'Card' },
                          { value: 'upi', label: 'UPI' },
                          { value: 'online', label: 'Online' },
                        ]}
                        placeholder="Select payment"
                      />
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
                        id="table-gst-checkbox"
                        checked={isGstApplied}
                        onCheckedChange={(v) => setIsGstApplied(v === true)}
                      />
                      <Label htmlFor="table-gst-checkbox" className="text-sm cursor-pointer">Is GST</Label>
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
                <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending || updateOrderMutation.isPending || orderItems.length === 0}>
                  {isEditingOrder
                    ? (updateOrderMutation.isPending ? 'Updating...' : 'Update Order')
                    : (createOrderMutation.isPending ? 'Creating...' : 'Save Order')
                  }
                </Button>
                <Button variant="secondary" onClick={() => {
                  if (isEditingOrder && existingOrder) {
                    populateFormFromOrder(existingOrder);
                  } else {
                    resetOrderForm();
                  }
                }}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Order
                </Button>
                <Button variant="ghost" onClick={() => { resetOrderForm(); setSelectedTable(null); }}>
                  <X className="mr-2 h-4 w-4" /> Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>Add a new table to your restaurant floor.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!tableForm.tableNumber) {
                toast.error('Please enter a table number');
                return;
              }
              createTableMutation.mutate(tableForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number *</Label>
                <Input
                  id="tableNumber"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  placeholder="e.g. T1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floorNumber">Floor</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  min="0"
                  value={tableForm.floorNumber ?? 1}
                  onChange={(e) => setTableForm({ ...tableForm, floorNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={tableForm.section || ''}
                  onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })}
                  placeholder="e.g. Outdoor"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTableMutation.isPending}>
                {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingTableId) return;
              if (!editTableForm.tableNumber) {
                toast.error('Please enter a table number');
                return;
              }
              updateTableMutation.mutate({ id: editingTableId, data: editTableForm });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTableNumber">Table Number *</Label>
                <Input
                  id="editTableNumber"
                  value={editTableForm.tableNumber}
                  onChange={(e) => setEditTableForm({ ...editTableForm, tableNumber: e.target.value })}
                  placeholder="e.g. T1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCapacity">Capacity *</Label>
                <Input
                  id="editCapacity"
                  type="number"
                  min="1"
                  value={editTableForm.capacity}
                  onChange={(e) => setEditTableForm({ ...editTableForm, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFloorNumber">Floor</Label>
                <Input
                  id="editFloorNumber"
                  type="number"
                  min="0"
                  value={editTableForm.floorNumber ?? 1}
                  onChange={(e) => setEditTableForm({ ...editTableForm, floorNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSection">Section</Label>
                <Input
                  id="editSection"
                  value={editTableForm.section || ''}
                  onChange={(e) => setEditTableForm({ ...editTableForm, section: e.target.value })}
                  placeholder="e.g. Outdoor"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTableMutation.isPending}>
                {updateTableMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

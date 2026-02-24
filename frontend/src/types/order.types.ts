export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'online';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type KOTStatus = 'not-sent' | 'sent' | 'acknowledged' | 'preparing' | 'ready';
export type PaymentStatus = 'pending' | 'partially-paid' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableNumber?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  waiterId?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  waiterName?: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  discountPercentage: number;
  extraCharges: number;
  isGstApplied: boolean;
  gstPercentage: number;
  gstAmount: number;
  vatPercentage: number;
  vatAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  specialNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  isVeg?: boolean;
  status: string;
}

export interface CreateOrderRequest {
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  waiterId?: string;
  orderType: OrderType;
  items: CreateOrderItemRequest[];
  specialNotes?: string;
  discountId?: string;
  paymentMethod?: string;
  discountPercentage?: number;
  extraCharges?: number;
  isGstApplied?: boolean;
  gstPercentage?: number;
  vatPercentage?: number;
  paidAmount?: number;
}

export interface UpdateOrderRequest {
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  waiterId?: string;
  orderType?: OrderType;
  specialNotes?: string;
  deliveryAddress?: string;
  items?: CreateOrderItemRequest[];
  paymentMethod?: string;
  discountPercentage?: number;
  extraCharges?: number;
  isGstApplied?: boolean;
  gstPercentage?: number;
  vatPercentage?: number;
  paidAmount?: number;
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface KitchenOrderTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  kotNumber: string;
  tableNumber?: string;
  status: KOTStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: KOTItem[];
  printCount: number;
  printedAt?: string;
  sentAt: string;
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface KOTItem {
  id: string;
  menuItemName: string;
  quantity: number;
  notes?: string;
  isVeg?: boolean;
  status: string;
}

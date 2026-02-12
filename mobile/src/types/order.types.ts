export type OrderType = 'DineIn' | 'TakeAway' | 'Delivery' | 'Online';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
export type KOTStatus = 'Sent' | 'Acknowledged' | 'Preparing' | 'Ready' | 'Completed';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableNumber?: string;
  customerId?: string;
  customerName?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
}

export interface KitchenOrderTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  kotNumber: string;
  status: KOTStatus;
  priority: number;
  items: KOTItem[];
  sentAt: string;
  completedAt?: string;
}

export interface KOTItem {
  id: string;
  menuItemName: string;
  quantity: number;
  notes?: string;
  status: KOTStatus;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'online' | 'wallet';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'paid' | 'partially-paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  notes?: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  approvedBy?: string;
  processedAt?: string;
}

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

export interface SplitPaymentRequest {
  orderId: string;
  splits: {
    amount: number;
    paymentMethod: PaymentMethod;
    paidBy?: string;
  }[];
}

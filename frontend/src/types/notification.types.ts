export type NotificationType =
  | 'order-placed'
  | 'kot-created'
  | 'order-accepted'
  | 'order-rejected'
  | 'order-ready'
  | 'order-delivered'
  | 'low-stock'
  | 'staff-update'
  | 'payment-received'
  | 'new-reservation'
  | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

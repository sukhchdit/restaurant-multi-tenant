export interface Customer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  anniversary?: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  isVIP: boolean;
  notes?: string;
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  comment?: string;
  response?: string;
  createdAt: string;
}

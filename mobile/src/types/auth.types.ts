export type UserRole = 'super_admin' | 'restaurant_admin' | 'manager' | 'cashier' | 'kitchen' | 'waiter' | 'delivery' | 'customer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  roles: UserRole[];
  tenantId: string;
  restaurantId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

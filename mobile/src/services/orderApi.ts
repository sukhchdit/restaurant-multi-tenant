import api from './axiosInstance';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { Order, KitchenOrderTicket } from '../types/order.types';

export const orderApi = {
  getOrders: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params }),
  getOrderById: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),
  createOrder: (data: any) => api.post<ApiResponse<Order>>('/orders', data),
  updateOrderStatus: (id: string, data: { status: string }) => api.put<ApiResponse<Order>>(`/orders/${id}/status`, data),
  getKOTs: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResponse<KitchenOrderTicket>>>('/kot', { params }),
  updateKOTStatus: (id: string, data: { status: string }) => api.put<ApiResponse<KitchenOrderTicket>>(`/kot/${id}/status`, data),
};

import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Order, CreateOrderRequest, KitchenOrderTicket } from '@/types/order.types';
import type { DashboardStats } from '@/types/report.types';

export const orderApi = {
  getOrders: async (params?: {
    status?: string;
    type?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const response = await axiosInstance.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.post('/orders', data);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (id: string, reason: string): Promise<ApiResponse<Order>> => {
    const response = await axiosInstance.patch(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  deleteOrder: async (id: string, reason: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/orders/${id}`, { data: { reason } });
    return response.data;
  },

  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axiosInstance.get('/orders/dashboard');
    return response.data;
  },

  // KOT endpoints
  getActiveKOTs: async (): Promise<ApiResponse<KitchenOrderTicket[]>> => {
    const response = await axiosInstance.get('/kot');
    return response.data;
  },

  acknowledgeKOT: async (id: string): Promise<ApiResponse<KitchenOrderTicket>> => {
    const response = await axiosInstance.patch(`/kot/${id}/acknowledge`);
    return response.data;
  },

  startPreparingKOT: async (id: string): Promise<ApiResponse<KitchenOrderTicket>> => {
    const response = await axiosInstance.patch(`/kot/${id}/start-preparing`);
    return response.data;
  },

  markKOTReady: async (id: string): Promise<ApiResponse<KitchenOrderTicket>> => {
    const response = await axiosInstance.patch(`/kot/${id}/mark-ready`);
    return response.data;
  },
};

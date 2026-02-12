import axiosInstance from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { RestaurantTable, CreateTableRequest, TableReservation } from '@/types/table.types';

export const tableApi = {
  getTables: async (params?: { status?: string }): Promise<ApiResponse<RestaurantTable[]>> => {
    const response = await axiosInstance.get('/tables', { params });
    return response.data;
  },

  getTableById: async (id: string): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.get(`/tables/${id}`);
    return response.data;
  },

  createTable: async (data: CreateTableRequest): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.post('/tables', data);
    return response.data;
  },

  updateTable: async (id: string, data: Partial<RestaurantTable>): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.put(`/tables/${id}`, data);
    return response.data;
  },

  updateTableStatus: async (id: string, status: string): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.patch(`/tables/${id}/status`, { status });
    return response.data;
  },

  assignTable: async (id: string, orderId: string): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.post(`/tables/${id}/assign`, { orderId });
    return response.data;
  },

  freeTable: async (id: string): Promise<ApiResponse<RestaurantTable>> => {
    const response = await axiosInstance.post(`/tables/${id}/free`);
    return response.data;
  },

  getQRCode: async (id: string): Promise<ApiResponse<{ qrCodeUrl: string }>> => {
    const response = await axiosInstance.get(`/tables/${id}/qr-code`);
    return response.data;
  },

  getReservations: async (params?: { date?: string }): Promise<ApiResponse<TableReservation[]>> => {
    const response = await axiosInstance.get('/tables/reservations', { params });
    return response.data;
  },

  createReservation: async (data: Omit<TableReservation, 'id' | 'status'>): Promise<ApiResponse<TableReservation>> => {
    const response = await axiosInstance.post('/tables/reservations', data);
    return response.data;
  },
};

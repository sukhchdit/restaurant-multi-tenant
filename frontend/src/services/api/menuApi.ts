import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { MenuItem, Category, CreateMenuItemRequest, UpdateMenuItemRequest } from '@/types/menu.types';

export const menuApi = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await axiosInstance.get('/menu/categories');
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string; sortOrder?: number }): Promise<ApiResponse<Category>> => {
    const response = await axiosInstance.post('/menu/categories', data);
    return response.data;
  },

  getItems: async (params?: {
    category?: string;
    search?: string;
    isVeg?: boolean;
    isAvailable?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<MenuItem>> => {
    const response = await axiosInstance.get('/menu/items', { params });
    return response.data;
  },

  getItemById: async (id: string): Promise<ApiResponse<MenuItem>> => {
    const response = await axiosInstance.get(`/menu/items/${id}`);
    return response.data;
  },

  createItem: async (data: CreateMenuItemRequest): Promise<ApiResponse<MenuItem>> => {
    const response = await axiosInstance.post('/menu/items', data);
    return response.data;
  },

  updateItem: async (id: string, data: UpdateMenuItemRequest): Promise<ApiResponse<MenuItem>> => {
    const response = await axiosInstance.put(`/menu/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/menu/items/${id}`);
    return response.data;
  },

  toggleAvailability: async (id: string): Promise<ApiResponse<MenuItem>> => {
    const response = await axiosInstance.patch(`/menu/items/${id}/availability`);
    return response.data;
  },

  uploadImage: async (id: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(`/menu/items/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPublicMenu: async (restaurantId: string): Promise<ApiResponse<MenuItem[]>> => {
    const response = await axiosInstance.get(`/menu/public/${restaurantId}`);
    return response.data;
  },
};

import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { InventoryItem, StockMovement, Supplier, DishIngredient } from '@/types/inventory.types';

export const inventoryApi = {
  getItems: async (params?: {
    category?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await axiosInstance.get('/inventory', { params });
    return response.data;
  },

  getItemById: async (id: string): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.get(`/inventory/${id}`);
    return response.data;
  },

  createItem: async (data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.post('/inventory', data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.put(`/inventory/${id}`, data);
    return response.data;
  },

  restock: async (id: string, data: { quantity: number; costPerUnit: number; notes?: string }): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.post(`/inventory/${id}/restock`, data);
    return response.data;
  },

  getMovements: async (id: string): Promise<ApiResponse<StockMovement[]>> => {
    const response = await axiosInstance.get(`/inventory/${id}/movements`);
    return response.data;
  },

  getLowStock: async (): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await axiosInstance.get('/inventory/low-stock');
    return response.data;
  },

  getSuppliers: async (): Promise<ApiResponse<Supplier[]>> => {
    const response = await axiosInstance.get('/inventory/suppliers');
    return response.data;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await axiosInstance.post('/inventory/suppliers', data);
    return response.data;
  },

  getRecipe: async (menuItemId: string): Promise<ApiResponse<DishIngredient[]>> => {
    const response = await axiosInstance.get(`/menu/items/${menuItemId}/recipe`);
    return response.data;
  },

  setRecipe: async (menuItemId: string, ingredients: Omit<DishIngredient, 'id' | 'inventoryItemName'>[]): Promise<ApiResponse<DishIngredient[]>> => {
    const response = await axiosInstance.post(`/menu/items/${menuItemId}/recipe`, { ingredients });
    return response.data;
  },
};

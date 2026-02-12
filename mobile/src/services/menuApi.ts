import api from './axiosInstance';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { MenuItem, Category } from '../types/menu.types';

export const menuApi = {
  getCategories: () => api.get<ApiResponse<Category[]>>('/menu/categories'),
  getItems: (params?: Record<string, any>) => api.get<ApiResponse<PaginatedResponse<MenuItem>>>('/menu/items', { params }),
  getPublicMenu: (restaurantId: string) => api.get<ApiResponse<Category[]>>(`/menu/public/${restaurantId}`),
};

import axiosInstance from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    isRead?: boolean;
  }): Promise<PaginatedResponse<NotificationDto>> => {
    const response = await axiosInstance.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/notifications/${id}`);
    return response.data;
  },
};

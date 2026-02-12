import axiosInstance from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { Staff, Attendance, CreateStaffRequest } from '@/types/staff.types';

export const staffApi = {
  getStaff: async (params?: {
    shift?: string;
    status?: string;
    role?: string;
  }): Promise<ApiResponse<Staff[]>> => {
    const response = await axiosInstance.get('/staff', { params });
    return response.data;
  },

  getStaffById: async (id: string): Promise<ApiResponse<Staff>> => {
    const response = await axiosInstance.get(`/staff/${id}`);
    return response.data;
  },

  createStaff: async (data: CreateStaffRequest): Promise<ApiResponse<Staff>> => {
    const response = await axiosInstance.post('/staff', data);
    return response.data;
  },

  updateStaff: async (id: string, data: Partial<Staff>): Promise<ApiResponse<Staff>> => {
    const response = await axiosInstance.put(`/staff/${id}`, data);
    return response.data;
  },

  deleteStaff: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/staff/${id}`);
    return response.data;
  },

  getAttendance: async (staffId: string, params?: { month?: string }): Promise<ApiResponse<Attendance[]>> => {
    const response = await axiosInstance.get(`/staff/${staffId}/attendance`, { params });
    return response.data;
  },

  checkIn: async (staffId: string): Promise<ApiResponse<Attendance>> => {
    const response = await axiosInstance.post(`/staff/${staffId}/attendance/check-in`);
    return response.data;
  },

  checkOut: async (staffId: string): Promise<ApiResponse<Attendance>> => {
    const response = await axiosInstance.post(`/staff/${staffId}/attendance/check-out`);
    return response.data;
  },
};

import axiosInstance from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { SalesReport, CategoryDistribution, TopMenuItem, RevenueChart } from '@/types/report.types';

export const reportApi = {
  getSalesReport: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<SalesReport>> => {
    const response = await axiosInstance.get('/reports/sales', { params });
    return response.data;
  },

  getRevenueTrend: async (params?: {
    months?: number;
  }): Promise<ApiResponse<RevenueChart[]>> => {
    const response = await axiosInstance.get('/reports/revenue-trend', { params });
    return response.data;
  },

  getCategoryDistribution: async (): Promise<ApiResponse<CategoryDistribution[]>> => {
    const response = await axiosInstance.get('/reports/category-distribution');
    return response.data;
  },

  getTopItems: async (params?: { limit?: number }): Promise<ApiResponse<TopMenuItem[]>> => {
    const response = await axiosInstance.get('/reports/top-items', { params });
    return response.data;
  },

  exportPdf: async (params?: { type?: string; dateFrom?: string; dateTo?: string }): Promise<Blob> => {
    const response = await axiosInstance.get('/reports/export/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (params?: { type?: string; dateFrom?: string; dateTo?: string }): Promise<Blob> => {
    const response = await axiosInstance.get('/reports/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

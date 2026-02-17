import axiosInstance from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { SalesReport, CategoryDistribution, TopMenuItem, RevenueChart } from '@/types/report.types';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export const reportApi = {
  getSalesReport: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
  } & DateRangeParams): Promise<ApiResponse<SalesReport>> => {
    const response = await axiosInstance.get('/reports/sales', {
      params: {
        period: params?.period,
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    });
    return response.data;
  },

  getRevenueTrend: async (params?: {
    months?: number;
  } & DateRangeParams): Promise<ApiResponse<RevenueChart[]>> => {
    const response = await axiosInstance.get('/reports/revenue-trend', {
      params: {
        months: params?.months,
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    });
    return response.data;
  },

  getCategoryDistribution: async (params?: DateRangeParams): Promise<ApiResponse<CategoryDistribution[]>> => {
    const response = await axiosInstance.get('/reports/category-distribution', {
      params: {
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    });
    return response.data;
  },

  getTopItems: async (params?: { limit?: number } & DateRangeParams): Promise<ApiResponse<TopMenuItem[]>> => {
    const response = await axiosInstance.get('/reports/top-items', {
      params: {
        count: params?.limit,
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    });
    return response.data;
  },

  exportPdf: async (params?: { type?: string } & DateRangeParams): Promise<Blob> => {
    const response = await axiosInstance.get('/reports/export/pdf', {
      params: {
        type: params?.type,
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (params?: { type?: string } & DateRangeParams): Promise<Blob> => {
    const response = await axiosInstance.get('/reports/export/excel', {
      params: {
        type: params?.type,
        startDate: params?.startDate,
        endDate: params?.endDate,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};

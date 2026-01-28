import apiClient from '@/utils/axios';
import { DashboardStats, ComprehensiveStats, ApiResponse } from '@/types';

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  getComprehensiveStats: async (params: {
    orderType?: 'all' | 'bip_orders' | 'bank_orders';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ComprehensiveStats>> => {
    const queryParams = new URLSearchParams();

    if (params.orderType && params.orderType !== 'all') {
      queryParams.append('orderType', params.orderType);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const url = `/dashboard/comprehensive-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<ComprehensiveStats>>(url);
    return response.data;
  },
};

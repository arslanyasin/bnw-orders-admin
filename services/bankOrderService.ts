import apiClient from '@/utils/axios';
import {
  BankOrder,
  CreateBankOrderDto,
  UpdateBankOrderDto,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const bankOrderService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchField?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
  }): Promise<PaginatedResponse<BankOrder>> => {
    const response = await apiClient.get<PaginatedResponse<BankOrder>>('/bank-orders', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<BankOrder>> => {
    const response = await apiClient.get<ApiResponse<BankOrder>>(`/bank-orders/${id}`);
    return response.data;
  },

  create: async (data: CreateBankOrderDto): Promise<ApiResponse<BankOrder>> => {
    const response = await apiClient.post<ApiResponse<BankOrder>>('/bank-orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBankOrderDto): Promise<ApiResponse<BankOrder>> => {
    const response = await apiClient.patch<ApiResponse<BankOrder>>(`/bank-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/bank-orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<BankOrder>> => {
    const response = await apiClient.patch<ApiResponse<BankOrder>>(`/bank-orders/${id}/status`, { status });
    return response.data;
  },

  import: async (bankId: string, file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse>(
      `/bank-orders/import?bankId=${bankId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

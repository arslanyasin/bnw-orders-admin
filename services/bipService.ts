import apiClient from '@/utils/axios';
import {
  BipOrder,
  CreateBipOrderDto,
  UpdateBipOrderDto,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const bipService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchField?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<BipOrder>> => {
    const response = await apiClient.get<PaginatedResponse<BipOrder>>('/bip', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<BipOrder>> => {
    const response = await apiClient.get<ApiResponse<BipOrder>>(`/bip/${id}`);
    return response.data;
  },

  create: async (data: CreateBipOrderDto): Promise<ApiResponse<BipOrder>> => {
    const response = await apiClient.post<ApiResponse<BipOrder>>('/bip', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBipOrderDto): Promise<ApiResponse<BipOrder>> => {
    const response = await apiClient.patch<ApiResponse<BipOrder>>(`/bip/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/bip/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<BipOrder>> => {
    const response = await apiClient.patch<ApiResponse<BipOrder>>(`/bip/${id}/status`, { status });
    return response.data;
  },

  import: async (bankId: string, file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse>(
      `/bip/import?bankId=${bankId}`,
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

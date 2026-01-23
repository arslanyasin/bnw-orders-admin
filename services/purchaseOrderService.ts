import apiClient from '@/utils/axios';
import {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CombinedPOPreview,
  CombinePODto,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const purchaseOrderService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderDto): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdatePurchaseOrderDto
  ): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await apiClient.put<ApiResponse<PurchaseOrder>>(
      `/purchase-orders/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/purchase-orders/${id}`);
    return response.data;
  },

  previewCombined: async (data: CombinePODto): Promise<ApiResponse<CombinedPOPreview>> => {
    const response = await apiClient.post<ApiResponse<CombinedPOPreview>>(
      '/purchase-orders/combine/preview',
      data
    );
    return response.data;
  },

  mergePOs: async (data: CombinePODto): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(
      '/purchase-orders/merge',
      data
    );
    return response.data;
  },

  getCombinableList: async (params: {
    vendorId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PurchaseOrder[]>> => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      '/purchase-orders/combinable/list',
      { params }
    );
    return response.data;
  },

  bulkUpdate: async (data: {
    updates: Array<{
      poId: string;
      products: Array<{
        productId: string;
        serialNumber: string;
      }>;
    }>;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      '/purchase-orders/bulk-update',
      data
    );
    return response.data;
  },

  cancel: async (id: string, reason: string): Promise<ApiResponse<PurchaseOrder>> => {
    const encodedReason = encodeURIComponent(reason);
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(
      `/purchase-orders/${id}/cancel?reason=${encodedReason}`
    );
    return response.data;
  },

  bulkCreate: async (data: {
    vendorId: string;
    unitPrice: number;
    bankOrderIds?: string[];
    bipOrderIds?: string[];
  }): Promise<ApiResponse<PurchaseOrder[]>> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder[]>>(
      '/purchase-orders/bulk-create',
      data
    );
    return response.data;
  },

  exportReport: async (
    bankId: string,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    const response = await apiClient.get('/purchase-orders/export', {
      params: { bankId, startDate, endDate },
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().getTime();
    link.download = `purchase-orders-${bankId}-${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

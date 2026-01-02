import apiClient from '@/utils/axios';
import { ApiResponse, DeliveryChallan } from '@/types';

export interface CreateDeliveryDto {
  bankOrderId?: string;
  bipOrderId?: string;
  courierCompany: string;
  trackingNumber: string;
  dispatchDate: string;
}

export interface Delivery {
  _id: string;
  bankOrderId?: string;
  bipOrderId?: string;
  courierCompany: string;
  trackingNumber: string;
  dispatchDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkDownloadDto {
  challanIds?: string[];
  bankOrderIds?: string[];
  bipOrderIds?: string[];
}

export const deliveryService = {
  create: async (data: CreateDeliveryDto): Promise<ApiResponse<Delivery>> => {
    const response = await apiClient.post<ApiResponse<Delivery>>('/deliveries', data);
    return response.data;
  },

  bulkDownload: async (data: BulkDownloadDto): Promise<Blob> => {
    const response = await apiClient.post('/delivery-challans/bulk-download', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchField?: string;
  }): Promise<ApiResponse<DeliveryChallan[]>> => {
    const response = await apiClient.get<ApiResponse<DeliveryChallan[]>>('/delivery-challans', { params });
    return response.data;
  },
};

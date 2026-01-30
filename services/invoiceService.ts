import apiClient from '@/utils/axios';

export interface GenerateInvoiceRequest {
  bankId: string;
  startDate: string;
  endDate: string;
  orderType: 'bank_orders' | 'bip_orders';
}

export const invoiceService = {
  generateInvoice: async (data: GenerateInvoiceRequest): Promise<Blob> => {
    const response = await apiClient.post('/invoices/generate', data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

import apiClient from '@/utils/axios';

export interface WhatsAppAction {
  action: 'set_field_value' | 'send_flow';
  field_name?: string;
  value?: string | number;
  flow_id?: number;
}

export interface SendWhatsAppDto {
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  actions: WhatsAppAction[];
}

export interface SendOrderConfirmationDto {
  phone: string;
  customerName: string;
  orderNumber: string;
  orderPrice?: string;
  rewardPoints?: string;
  product: string;
  address: string;
  flowId?: number;
}

const WHATSAPP_FLOW_ID = 1767708715182;
const WHATSAPP_FLOW_ID_BANK = 1769182700466;

export const whatsappService = {
  sendOrderConfirmation: async (data: SendOrderConfirmationDto): Promise<void> => {
    console.log('SendOrderConfirmation', data);

    // Use custom flow ID if provided, otherwise use default
    const flowId = data.flowId || WHATSAPP_FLOW_ID;

    // Use rewardPoints if provided, otherwise use orderPrice
    const amountValue = data.rewardPoints || data.orderPrice || '';

    const requestBody: SendWhatsAppDto = {
      phone: data.phone,
      email: '',
      first_name: data.customerName,
      last_name: '',
      actions: [
        {
          action: 'set_field_value',
          field_name: 'order_main_id',
          value: data.orderNumber,
        },
        {
          action: 'set_field_value',
          field_name: 'full_name',
          value: data.customerName,
        },
        {
          action: 'set_field_value',
          field_name: 'order items',
          value: data.product,
        },
        {
          action: 'set_field_value',
          field_name: 'order total amount',
          value: amountValue,
        },
        {
          action: 'set_field_value',
          field_name: 'order delivery address',
          value: data.address,
        },
        {
          action: 'send_flow',
          flow_id: flowId,
        },
      ],
    };

    await apiClient.post('/whatsapp/send-message', requestBody);
  },

  sendBulkOrderConfirmations: async (
    orders: Array<{
      phone: string;
      customerName: string;
      orderNumber: string;
      orderPrice?: string;
      rewardPoints?: string;
      product: string;
      address: string;
      flowId?: number;
    }>
  ): Promise<{ success: number; failed: number; errors: Array<{ orderNumber: string; error: string }> }> => {
    let success = 0;
    let failed = 0;
    const errors: Array<{ orderNumber: string; error: string }> = [];

    for (const order of orders) {
      try {
        await whatsappService.sendOrderConfirmation(order);
        success++;
      } catch (error: any) {
        failed++;
        errors.push({
          orderNumber: order.orderNumber,
          error: error.message || 'Unknown error',
        });
      }
    }

    return { success, failed, errors };
  },
};

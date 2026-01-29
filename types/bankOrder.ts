export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  _id: string;
  id: string;
}

export interface BankOrder {
  _id: string;
  cnic: string;
  customerName: string;
  mobile1: string;
  mobile2: string;
  address: string;
  city: string;
  brand: string;
  product: string;
  giftCode: string;
  productId: string;
  qty: number;
  refNo: string;
  poNumber: string;
  orderDate: string;
  redeemedPoints: number;
  color?: string;
  status: OrderStatus;
  statusHistory?: StatusHistoryEntry[];
  shipmentId?: {
    _id: string;
    courierId?: {
      _id: string;
      courierName: string;
      courierType: 'tcs' | 'leopards';
    };
    trackingNumber: string;
    consignmentNumber: string;
    status: 'booked' | 'in_transit' | 'delivered' | 'cancelled';
    bookingDate?: string;
  };
  deliveryChallan?: {
    _id: string;
    challanNumber: string;
    bankOrderId: string;
    customerName: string;
    trackingNumber: string;
    challanDate: string;
    pdfFilePath: string;
    pdfURLPath: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateBankOrderDto {
  cnic: string;
  customerName: string;
  mobile1: string;
  mobile2?: string;
  address: string;
  city: string;
  brand: string;
  product: string;
  giftCode: string;
  productId: string;
  qty: number;
  refNo: string;
  poNumber: string;
  orderDate: string;
  redeemedPoints: number;
}

export interface UpdateBankOrderDto extends Partial<CreateBankOrderDto> {
  status?: OrderStatus;
  isDeleted?: boolean;
}

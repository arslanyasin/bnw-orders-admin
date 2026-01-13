export interface Courier {
  _id: string;
  courierName: string;
  courierType: 'tcs' | 'leopards';
  isActive: boolean;
  isManualDispatch?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DispatchOrderRequest {
  courierType: 'tcs' | 'leopards';
  declaredValue?: number;
  productDescription?: string;
  remarks?: string;
  isManualDispatch?: boolean;
  trackingNumber?: string;
  consignmentNumber?: string;
}

export interface Shipment {
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
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
}

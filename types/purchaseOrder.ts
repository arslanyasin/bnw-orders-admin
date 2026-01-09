import { Product } from './product';
import { Vendor } from './vendor';
import { BankOrder } from './bankOrder';
import { BipOrder } from './bip';

export interface PurchaseOrderProduct {
  productId: string | Product;
  quantity: number;
  productName: string;
  bankProductNumber: string;
  unitPrice: number;
  serialNumber?: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber?: string;
  bipOrderId?: string | BipOrder;
  bankOrderId?: string | BankOrder;
  vendorId: string | Vendor;
  products: PurchaseOrderProduct[];
  totalAmount?: number;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'cancelled' | 'merged';
  notes?: string;
  cancellationReason?: string;
  isMerged?: boolean;
  originalPOIds?: string[];
  mergedPOId?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CreatePurchaseOrderDto {
  bipOrderId?: string;
  bankOrderId?: string;
  vendorId: string;
  products: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> {
  status?: 'draft' | 'pending' | 'approved' | 'delivered' | 'cancelled' | 'merged';
  isDeleted?: boolean;
}

export interface CombinedPOPreview {
  poNumbers: string[];
  vendor: {
    vendorName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  products: {
    name: string;
    productName?: string; // For backwards compatibility
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sourcePO: string;
    bankProductNumber?: string;
  }[];
  totalAmount: number;
  originalPOsCount: number;
  combinedDate: string;
}

export interface CombinePODto {
  poIds: string[];
}

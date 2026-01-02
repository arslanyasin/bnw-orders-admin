export interface DeliveryChallan {
  _id: string;
  challanNumber: string;
  bankOrderId?: string;
  bipOrderId?: string;
  shipmentId?: string;
  customerName: string;
  customerCnic: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  productName: string;
  productBrand: string;
  productSerialNumber?: string;
  quantity: number;
  trackingNumber: string;
  consignmentNumber: string;
  courierName: string;
  challanDate: string;
  dispatchDate: string;
  expectedDeliveryDate?: string;
  remarks?: string;
  pdfFilePath: string;
  pdfURLPath?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

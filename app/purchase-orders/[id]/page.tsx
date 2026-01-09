'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Button, Loader, Badge } from '@/components';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { PurchaseOrder, Vendor, Product } from '@/types';
import { ArrowLeft, Printer, Info, AlertCircle } from 'lucide-react';

const PurchaseOrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      setIsLoading(true);
      const response = await purchaseOrderService.getById(id);
      setPurchaseOrder(response.data || null);
    } catch (error: any) {
      console.error('Failed to fetch purchase order:', error);
      alert('Failed to load purchase order details');
      router.push('/purchase-orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getVendorName = (po: PurchaseOrder): string => {
    if (typeof po.vendorId === 'object' && po.vendorId !== null) {
      return (po.vendorId as Vendor).vendorName;
    }
    return '-';
  };

  const getVendorDetails = (po: PurchaseOrder): Vendor | null => {
    if (typeof po.vendorId === 'object' && po.vendorId !== null) {
      return po.vendorId as Vendor;
    }
    return null;
  };

  const getProductDetails = (productId: string | Product): { name: string; giftCode: string } => {
    if (typeof productId === 'object' && productId !== null) {
      console.log('Product ID',productId);
      const product = productId as Product;
      return {
        name: product.name,
        giftCode: product.bankProductNumber || '-'
      };
    }
    return { name: '-', giftCode: '-' };
  };

  const calculateTotal = (po: PurchaseOrder): number => {
    return po.products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitPrice);
    }, 0);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'approved':
        return 'info';
      case 'pending':
        return 'warning';
      case 'merged':
        return 'info';
      case 'draft':
      case 'cancelled':
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" text="Loading purchase order details..." />
        </div>
      </AdminLayout>
    );
  }

  if (!purchaseOrder) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Purchase order not found</p>
        </div>
      </AdminLayout>
    );
  }

  const vendor = getVendorDetails(purchaseOrder);
  const totalAmount = purchaseOrder.totalAmount || calculateTotal(purchaseOrder);

  // Render Purchase Order Content
  const renderPOContent = () => (
    <div className="p-12">
      {/* Header with BNW Branding */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">BNW Collections</h1>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {purchaseOrder.isMerged ? 'MERGED PURCHASE ORDER' : 'PURCHASE ORDER'}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">PO#:</span>{' '}
              <span className="font-mono text-xs">{purchaseOrder.poNumber}</span>
            </p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              {new Date(purchaseOrder.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Merged PO Info Banner */}
      {purchaseOrder.isMerged && purchaseOrder.originalPOIds && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              This is a merged purchase order combining {purchaseOrder.originalPOIds.length} original PO{purchaseOrder.originalPOIds.length !== 1 ? 's' : ''}
            </p>
            <p className="text-blue-600">
              Original POs: {purchaseOrder.originalPOIds.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Cancellation Reason Banner */}
      {purchaseOrder.status === 'cancelled' && purchaseOrder.cancellationReason && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">This purchase order has been cancelled</p>
            <p className="text-red-600">
              <span className="font-medium">Reason:</span> {purchaseOrder.cancellationReason}
            </p>
          </div>
        </div>
      )}

      {/* Vendor Information */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Vendor Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xl font-bold text-gray-900 mb-2">{getVendorName(purchaseOrder)}</p>
          {vendor && (
            <div className="text-sm text-gray-600 space-y-1">
              {vendor.contactPerson && (
                <p>
                  <span className="font-medium">Contact:</span> {vendor.contactPerson}
                </p>
              )}
              {vendor.email && (
                <p>
                  <span className="font-medium">Email:</span> {vendor.email}
                </p>
              )}
              {vendor.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {vendor.phone}
                </p>
              )}
              {vendor.address && (
                <p>
                  <span className="font-medium">Address:</span> {vendor.address}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">#</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Product Name</th>
                {purchaseOrder.isMerged && (
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Source PO</th>
                )}
                <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.products.map((product, index) => {
                const itemTotal = product.quantity * product.unitPrice;
                console.log(product)
                const productDetails = getProductDetails(product.productId);
                return (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Gift Code: <span className="font-mono font-semibold">{product.bankProductNumber}</span>
                        </div>
                      </div>
                    </td>
                    {purchaseOrder.isMerged && (
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                          {(product as any).sourcePO || '-'}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {product.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {formatAmount(product.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                      {formatAmount(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={purchaseOrder.isMerged ? 5 : 4} className="py-4 px-4 text-right">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-xl font-bold text-blue-600">
                    {formatAmount(totalAmount)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      {purchaseOrder.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
          </div>
        </div>
      )}

      {/* Footer with BNW Branding */}
      <div className="mt-12 pt-6 border-t-2 border-gray-200">
        <div className="text-center text-sm text-gray-600">
          <p className="font-bold text-blue-600 mb-1">BNW Collections</p>
          <p className="text-xs text-gray-500">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Screen View with AdminLayout */}
      <div className="print:hidden">
        <AdminLayout>
          {/* Action Buttons */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/purchase-orders')}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Purchase Orders
              </Button>
              <Button
                variant="primary"
                onClick={handlePrint}
              >
                <Printer size={20} className="mr-2" />
                Print Purchase Order
              </Button>
            </div>
          </div>

          {/* PO Display with Status Badge */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-8">
              {/* Status Badge - Only in Screen View */}
              <div className="mb-6 flex justify-end">
                <Badge variant={getStatusBadgeVariant(purchaseOrder.status)}>
                  {purchaseOrder.status?.toUpperCase()}
                </Badge>
              </div>
              {renderPOContent()}
            </div>
          </div>
        </AdminLayout>
      </div>

      {/* Print-Only View (Without AdminLayout) */}
      <div className="hidden print:block">
        {renderPOContent()}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          @page {
            margin: 1cm;
            size: A4;
          }

          table {
            page-break-inside: avoid;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
};

export default PurchaseOrderDetailPage;

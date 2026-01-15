'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import SearchableSelect from './SearchableSelect';
import { PurchaseOrder, Vendor, Product, BankOrder, BipOrder } from '@/types';
import { vendorService } from '@/services/vendorService';
import { productService } from '@/services/productService';
import { bankOrderService } from '@/services/bankOrderService';
import { bipService } from '@/services/bipService';
import { Trash2, Plus } from 'lucide-react';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  purchaseOrder?: PurchaseOrder | null;
  isLoading?: boolean;
  // For creating PO from Bank/BIP orders
  initialOrderType?: 'bank' | 'bip' | null;
  initialOrderId?: string | null;
  initialProductName?: string | null;
  initialQuantity?: number | null;
  initialGiftCode?: string | null;
}

interface ProductItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  isLoading = false,
  initialOrderType = null,
  initialOrderId = null,
  initialProductName = null,
  initialQuantity = null,
  initialGiftCode = null,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bankOrders, setBankOrders] = useState<BankOrder[]>([]);
  const [bipOrders, setBipOrders] = useState<BipOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    vendorId: '',
    orderType: 'none' as 'none' | 'bank' | 'bip',
    bankOrderId: '',
    bipOrderId: '',
    notes: '',
  });

  const [productItems, setProductItems] = useState<ProductItem[]>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (purchaseOrder) {
      const vendorId = typeof purchaseOrder.vendorId === 'object'
        ? purchaseOrder.vendorId._id
        : purchaseOrder.vendorId;

      const bankOrderId = purchaseOrder.bankOrderId
        ? (typeof purchaseOrder.bankOrderId === 'object' ? purchaseOrder.bankOrderId._id : purchaseOrder.bankOrderId)
        : '';

      const bipOrderId = purchaseOrder.bipOrderId
        ? (typeof purchaseOrder.bipOrderId === 'object' ? purchaseOrder.bipOrderId._id : purchaseOrder.bipOrderId)
        : '';

      setFormData({
        vendorId,
        orderType: bankOrderId ? 'bank' : bipOrderId ? 'bip' : 'none',
        bankOrderId,
        bipOrderId,
        notes: purchaseOrder.notes || '',
      });

      setProductItems(purchaseOrder.products.map(p => ({
        productId: typeof p.productId === 'object' ? p.productId._id : p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })));
    }
  }, [purchaseOrder]);

  // Handle initial data from Bank/BIP orders
  useEffect(() => {
    if (isOpen && !purchaseOrder && initialOrderType && initialOrderId) {
      setFormData({
        vendorId: '',
        orderType: initialOrderType,
        bankOrderId: initialOrderType === 'bank' ? initialOrderId : '',
        bipOrderId: initialOrderType === 'bip' ? initialOrderId : '',
        notes: '',
      });

      if (initialQuantity) {
        setProductItems([{
          productId: '',
          quantity: initialQuantity,
          unitPrice: 0,
        }]);
      }
    }
  }, [isOpen, initialOrderType, initialOrderId, initialQuantity, purchaseOrder]);

  // Auto-select product based on giftCode when products are loaded
  useEffect(() => {
    if (isOpen && !purchaseOrder && initialGiftCode && products.length > 0 && productItems.length > 0) {
      const matchingProduct = products.find(p => p.bankProductNumber === initialGiftCode);
      if (matchingProduct && productItems[0].productId === '') {
        const newItems = [...productItems];
        newItems[0] = { ...newItems[0], productId: matchingProduct._id };
        setProductItems(newItems);
      }
    }
  }, [isOpen, initialGiftCode, products, purchaseOrder]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [vendorsRes, productsRes, bankOrdersRes, bipOrdersRes] = await Promise.all([
        vendorService.getAll({ limit: 100 }),
        productService.getAll({ limit: 1000 }),
        bankOrderService.getAll({ limit: 100 }),
        bipService.getAll({ limit: 100 }),
      ]);

      setVendors(vendorsRes.data || []);
      setProducts(productsRes.data || []);
      setBankOrders(bankOrdersRes.data || []);
      setBipOrders(bipOrdersRes.data || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddProduct = () => {
    setProductItems([...productItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProductItems(productItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    const newItems = [...productItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setProductItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId) {
      setError('Please select a vendor');
      return;
    }

    if (productItems.length === 0 || productItems.some(p => !p.productId || p.quantity <= 0 || p.unitPrice <= 0)) {
      setError('Please add at least one valid product with quantity and price');
      return;
    }

    const submitData: any = {
      vendorId: formData.vendorId,
      products: productItems,
      notes: formData.notes || undefined,
    };

    if (formData.orderType === 'bank' && formData.bankOrderId) {
      submitData.bankOrderId = formData.bankOrderId;
    } else if (formData.orderType === 'bip' && formData.bipOrderId) {
      submitData.bipOrderId = formData.bipOrderId;
    }

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      vendorId: '',
      orderType: 'none',
      bankOrderId: '',
      bipOrderId: '',
      notes: '',
    });
    setProductItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setError('');
    onClose();
  };

  const calculateTotal = () => {
    return productItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingData ? (
          <div className="py-8 text-center text-gray-500">Loading form data...</div>
        ) : (
          <>
            {/* Info Banner for Order Linking */}
            {!purchaseOrder && initialOrderType && initialOrderId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Creating PO from {initialOrderType === 'bank' ? 'Bank' : 'BIP'} Order</span>
                  {initialProductName && <span> - Product: {initialProductName}</span>}
                  {initialGiftCode && <span> - Gift Code: {initialGiftCode}</span>}
                  {initialQuantity && <span> - Qty: {initialQuantity}</span>}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {initialGiftCode ? 'Product auto-selected based on Gift Code. Please select vendor and enter price.' : 'Please select vendor, product and enter price.'}
                </p>
              </div>
            )}

            {/* Vendor Selection */}
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Vendor <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={vendors.map(vendor => ({
                  value: vendor._id,
                  label: vendor.vendorName
                }))}
                value={formData.vendorId}
                onChange={(value) => setFormData({ ...formData, vendorId: value })}
                placeholder="Select a vendor"
                searchPlaceholder="Search vendors..."
                disabled={isLoading}
                required
              />
            </div>

            {/* Order Type Selection */}
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Link to Order (Optional)
              </label>
              <select
                value={formData.orderType}
                onChange={(e) => {
                  const type = e.target.value as 'none' | 'bank' | 'bip';
                  setFormData({
                    ...formData,
                    orderType: type,
                    bankOrderId: '',
                    bipOrderId: '',
                  });
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                disabled={isLoading}
              >
                <option value="none">No linked order</option>
                <option value="bank">Bank Order</option>
                <option value="bip">BIP Order</option>
              </select>
            </div>

            {/* Bank Order Selection */}
            {formData.orderType === 'bank' && (
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Bank Order
                </label>
                <select
                  value={formData.bankOrderId}
                  onChange={(e) => setFormData({ ...formData, bankOrderId: e.target.value })}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  disabled={isLoading}
                >
                  <option value="">Select a bank order</option>
                  {bankOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      PO: {order.poNumber} - {order.customerName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* BIP Order Selection */}
            {formData.orderType === 'bip' && (
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  BIP Order
                </label>
                <select
                  value={formData.bipOrderId}
                  onChange={(e) => setFormData({ ...formData, bipOrderId: e.target.value })}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  disabled={isLoading}
                >
                  <option value="">Select a BIP order</option>
                  {bipOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      PO: {order.poNumber} - {order.customerName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Products Section */}
            <div className="w-full border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">
                  Products <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                  disabled={isLoading}
                >
                  <Plus size={16} className="mr-1" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {productItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="block mb-1 text-xs font-medium text-gray-700">Product</label>
                      <SearchableSelect
                        options={products.map(product => ({
                          value: product._id,
                          label: product.name
                        }))}
                        value={item.productId}
                        onChange={(value) => handleProductChange(index, 'productId', value)}
                        placeholder="Select product"
                        searchPlaceholder={
                          formData.orderType === 'bank'
                            ? 'Search by PO...'
                            : formData.orderType === 'bip'
                            ? 'Search by EFORMS...'
                            : 'Search products...'
                        }
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block mb-1 text-xs font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block mb-1 text-xs font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="col-span-1">
                      {productItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Add any additional notes..."
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                {purchaseOrder ? 'Update' : 'Create'} Purchase Order
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default PurchaseOrderFormModal;

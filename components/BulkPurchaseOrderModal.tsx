'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/components';
import { vendorService } from '@/services/vendorService';
import { Vendor } from '@/types';

interface BulkPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { vendorId: string; unitPrice: number }) => void;
  isLoading: boolean;
  orderCount: number;
  productName: string;
}

const BulkPurchaseOrderModal: React.FC<BulkPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  orderCount,
  productName,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true);
      const response = await vendorService.getAll({ limit: 100 });
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      alert('Please enter a valid unit price');
      return;
    }

    onSubmit({
      vendorId: selectedVendor,
      unitPrice: parseFloat(unitPrice),
    });
  };

  const handleClose = () => {
    setSelectedVendor('');
    setUnitPrice('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Bulk Purchase Orders">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Creating {orderCount} purchase orders</span> for:
            </p>
            <p className="text-sm text-blue-800 mt-1 font-medium">{productName}</p>
          </div>

          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor <span className="text-red-500">*</span>
            </label>
            {isLoadingVendors ? (
              <div className="text-sm text-gray-500">Loading vendors...</div>
            ) : (
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Price (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Enter unit price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              This price will be applied to all {orderCount} purchase orders
            </p>
          </div>

          {/* Summary */}
          {unitPrice && parseFloat(unitPrice) > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Number of Orders:</span>
                  <span className="font-medium text-gray-900">{orderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="font-medium text-gray-900">
                    PKR {parseFloat(unitPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-medium">Total Value:</span>
                  <span className="font-bold text-gray-900">
                    PKR {(parseFloat(unitPrice) * orderCount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Create {orderCount} Purchase Orders
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BulkPurchaseOrderModal;

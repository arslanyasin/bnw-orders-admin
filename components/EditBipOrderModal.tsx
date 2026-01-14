'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/components';
import { BipOrder } from '@/types';

interface EditBipOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { address: string; city: string; mobile1: string; color: string }) => void;
  isLoading: boolean;
  order: BipOrder | null;
}

const EditBipOrderModal: React.FC<EditBipOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  order,
}) => {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    mobile1: '',
    color: '',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        address: order.address || '',
        city: order.city || '',
        mobile1: order.mobile1 || '',
        color: order.color || '',
      });
    }
  }, [order]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      alert('Address is required');
      return;
    }

    if (!formData.city.trim()) {
      alert('City is required');
      return;
    }

    if (!formData.mobile1.trim()) {
      alert('Mobile number is required');
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      address: '',
      city: '',
      mobile1: '',
      color: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit BIP Order">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Order Info */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">PO Number:</span> {order.poNumber}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Customer:</span> {order.customerName}
              </p>
            </div>
          )}

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.mobile1}
              onChange={(e) => setFormData({ ...formData, mobile1: e.target.value })}
              placeholder="Enter mobile number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Enter color"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Update Order
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditBipOrderModal;

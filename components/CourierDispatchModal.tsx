'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import { Courier, DispatchOrderRequest } from '@/types';
import { courierService } from '@/services/courierService';
import Button from './Button';

interface CourierDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (data: DispatchOrderRequest) => Promise<void>;
  orderType: 'bank' | 'bip';
  defaultDeclaredValue?: number;
  defaultProductDescription?: string;
  isLoading?: boolean;
}

const CourierDispatchModal: React.FC<CourierDispatchModalProps> = ({
  isOpen,
  onClose,
  onDispatch,
  orderType,
  defaultDeclaredValue = 0,
  defaultProductDescription = '',
  isLoading = false,
}) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(true);
  const [isManualDispatch, setIsManualDispatch] = useState(true);
  const [selectedCourier, setSelectedCourier] = useState<'tcs' | 'leopards' | ''>('');
  const [declaredValue, setDeclaredValue] = useState<string>(defaultDeclaredValue.toString());
  const [productDescription, setProductDescription] = useState<string>(defaultProductDescription);
  const [remarks, setRemarks] = useState<string>('Please handle with care and call the customer before delivery.');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [consignmentNumber, setConsignmentNumber] = useState<string>('');
  const [error, setError] = useState('');

  // Derive isManualDispatch from selected courier
  const selectedCourierObj = couriers.find(c => c.courierType === selectedCourier);

  useEffect(() => {
    if (isOpen) {
      fetchCouriers();
      setDeclaredValue(defaultDeclaredValue.toString());
      setProductDescription(defaultProductDescription);
    }
  }, [isOpen, defaultDeclaredValue, defaultProductDescription]);
  useEffect(() => {
    console.log(selectedCourierObj)
     setIsManualDispatch(selectedCourierObj?.isManualDispatch || false);
  }, [selectedCourier]);

  const fetchCouriers = async () => {
    try {
      setLoadingCouriers(true);
      const response = await courierService.getActiveCouriers();
      setCouriers(response.data || []);

      // Auto-select first courier if available
      if (response.data && response.data.length > 0) {
        setSelectedCourier(response.data[0].courierType);
      }
    } catch (error: any) {
      console.error('Failed to fetch couriers:', error);
      setError('Failed to load couriers');
    } finally {
      setLoadingCouriers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourier) {
      setError('Please select a courier');
      return;
    }

    // Validate manual dispatch fields
    if (isManualDispatch) {
      if (!trackingNumber.trim()) {
        setError('Please enter tracking number');
        return;
      }
      if (!consignmentNumber.trim()) {
        setError('Please enter consignment number');
        return;
      }
    }

    const dispatchData: DispatchOrderRequest = {
      courierType: selectedCourier,
    };

    // Add manual dispatch fields if manual mode
    if (isManualDispatch) {
      dispatchData.isManualDispatch = isManualDispatch;
      dispatchData.trackingNumber = trackingNumber.trim();
      dispatchData.consignmentNumber = consignmentNumber.trim();
    }

    // Add optional fields if provided
    const parsedValue = parseFloat(declaredValue);
    if (declaredValue && !isNaN(parsedValue) && parsedValue > 0) {
      dispatchData.declaredValue = parsedValue;
    }

    if (productDescription.trim()) {
      dispatchData.productDescription = productDescription.trim();
    }

    if (remarks.trim()) {
      if(isManualDispatch)
        dispatchData.remarks = remarks.trim();
      else
        dispatchData.specialInstructions = remarks.trim();
    }

    try {
      await onDispatch(dispatchData);
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Failed to dispatch order');
    }
  };

  const handleClose = () => {
    setSelectedCourier('');
    setDeclaredValue('0');
    setProductDescription('');
    setRemarks('');
    setTrackingNumber('');
    setConsignmentNumber('');
    setError('');
    onClose();
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Dispatch with Courier</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {orderType === 'bank' ? 'Bank Order' : 'BIP Order'} Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded-lg"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {loadingCouriers ? (
            <div className="py-8 text-center text-gray-500">Loading couriers...</div>
          ) : couriers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">No active couriers available</p>
              <p className="text-sm text-gray-500 mt-1">Please contact administrator</p>
            </div>
          ) : (
            <>
              {/* Courier Selection */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Select Courier <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {couriers.map((courier) => (
                    <label
                      key={courier._id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedCourier === courier.courierType
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="courier"
                        value={courier.courierType}
                        checked={selectedCourier === courier.courierType}
                        onChange={(e) => setSelectedCourier(e.target.value as 'tcs' | 'leopards')}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                        disabled={isLoading}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">{courier.courierName}</span>
                        <span className="text-xs text-gray-500 uppercase">{courier.courierType}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Manual Dispatch Fields */}
              {isManualDispatch && (
                <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="mb-3 pb-3 border-b border-blue-300">
                    <p className="text-sm font-semibold text-blue-900">Manual Dispatch Required</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      This courier requires manual entry of tracking details
                    </p>
                  </div>
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                      Tracking Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-3 transition-all duration-200 placeholder:text-gray-400"
                      disabled={isLoading}
                      required={isManualDispatch}
                    />
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                      Consignment Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={consignmentNumber}
                      onChange={(e) => setConsignmentNumber(e.target.value)}
                      placeholder="Enter consignment number"
                      className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-3 transition-all duration-200 placeholder:text-gray-400"
                      disabled={isLoading}
                      required={isManualDispatch}
                    />
                  </div>
                </div>
              )}

              {/* Declared Value */}
              <div className="hidden">
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  Declared Value (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={10}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="Enter declared value"
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 block w-full px-4 py-3 transition-all duration-200 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Pre-filled from order amount. Adjust if needed.
                </p>
              </div>

              {/* Product Description */}
              <div>
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  Product Description (Optional)
                </label>
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g., Samsung Galaxy S24"
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 block w-full px-4 py-3 transition-all duration-200 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Pre-filled from order product name.
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="e.g., Handle with care, Fragile, Call before delivery"
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 block w-full px-4 py-3 transition-all duration-200 placeholder:text-gray-400 resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  isLoading={isLoading}
                  disabled={!selectedCourier || loadingCouriers}
                >
                  <Truck size={20} className="mr-2" />
                  Dispatch Order
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CourierDispatchModal;

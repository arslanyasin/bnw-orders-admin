'use client';

import React, { useState, useEffect } from 'react';
import { X, FileDown } from 'lucide-react';
import Button from './Button';
import { Bank } from '@/types';
import { bankService } from '@/services/bankService';
import { invoiceService } from '@/services/invoiceService';

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType: 'bank_orders' | 'bip_orders';
}

const InvoiceGenerationModal: React.FC<InvoiceGenerationModalProps> = ({
  isOpen,
  onClose,
  orderType,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
      setError('');
    }
  }, [isOpen]);

  const fetchBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const response = await bankService.getAll({ limit: 1000 });
      setBanks(response.data || []);

      // Auto-select first bank if available
      if (response.data && response.data.length > 0) {
        setSelectedBankId(response.data[0]._id);
      }
    } catch (error: any) {
      console.error('Failed to fetch banks:', error);
      setError('Failed to load banks');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!selectedBankId) {
      setError('Please select a bank');
      return;
    }
    if (!startDate) {
      setError('Please select start date');
      return;
    }
    if (!endDate) {
      setError('Please select end date');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const blob = await invoiceService.generateInvoice({
        bankId: selectedBankId,
        startDate,
        endDate,
        orderType,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const bankName = banks.find(b => b._id === selectedBankId)?.bankName || 'Invoice';
      const filename = `${bankName}_${orderType}_${startDate}_to_${endDate}.xlsx`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close modal after successful download
      handleClose();
    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      setError(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBankId('');
    setStartDate('');
    setEndDate('');
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileDown size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Generate Invoice</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {orderType === 'bank_orders' ? 'Bank Orders' : 'BIP Orders'}
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
        <div className="p-6 space-y-5">
          {isLoadingBanks ? (
            <div className="py-8 text-center text-gray-500">Loading banks...</div>
          ) : banks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">No banks available</p>
              <p className="text-sm text-gray-500 mt-1">Please add banks first</p>
            </div>
          ) : (
            <>
              {/* Bank Selection */}
              <div>
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  Select Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-3 transition-all duration-200"
                  disabled={isLoading}
                  required
                >
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.bankName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-3 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block mb-2.5 text-sm font-semibold text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-3 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> The invoice will include both dispatched and cancelled orders.
                  Sheet 1 contains invoice data, Sheet 2 contains tracking data for dispatched orders.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleGenerate}
                  isLoading={isLoading}
                  disabled={!selectedBankId || !startDate || !endDate || isLoading}
                >
                  <FileDown size={20} className="mr-2" />
                  Generate Invoice
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
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerationModal;

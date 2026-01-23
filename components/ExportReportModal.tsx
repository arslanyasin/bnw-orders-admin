import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

interface Bank {
  _id: string;
  bankName: string;
}

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (bankId: string, startDate: string, endDate: string, orderType: string) => Promise<void>;
  banks: Bank[];
  isLoading?: boolean;
}

const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  banks,
  isLoading = false,
}) => {
  const [selectedBankId, setSelectedBankId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderType, setOrderType] = useState('both');

  useEffect(() => {
    if (!isOpen) {
      setSelectedBankId('');
      setStartDate('');
      setEndDate('');
      setOrderType('both');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBankId && startDate && endDate) {
      await onExport(selectedBankId, startDate, endDate, orderType);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Purchase Orders Report" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select a bank...</option>
              {banks.map((bank) => (
                <option key={bank._id} value={bank._id}>
                  {bank.bankName}
                </option>
              ))}
            </select>
          </div>

          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type <span className="text-red-500">*</span>
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              <option value="both">Both (Reward Order & HIP)</option>
              <option value="bank-order">Reward Order</option>
              <option value="bip-order">HIP</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !selectedBankId || !startDate || !endDate}
            isLoading={isLoading}
          >
            Export Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExportReportModal;

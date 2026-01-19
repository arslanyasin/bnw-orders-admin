'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Button, Table, SelectableTable, Badge, Loader, CombinedPOPreviewModal } from '@/components';
import PurchaseOrderFormModal from '@/components/PurchaseOrderFormModal';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { vendorService } from '@/services/vendorService';
import { PurchaseOrder, Vendor, Product, CombinedPOPreview } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, Layers, XCircle } from 'lucide-react';

type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'delivered' | 'cancelled' | 'merged';

const PurchaseOrdersPage = () => {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseOrderStatus>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine mode state
  const [isCombineMode, setIsCombineMode] = useState(false);
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
  const [combinedPreview, setCombinedPreview] = useState<CombinedPOPreview | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCombining, setIsCombining] = useState(false);

  // Serial number tracking state
  const [serialNumbers, setSerialNumbers] = useState<Record<string, string>>({});
  const [isUpdatingSerials, setIsUpdatingSerials] = useState(false);

  // Fetch vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await vendorService.getAll({ limit: 1000 });
        setVendors(response.data || []);
      } catch (error) {
        console.error('[Purchase Orders] Failed to fetch vendors:', error);
        setVendors([]);
      }
    };
    fetchVendors();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch purchase orders whenever dependencies change
  useEffect(() => {
    fetchPurchaseOrders();
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, vendorFilter, startDate, endDate]);

  const fetchPurchaseOrders = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (vendorFilter !== 'all') {
        params.vendorId = vendorFilter;
      }

      if (startDate) {
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        params.endDate = endDateTime.toISOString();
      }

      console.log('[Purchase Orders] Fetching with params:', params);

      const response = await purchaseOrderService.getAll(params);

      console.log('[Purchase Orders] Response:', {
        dataCount: response.data?.length,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });

      setPurchaseOrders(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch (error: any) {
      console.error('[Purchase Orders] Failed to fetch:', error);
      setPurchaseOrders([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (po?: PurchaseOrder) => {
    setSelectedPO(po || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPO(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (selectedPO) {
        await purchaseOrderService.update(selectedPO._id, data);
      } else {
        await purchaseOrderService.create(data);
      }
      handleCloseModal();
      fetchPurchaseOrders();
    } catch (error: any) {
      alert(error.message || 'Failed to save purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    try {
      await purchaseOrderService.delete(id);
      fetchPurchaseOrders();
    } catch (error: any) {
      alert(error.message || 'Failed to delete purchase order');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please provide a reason for canceling this purchase order:');

    if (reason === null) return; // User clicked cancel

    if (!reason.trim()) {
      alert('Cancellation reason is required');
      return;
    }

    if (!confirm('Are you sure you want to cancel this purchase order?')) return;

    try {
      await purchaseOrderService.cancel(id, reason.trim());
      fetchPurchaseOrders();
      alert('Purchase order cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel purchase order');
    }
  };

  // Combine mode handlers
  const handleToggleCombineMode = () => {
    setIsCombineMode(!isCombineMode);
    setSelectedPOIds([]);
  };

  const getSelectedPOs = (): PurchaseOrder[] => {
    return purchaseOrders.filter(po => selectedPOIds.includes(po._id));
  };

  const validateSelection = (): { valid: boolean; error?: string } => {
    const selected = getSelectedPOs();

    if (selected.length < 2) {
      return { valid: false, error: 'Please select at least 2 purchase orders' };
    }

    const firstVendorId =
      typeof selected[0].vendorId === 'string'
        ? selected[0].vendorId
        : selected[0].vendorId._id;

    const allSameVendor = selected.every(po => {
      const vendorId = typeof po.vendorId === 'string' ? po.vendorId : po.vendorId._id;
      return vendorId === firstVendorId;
    });

    if (!allSameVendor) {
      return { valid: false, error: 'All selected POs must be from the same vendor' };
    }

    return { valid: true };
  };

  const isPOSelectableWithCurrent = (po: PurchaseOrder): boolean => {
    if (selectedPOIds.length === 0) return true;

    const selectedPOs = getSelectedPOs();
    const firstVendorId =
      typeof selectedPOs[0].vendorId === 'string'
        ? selectedPOs[0].vendorId
        : selectedPOs[0].vendorId._id;

    const currentVendorId =
      typeof po.vendorId === 'string' ? po.vendorId : po.vendorId._id;

    return firstVendorId === currentVendorId;
  };

  const handlePreviewCombined = async () => {
    const validation = validateSelection();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setIsLoadingPreview(true);
      setIsPreviewModalOpen(true);
      const response = await purchaseOrderService.previewCombined({
        poIds: selectedPOIds,
      });
      setCombinedPreview(response.data || null);
    } catch (error: any) {
      alert(error.message || 'Failed to load preview');
      setIsPreviewModalOpen(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmCombine = async () => {
    try {
      setIsCombining(true);
      const response = await purchaseOrderService.mergePOs({
        poIds: selectedPOIds,
      });

      // Reset state
      setIsPreviewModalOpen(false);
      setCombinedPreview(null);
      setIsCombineMode(false);
      setSelectedPOIds([]);

      // Navigate to merged PO detail page where user can print
      if (response.data?._id) {
        router.push(`/purchase-orders/${response.data._id}`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to merge purchase orders');
      setIsCombining(false);
    }
  };

  const getVendorName = (po: PurchaseOrder): string => {
    if (typeof po.vendorId === 'object' && po.vendorId !== null) {
      return (po.vendorId as Vendor).vendorName;
    }
    return '-';
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotalAmount = (po: PurchaseOrder): number => {
    return po.products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitPrice);
    }, 0);
  };

  const handleSerialNumberChange = (poId: string, value: string) => {
    setSerialNumbers(prev => ({
      ...prev,
      [poId]: value,
    }));
  };

  const handleBulkUpdateSerialNumbers = async () => {
    // Filter only POs with serial numbers entered
    const updates = Object.entries(serialNumbers)
      .filter(([_, serialNumber]) => serialNumber.trim() !== '')
      .map(([poId, serialNumber]) => {
        const po = purchaseOrders.find(p => p._id === poId);
        if (!po || !po.products || po.products.length === 0) return null;

        return {
          poId,
          products: [
            {
              productId: typeof po.products[0].productId === 'object'
                ? (po.products[0].productId as Product)._id
                : po.products[0].productId,
              serialNumber: serialNumber.trim(),
            },
          ],
        };
      })
      .filter(update => update !== null) as Array<{
        poId: string;
        products: Array<{ productId: string; serialNumber: string }>;
      }>;

    if (updates.length === 0) {
      alert('Please enter at least one serial number');
      return;
    }

    try {
      setIsUpdatingSerials(true);
      await purchaseOrderService.bulkUpdate({ updates });
      alert(`Successfully updated ${updates.length} purchase order(s)`);
      setSerialNumbers({});
      fetchPurchaseOrders();
    } catch (error: any) {
      alert(error.message || 'Failed to update serial numbers');
    } finally {
      setIsUpdatingSerials(false);
    }
  };

  const columns = [
    {
      header: 'PO ID',
      accessor: '_id',
      width: '150px',
      render: (po: PurchaseOrder) => (
        <span className="font-mono text-xs text-gray-600">{po._id.substring(0, 8)}...</span>
      ),
    },
    {
      header: 'PO #',
      accessor: 'poNumber',
      width: '150px',
      render: (po: PurchaseOrder) => (
        <span className="font-mono text-xs text-gray-600">{po.poNumber}</span>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'vendorId',
      render: (po: PurchaseOrder) => (
        <span className="font-medium text-gray-900">{getVendorName(po)}</span>
      ),
    },
    {
      header: 'Product Name',
      accessor: 'products',
      width: '200px',
      render: (po: PurchaseOrder) => {
        const firstProduct = po.products?.[0];
        return (
          <span className="text-gray-900">
            {firstProduct?.productName || 'N/A'}
          </span>
        );
      },
    },
    {
      header: 'Color',
      accessor: 'color',
      width: '100px',
      render: (po: PurchaseOrder) => {
        const firstProduct = po.products?.[0];
        return (
          <span className="text-gray-700">
            {firstProduct?.color || '-'}
          </span>
        );
      },
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      width: '150px',
      render: (po: PurchaseOrder) => (
        <span className="text-green-600 font-semibold">
          {formatAmount(po.totalAmount || calculateTotalAmount(po))}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '120px',
      render: (po: PurchaseOrder) => (
        <Badge variant={getStatusBadgeVariant(po?.status)}>
          {po?.status?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Order Type',
      accessor: 'bankOrderId',
      width: '120px',
      render: (po: PurchaseOrder) => {
        if (po.bankOrderId) return <span className="text-blue-600 text-sm">Bank Order</span>;
        if (po.bipOrderId) return <span className="text-purple-600 text-sm">BIP Order</span>;
        return <span className="text-gray-500 text-sm">Direct</span>;
      },
    },
    {
      header: 'Serial Number',
      accessor: 'products',
      width: '180px',
      render: (po: PurchaseOrder) => {
        // Only show input for original POs (not merged)
        if (po.isMerged) {
          return <span className="text-gray-400 text-sm">N/A (Merged)</span>;
        }

        // Get existing serial number if any
        const existingSerial = po.products?.[0]?.serialNumber || '';
        const currentValue = serialNumbers[po._id] ?? existingSerial;

        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSerialNumberChange(po._id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter serial #"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      },
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      width: '120px',
      render: (po: PurchaseOrder) => (
        <span className="text-gray-600 text-sm">
          {new Date(po.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      width: '180px',
      render: (po: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/purchase-orders/${po._id}`);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(po);
            }}
            className="text-green-600 hover:text-green-800"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel(po._id);
            }}
            className="text-orange-600 hover:text-orange-800"
            title="Cancel PO"
            disabled={po.status === 'cancelled' || po.status === 'delivered'}
          >
            <XCircle size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(po._id);
            }}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Manage purchase orders for vendors</p>
          </div>
          <div className="flex items-center gap-3">
            {isCombineMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedPOIds.length} PO{selectedPOIds.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" onClick={handleToggleCombineMode}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePreviewCombined}
                  disabled={selectedPOIds.length < 2}
                >
                  Preview Selected ({selectedPOIds.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleBulkUpdateSerialNumbers}
                  disabled={isUpdatingSerials || Object.keys(serialNumbers).length === 0}
                  isLoading={isUpdatingSerials}
                >
                  Save Serial Numbers
                </Button>
                <Button variant="outline" onClick={handleToggleCombineMode}>
                  <Layers size={20} className="mr-2" />
                  Combine POs
                </Button>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <Plus size={20} className="mr-2" />
                  Create PO
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Status Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'draft'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'delivered'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'cancelled'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Cancelled
              </button>
              <button
                onClick={() => setStatusFilter('merged')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'merged'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Merged
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search purchase orders..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm !== debouncedSearchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Vendor:</label>
                  <select
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.vendorName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Start Date:</label>
                  <input
                    type="date"
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">End Date:</label>
                  <input
                    type="date"
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            </div>

            {debouncedSearchTerm && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Found <span className="font-semibold text-gray-900">{totalRecords}</span> result{totalRecords !== 1 ? 's' : ''} for "<span className="font-medium">{debouncedSearchTerm}</span>"
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12">
              <Loader size="lg" text="Loading purchase orders..." />
            </div>
          ) : (
            <>
              {isCombineMode ? (
                <SelectableTable
                  columns={columns}
                  data={purchaseOrders}
                  selectedIds={selectedPOIds}
                  onSelectionChange={setSelectedPOIds}
                  getItemId={(po) => po._id}
                  onRowClick={(po) => !po.isMerged && router.push(`/purchase-orders/${po._id}`)}
                  emptyMessage="No purchase orders found"
                  isItemDisabled={(po) =>
                    po.status === 'merged' ||
                    po.status === 'draft' ||
                    po.status === 'delivered' ||
                    po.status === 'cancelled' ||
                    !isPOSelectableWithCurrent(po)
                  }
                  disabledMessage={(po) => {
                    if (po.status === 'merged') return 'This PO has already been merged';
                    if (po.status === 'draft') return 'Draft POs cannot be merged';
                    if (po.status === 'delivered') return 'Delivered POs cannot be merged';
                    if (po.status === 'cancelled') return 'Cancelled POs cannot be merged';
                    if (!isPOSelectableWithCurrent(po)) return 'Must be from same vendor';
                    return '';
                  }}
                />
              ) : (
                <Table
                  columns={columns}
                  data={purchaseOrders}
                  onRowClick={(po) => router.push(`/purchase-orders/${po._id}`)}
                  emptyMessage="No purchase orders found"
                />
              )}

              {/* Pagination */}
              {purchaseOrders.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                        <span className="font-medium">{totalRecords}</span> results
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Show:</label>
                        <select
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        size="sm"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        size="sm"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, idx) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = idx + 1;
                          } else if (currentPage <= 3) {
                            pageNum = idx + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + idx;
                          } else {
                            pageNum = currentPage - 2 + idx;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`min-w-[36px] px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        size="sm"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        size="sm"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Purchase Order Form Modal */}
        <PurchaseOrderFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          purchaseOrder={selectedPO}
          isLoading={isSubmitting}
        />

        {/* Combined PO Preview Modal */}
        <CombinedPOPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          preview={combinedPreview}
          isLoading={isLoadingPreview}
          onConfirm={handleConfirmCombine}
          isConfirming={isCombining}
        />
      </div>
    </AdminLayout>
  );
};

export default PurchaseOrdersPage;

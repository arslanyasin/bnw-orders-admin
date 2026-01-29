'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Button, Table, Loader, EditBipOrderModal, CommentModal, BipOrderDetailModal } from '@/components';
import ImportBipOrdersModal from '@/components/ImportBipOrdersModal';
import PurchaseOrderFormModal from '@/components/PurchaseOrderFormModal';
import CourierDispatchModal from '@/components/CourierDispatchModal';
import BulkPurchaseOrderModal from '@/components/BulkPurchaseOrderModal';
import WhatsAppConfirmationModal from '@/components/WhatsAppConfirmationModal';
import { bipService } from '@/services/bipService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { courierService } from '@/services/courierService';
import { deliveryService } from '@/services/deliveryService';
import { whatsappService } from '@/services/whatsappService';
import { BipOrder, OrderStatus, DispatchOrderRequest } from '@/types';
import { Edit, Trash2, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, Upload, ShoppingCart, Truck, Printer, FileText, MessageCircle } from 'lucide-react';

type SortField = 'poNumber' | 'customerName' | 'product' | 'orderDate' | 'city' | 'amount';
type SortOrder = 'asc' | 'desc';

const BipOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<BipOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'poNumber' | 'eforms' | 'product'>('all');
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedOrderForPO, setSelectedOrderForPO] = useState<BipOrder | null>(null);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<BipOrder | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Challan print mode state
  const [isPrintChallanMode, setIsPrintChallanMode] = useState(false);
  const [selectedOrdersForPrint, setSelectedOrdersForPrint] = useState<string[]>([]);

  // Bulk PO mode state
  const [isBulkPOMode, setIsBulkPOMode] = useState(false);
  const [selectedOrdersForBulkPO, setSelectedOrdersForBulkPO] = useState<string[]>([]);
  const [isBulkPOModalOpen, setIsBulkPOModalOpen] = useState(false);
  const [isCreatingBulkPO, setIsCreatingBulkPO] = useState(false);

  // WhatsApp confirmation mode state
  const [isWhatsAppMode, setIsWhatsAppMode] = useState(false);
  const [selectedOrdersForWhatsApp, setSelectedOrdersForWhatsApp] = useState<string[]>([]);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Edit order state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<BipOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedOrderForComment, setSelectedOrderForComment] = useState<BipOrder | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<BipOrder | null>(null);

  // Print labels mode state
  const [isPrintLabelsMode, setIsPrintLabelsMode] = useState(false);
  const [selectedOrdersForLabels, setSelectedOrdersForLabels] = useState<string[]>([]);

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

  // Fetch orders whenever dependencies change
  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, sortField, sortOrder, debouncedSearchTerm, searchField, statusFilter, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: sortField,
        sortOrder: sortOrder,
      };

      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
        if (searchField !== 'all') {
          params.searchField = searchField;
        }
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Use different date parameter names based on status filter
      if (startDate) {
        if (statusFilter === 'all') {
          params.startDate = new Date(startDate).toISOString();
        } else {
          params.statusStartDate = new Date(startDate).toISOString();
        }
      }

      if (endDate) {
        // Set to end of day for endDate
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);

        if (statusFilter === 'all') {
          params.endDate = endDateTime.toISOString();
        } else {
          params.statusEndDate = endDateTime.toISOString();
        }
      }

      console.log('[BIP Orders] Fetching with params:', params);

      const response = await bipService.getAll(params);

      console.log('[BIP Orders] Response:', {
        dataCount: response.data?.length,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });

      setOrders(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch (error: any) {
      console.error('[BIP Orders] Failed to fetch orders:', error);
      setOrders([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await bipService.delete(id);
      fetchOrders();
    } catch (error: any) {
      alert(error.message || 'Failed to delete order');
    }
  };

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    try {
      await bipService.updateStatus(id, status);
      fetchOrders();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };


  const handleImport = async (bankId: string, file: File) => {
    try {
      setIsImporting(true);
      console.log('Importing BIP orders:', { bankId, fileName: file.name });

      const response = await bipService.import(bankId, file);

      setIsImportModalOpen(false);
      fetchOrders();

      // Show import results
      if (response.data) {
        const { totalRows, successCount, failedCount, failedRecords } = response.data;

        if (failedCount > 0) {
          // Build detailed error message
          let errorMessage = `Import completed!\n\n`;
          errorMessage += `Summary:\n`;
          errorMessage += `• Total: ${totalRows} rows\n`;
          errorMessage += `• Success: ${successCount}\n`;
          errorMessage += `• Failed: ${failedCount}\n\n`;

          if (failedRecords && failedRecords.length > 0) {
            errorMessage += `Failed Rows:\n`;

            // Show first 10 errors
            const errorsToShow = failedRecords.slice(0, 10);
            errorsToShow.forEach((record) => {
              const errorText = record.errors.join(', ');
              errorMessage += `• Row ${record.row}: ${errorText}\n`;
            });

            // If there are more errors, show count
            if (failedRecords.length > 10) {
              errorMessage += `\n... and ${failedRecords.length - 10} more errors`;
            }
          }

          alert(errorMessage);

          // Log all errors to console for detailed inspection
          if (failedRecords && failedRecords.length > 0) {
            console.group('Import Errors - Detailed View');
            console.log('Total Failed Records:', failedCount);
            failedRecords.forEach((record) => {
              console.group(`Row ${record.row}`);
              console.log('Data:', record.data);
              console.log('Errors:', record.errors);
              console.groupEnd();
            });
            console.groupEnd();
          }
        } else {
          alert(`Successfully imported ${successCount} BIP order${successCount !== 1 ? 's' : ''}!`);
        }
      } else {
        alert('BIP orders imported successfully!');
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.message || 'Failed to import BIP orders');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreatePOFromOrder = (order: BipOrder) => {
    setSelectedOrderForPO(order);
    setIsPOModalOpen(true);
  };

  const handleClosePOModal = () => {
    setIsPOModalOpen(false);
    setSelectedOrderForPO(null);
  };

  const handleSubmitPO = async (data: any) => {
    try {
      setIsSubmittingPO(true);
      await purchaseOrderService.create(data);

      // Update the order status to "processing" after creating PO
      if (selectedOrderForPO) {
        await bipService.updateStatus(selectedOrderForPO._id, 'processing');
      }

      handleClosePOModal();
      fetchOrders(); // Refresh to show updated status
      alert('Purchase Order created successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to create purchase order');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const handleDispatchOrder = (order: BipOrder) => {
    setSelectedOrderForDispatch(order);
    setIsDispatchModalOpen(true);
  };

  const handleCloseDispatchModal = () => {
    setIsDispatchModalOpen(false);
    setSelectedOrderForDispatch(null);
  };

  const handleSubmitDispatch = async (data: DispatchOrderRequest) => {
    if (!selectedOrderForDispatch) return;

    try {
      setIsDispatching(true);

      // Call manual or automatic dispatch based on isManualDispatch flag
      const response = data.isManualDispatch
        ? await courierService.manualDispatchBipOrder(selectedOrderForDispatch._id, data)
        : await courierService.dispatchBipOrder(selectedOrderForDispatch._id, data);

      // Automatically create delivery challan after successful dispatch
      try {
        if (response.data?.trackingNumber) {
          await deliveryService.create({
            bipOrderId: selectedOrderForDispatch._id,
            courierCompany: data.courierType.toUpperCase(),
            trackingNumber: response.data.trackingNumber,
            dispatchDate: new Date().toISOString(),
          });
        }
      } catch (deliveryError: any) {
        console.error('Failed to create delivery challan:', deliveryError);
        // Don't fail the entire dispatch if delivery challan creation fails
      }

      handleCloseDispatchModal();
      fetchOrders(); // Refresh to show updated status
      alert(`Order dispatched successfully!\nTracking Number: ${response.data?.trackingNumber || 'N/A'}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to dispatch order');
    } finally {
      setIsDispatching(false);
    }
  };

  const handlePrintLabel = (order: BipOrder) => {
    if (!order.shipmentId || typeof order.shipmentId === 'string') {
      alert('No shipment information available');
      return;
    }

    const consignmentNumber = order.shipmentId.consignmentNumber;
    if (!consignmentNumber) {
      alert('Consignment number not available');
      return;
    }

    const accessToken = process.env.NEXT_PUBLIC_TCS_ACCESS_TOKEN;
    if (!accessToken) {
      alert('TCS access token not configured');
      return;
    }

    const printUrl = `https://ociconnect.tcscourier.com/ecom/api/print/label?accesstoken=${encodeURIComponent(accessToken)}&consignmentno=${consignmentNumber}&shipperDetails=false&printtype=2`;
    window.open(printUrl, '_blank');
  };

  const handleViewChallan = (order: BipOrder) => {
    if (!order.deliveryChallan) {
      alert('Delivery challan not available');
      return;
    }

    const pdfUrl = `${order.deliveryChallan.pdfURLPath}`;
    window.open(pdfUrl, '_blank');
  };

  const handleTogglePrintChallanMode = () => {
    setIsPrintChallanMode(!isPrintChallanMode);
    setSelectedOrdersForPrint([]);
    setIsBulkPOMode(false);
    setSelectedOrdersForBulkPO([]);
    setIsWhatsAppMode(false);
    setSelectedOrdersForWhatsApp([]);
    setIsPrintLabelsMode(false);
    setSelectedOrdersForLabels([]);
  };

  const handleToggleBulkPOMode = () => {
    setIsBulkPOMode(!isBulkPOMode);
    setSelectedOrdersForBulkPO([]);
    setIsPrintChallanMode(false);
    setSelectedOrdersForPrint([]);
    setIsWhatsAppMode(false);
    setSelectedOrdersForWhatsApp([]);
    setIsPrintLabelsMode(false);
    setSelectedOrdersForLabels([]);
  };

  const handleToggleWhatsAppMode = () => {
    setIsWhatsAppMode(!isWhatsAppMode);
    setSelectedOrdersForWhatsApp([]);
    setIsPrintChallanMode(false);
    setSelectedOrdersForPrint([]);
    setIsBulkPOMode(false);
    setSelectedOrdersForBulkPO([]);
    setIsPrintLabelsMode(false);
    setSelectedOrdersForLabels([]);
  };

  const handleTogglePrintLabelsMode = () => {
    setIsPrintLabelsMode(!isPrintLabelsMode);
    setSelectedOrdersForLabels([]);
    setIsPrintChallanMode(false);
    setSelectedOrdersForPrint([]);
    setIsBulkPOMode(false);
    setSelectedOrdersForBulkPO([]);
    setIsWhatsAppMode(false);
    setSelectedOrdersForWhatsApp([]);
  };

  const handlePrintMultipleChallans = () => {
    if (selectedOrdersForPrint.length === 0) {
      alert('Please select at least one order');
      return;
    }

    // Get selected orders
    const selectedOrders = orders.filter(order =>
      selectedOrdersForPrint.includes(order._id) && order.deliveryChallan
    );

    if (selectedOrders.length === 0) {
      alert('No delivery challans available for selected orders');
      return;
    }

    // Pass bip order IDs to print page
    const orderIds = selectedOrders.map(order => order._id).join(',');
    router.push(`/print-challans?type=bip&ids=${encodeURIComponent(orderIds)}`);
  };

  const handlePrintMultipleLabels = () => {
    if (selectedOrdersForLabels.length === 0) {
      alert('Please select at least one order');
      return;
    }

    // Get selected orders with shipment IDs
    const selectedOrders = orders.filter(order =>
      selectedOrdersForLabels.includes(order._id) && order.shipmentId
    );

    if (selectedOrders.length === 0) {
      alert('No dispatched orders available for selected orders');
      return;
    }

    // Pass bip order IDs to print labels page
    const orderIds = selectedOrders.map(order => order._id).join(',');
    router.push(`/print-labels?type=bip&ids=${encodeURIComponent(orderIds)}`);
  };

  const handleToggleLabelSelection = (orderId: string) => {
    setSelectedOrdersForLabels((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleToggleOrderSelection = (orderId: string) => {
    setSelectedOrdersForPrint((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleToggleAllOrders = () => {
    if (isPrintChallanMode) {
      // Only select orders that have delivery challans
      const ordersWithChallans = orders.filter(order => order.deliveryChallan);

      if (selectedOrdersForPrint.length === ordersWithChallans.length) {
        setSelectedOrdersForPrint([]);
      } else {
        setSelectedOrdersForPrint(ordersWithChallans.map(order => order._id));
      }
    } else if (isPrintLabelsMode) {
      // Only select orders that have shipment IDs (dispatched orders)
      const ordersWithLabels = orders.filter(order => order.shipmentId);

      if (selectedOrdersForLabels.length === ordersWithLabels.length) {
        setSelectedOrdersForLabels([]);
      } else {
        setSelectedOrdersForLabels(ordersWithLabels.map(order => order._id));
      }
    } else if (isBulkPOMode) {
      // Only select orders with the same product
      const eligibleOrders = getEligibleOrdersForBulkPO();

      if (selectedOrdersForBulkPO.length === eligibleOrders.length) {
        setSelectedOrdersForBulkPO([]);
      } else {
        setSelectedOrdersForBulkPO(eligibleOrders.map(order => order._id));
      }
    } else if (isWhatsAppMode) {
      // Select all orders for WhatsApp
      if (selectedOrdersForWhatsApp.length === orders.length) {
        setSelectedOrdersForWhatsApp([]);
      } else {
        setSelectedOrdersForWhatsApp(orders.map(order => order._id));
      }
    }
  };

  const getEligibleOrdersForBulkPO = () => {
    // Group orders by product and return only groups with multiple orders
    const productMap = new Map<string, BipOrder[]>();

    orders.forEach(order => {
      const key = order.product;
      if (!productMap.has(key)) {
        productMap.set(key, []);
      }
      productMap.get(key)!.push(order);
    });

    // Get all orders that have at least one other order with the same product
    const eligibleOrders: BipOrder[] = [];
    productMap.forEach((ordersGroup) => {
      if (ordersGroup.length > 1) {
        eligibleOrders.push(...ordersGroup);
      }
    });

    return eligibleOrders;
  };

  const handleCreateBulkPO = () => {
    if (selectedOrdersForBulkPO.length === 0) {
      alert('Please select at least one order');
      return;
    }

    const selectedOrders = orders.filter(order =>
      selectedOrdersForBulkPO.includes(order._id)
    );

    // Check if all selected orders have the same product
    const uniqueProducts = [...new Set(selectedOrders.map(o => o.product))];
    if (uniqueProducts.length > 1) {
      alert('All selected orders must have the same product. Please select orders with the same product.');
      return;
    }

    setIsBulkPOModalOpen(true);
  };

  const handleSubmitBulkPO = async (data: { vendorId: string; unitPrice: number }) => {
    try {
      setIsCreatingBulkPO(true);

      const selectedOrders = orders.filter(order =>
        selectedOrdersForBulkPO.includes(order._id)
      );

      await purchaseOrderService.bulkCreate({
        vendorId: data.vendorId,
        unitPrice: data.unitPrice,
        bipOrderIds: selectedOrders.map(o => o._id),
      });

      // Update all selected orders to "processing" status
      await Promise.all(
        selectedOrders.map(order =>
          bipService.updateStatus(order._id, 'processing')
        )
      );

      setIsBulkPOModalOpen(false);
      setIsBulkPOMode(false);
      setSelectedOrdersForBulkPO([]);
      fetchOrders();
      alert(`Successfully created ${selectedOrders.length} purchase orders!`);
    } catch (error: any) {
      alert(error.message || 'Failed to create bulk purchase orders');
    } finally {
      setIsCreatingBulkPO(false);
    }
  };

  const handleToggleBulkPOSelection = (orderId: string) => {
    setSelectedOrdersForBulkPO((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const isOrderEligibleForBulkPO = (order: BipOrder) => {
    const eligibleOrders = getEligibleOrdersForBulkPO();
    return eligibleOrders.some(o => o._id === order._id);
  };

  const handleSendWhatsApp = () => {
    if (selectedOrdersForWhatsApp.length === 0) {
      alert('Please select at least one order');
      return;
    }

    setIsWhatsAppModalOpen(true);
  };

  const handleSubmitWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);

      const selectedOrders = orders.filter(order =>
        selectedOrdersForWhatsApp.includes(order._id)
      );

      const ordersData = selectedOrders.map(order => ({
        phone: order.mobile1.startsWith('+92') ? order.mobile1 : `+92${order.mobile1.replace(/^0+/, '')}`,
        customerName: order.customerName,
        orderNumber: order.eforms,
        orderPrice: `${order.amount}`,
        address: `${order.address}, ${order.city}`,
        product: order.product,
      }));

      const result = await whatsappService.sendBulkOrderConfirmations(ordersData);

      setIsWhatsAppModalOpen(false);
      setIsWhatsAppMode(false);
      setSelectedOrdersForWhatsApp([]);

      if (result.failed > 0) {
        const errorDetails = result.errors.map(e => `${e.orderNumber}: ${e.error}`).join('\n');
        alert(
          `WhatsApp confirmations sent!\n\n` +
          `Success: ${result.success}\n` +
          `Failed: ${result.failed}\n\n` +
          `Failed orders:\n${errorDetails}`
        );
      } else {
        alert(`Successfully sent WhatsApp confirmations to ${result.success} customer${result.success !== 1 ? 's' : ''}!`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to send WhatsApp confirmations');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleToggleWhatsAppSelection = (orderId: string) => {
    setSelectedOrdersForWhatsApp((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleOpenEditModal = (order: BipOrder) => {
    setSelectedOrderForEdit(order);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrderForEdit(null);
  };

  const handleSubmitEdit = async (data: { address: string; city: string; mobile1: string; color: string }) => {
    if (!selectedOrderForEdit) return;

    try {
      setIsUpdating(true);
      await bipService.update(selectedOrderForEdit._id, data);

      handleCloseEditModal();
      fetchOrders(); // Refresh to show updated data
      alert('Order updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenCommentModal = (order: BipOrder) => {
    setSelectedOrderForComment(order);
    setIsCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedOrderForComment(null);
  };

  const handleSubmitComment = async (comment: string) => {
    if (!selectedOrderForComment) return;

    try {
      setIsAddingComment(true);
      await bipService.addComment(selectedOrderForComment._id, comment);

      handleCloseCommentModal();
      alert('Comment added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleOpenDetailModal = (order: BipOrder) => {
    setSelectedOrderForDetail(order);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderForDetail(null);
  };

  const handleAddCommentFromDetail = async (orderId: string, comment: string) => {
    try {
      setIsAddingComment(true);
      await bipService.addComment(orderId, comment);
      alert('Comment added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-blue-600" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-blue-600" />
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to get status badge colors
  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      dispatched: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      shipped: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      returned: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Helper function to get row background color
  const getRowColor = (status: OrderStatus) => {
    const colors = {
      pending: 'bg-yellow-50/30',
      confirmed: 'bg-blue-50/30',
      processing: 'bg-purple-50/30',
      dispatched: 'bg-indigo-50/30',
      shipped: 'bg-cyan-50/30',
      delivered: 'bg-green-50/30',
      cancelled: 'bg-red-50/30',
      returned: 'bg-orange-50/30',
    };
    return colors[status] || '';
  };

  // Create columns array with conditional checkbox column
  const checkboxColumn = isPrintChallanMode || isPrintLabelsMode || isBulkPOMode || isWhatsAppMode
    ? {
        header: (
          <input
            type="checkbox"
            checked={
              isPrintChallanMode
                ? orders.filter(o => o.deliveryChallan).length > 0 &&
                  selectedOrdersForPrint.length === orders.filter(o => o.deliveryChallan).length
                : isPrintLabelsMode
                ? orders.filter(o => o.shipmentId).length > 0 &&
                  selectedOrdersForLabels.length === orders.filter(o => o.shipmentId).length
                : isBulkPOMode
                ? getEligibleOrdersForBulkPO().length > 0 &&
                  selectedOrdersForBulkPO.length === getEligibleOrdersForBulkPO().length
                : orders.length > 0 &&
                  selectedOrdersForWhatsApp.length === orders.length
            }
            onChange={handleToggleAllOrders}
            className="w-6 h-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
        ),
        accessor: 'checkbox',
        width: '80px',
        render: (order: BipOrder) => {
          const isDisabled = isPrintChallanMode
            ? !order.deliveryChallan
            : isPrintLabelsMode
            ? !order.shipmentId
            : isBulkPOMode
            ? !isOrderEligibleForBulkPO(order)
            : false;

          const isChecked = isPrintChallanMode
            ? selectedOrdersForPrint.includes(order._id)
            : isPrintLabelsMode
            ? selectedOrdersForLabels.includes(order._id)
            : isBulkPOMode
            ? selectedOrdersForBulkPO.includes(order._id)
            : selectedOrdersForWhatsApp.includes(order._id);

          const handleChange = isPrintChallanMode
            ? handleToggleOrderSelection
            : isPrintLabelsMode
            ? handleToggleLabelSelection
            : isBulkPOMode
            ? handleToggleBulkPOSelection
            : handleToggleWhatsAppSelection;

          const title = isPrintChallanMode
            ? (!order.deliveryChallan ? 'No delivery challan available' : '')
            : isPrintLabelsMode
            ? (!order.shipmentId ? 'Order not dispatched' : '')
            : isBulkPOMode
            ? (!isOrderEligibleForBulkPO(order) ? 'No other orders with same product' : '')
            : '';

          return (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                e.stopPropagation();
                handleChange(order._id);
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={isDisabled}
              className="w-6 h-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={title}
            />
          );
        },
      }
    : null;

  const baseColumns = [
    {
      header: (
        <button
          onClick={() => handleSort('orderDate')}
          className="flex items-center hover:text-blue-600 transition-colors"
        >
          Order Date
          {getSortIcon('orderDate')}
        </button>
      ),
      accessor: 'orderDate',
      width: '140px',
      render: (order: BipOrder) => new Date(order.orderDate).toLocaleDateString(),
    },
    {
      header: (
        <button
          onClick={() => handleSort('customerName')}
          className="flex items-center hover:text-blue-600 transition-colors"
        >
          Customer Name
          {getSortIcon('customerName')}
        </button>
      ),
      accessor: 'customerName',
      width: '200px',
    },
    {
      header: (
        <button
          onClick={() => handleSort('product')}
          className="flex items-center hover:text-blue-600 transition-colors"
        >
          Product
          {getSortIcon('product')}
        </button>
      ),
      accessor: 'product',
      width: '280px',
    },
    {
      header: 'Mobile',
      accessor: 'mobile1',
      width: '140px',
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '200px',
      render: (order: BipOrder) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)} capitalize`}>
            {order.status}
          </span>
          <select
              value={order.status}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusUpdate(order._id, e.target.value as OrderStatus);
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              onClick={(e) => e.stopPropagation()}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      ),
    },
    {
      header: 'Status Updated',
      accessor: 'statusHistory',
      width: '160px',
      render: (order: BipOrder) => {
        const currentStatusHistory = order.statusHistory?.find(
          (history) => history.status === order.status
        );
        return (
          <span className="text-sm text-gray-600">
            {currentStatusHistory
              ? new Date(currentStatusHistory.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: '_id',
      width: '230px',
      render: (order: BipOrder) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetailModal(order);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditModal(order);
            }}
            className="text-yellow-600 hover:text-yellow-800"
            title="Edit Order"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCreatePOFromOrder(order);
            }}
            className="text-green-600 hover:text-green-800"
            title="Create Purchase Order"
          >
            <ShoppingCart size={18} />
          </button>
          {order.status === 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDispatchOrder(order);
              }}
              className="text-orange-600 hover:text-orange-800"
              title="Dispatch with Courier"
            >
              <Truck size={18} />
            </button>
          )}
          {order.status === 'dispatched' && order.shipmentId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintLabel(order);
              }}
              className="text-purple-600 hover:text-purple-800"
              title="Print TCS Label"
            >
              <Printer size={18} />
            </button>
          )}
          {order.deliveryChallan && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewChallan(order);
              }}
              className="text-indigo-600 hover:text-indigo-800"
              title="View Delivery Challan"
            >
              <FileText size={18} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCommentModal(order);
            }}
            className="text-gray-600 hover:text-gray-800"
            title="Add Comment"
          >
            <MessageCircle size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(order._id);
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

  // Combine columns based on print mode
  const columns = checkboxColumn ? [checkboxColumn, ...baseColumns] : baseColumns;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BIP Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all BIP redemption orders</p>
          </div>
          <div className="flex items-center gap-3">
            {isPrintChallanMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrdersForPrint.length} order{selectedOrdersForPrint.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" onClick={handleTogglePrintChallanMode}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePrintMultipleChallans}
                  disabled={selectedOrdersForPrint.length === 0}
                >
                  <Printer size={20} className="mr-2" />
                  Print Selected ({selectedOrdersForPrint.length})
                </Button>
              </>
            ) : isPrintLabelsMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrdersForLabels.length} order{selectedOrdersForLabels.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" onClick={handleTogglePrintLabelsMode}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePrintMultipleLabels}
                  disabled={selectedOrdersForLabels.length === 0}
                >
                  <Printer size={20} className="mr-2" />
                  Print Labels ({selectedOrdersForLabels.length})
                </Button>
              </>
            ) : isBulkPOMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrdersForBulkPO.length} order{selectedOrdersForBulkPO.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" onClick={handleToggleBulkPOMode}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateBulkPO}
                  disabled={selectedOrdersForBulkPO.length === 0}
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Create POs ({selectedOrdersForBulkPO.length})
                </Button>
              </>
            ) : isWhatsAppMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrdersForWhatsApp.length} order{selectedOrdersForWhatsApp.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" onClick={handleToggleWhatsAppMode}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendWhatsApp}
                  disabled={selectedOrdersForWhatsApp.length === 0}
                >
                  <MessageCircle size={20} className="mr-2" />
                  Send WhatsApp ({selectedOrdersForWhatsApp.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleToggleWhatsAppMode}
                >
                  <MessageCircle size={20} className="mr-2" />
                  WhatsApp Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleBulkPOMode}
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Bulk Create PO
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTogglePrintChallanMode}
                >
                  <Printer size={20} className="mr-2" />
                  Print Challans
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTogglePrintLabelsMode}
                >
                  <Printer size={20} className="mr-2" />
                  Print Labels
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <Upload size={20} className="mr-2" />
                  Import Orders
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
                onClick={() => setStatusFilter('confirmed')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'confirmed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'processing'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setStatusFilter('dispatched')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'dispatched'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Dispatched
              </button>
              <button
                onClick={() => setStatusFilter('shipped')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'shipped'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Shipped
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
                onClick={() => setStatusFilter('returned')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === 'returned'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Returned
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
                    placeholder="Search orders by PO Number, EFORMS, or Product Name..."
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
                  <label className="text-sm text-gray-600 whitespace-nowrap">Search in:</label>
                  <select
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as any)}
                  >
                    <option value="all">All Fields</option>
                    <option value="poNumber">PO Number</option>
                    <option value="eforms">EFORMS</option>
                    <option value="product">Product Name</option>
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
                  {searchField !== 'all' && <span> in <span className="font-medium">{searchField}</span></span>}
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
              <Loader size="lg" text="Loading BIP orders..." />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={orders}
                emptyMessage="No BIP orders found"
                getRowClassName={(order) => getRowColor(order.status)}
              />

              {/* Pagination */}
              {orders.length > 0 && (
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

        {/* Import Orders Modal */}
        <ImportBipOrdersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSubmit={handleImport}
          isLoading={isImporting}
        />

        {/* Purchase Order Modal */}
        <PurchaseOrderFormModal
          isOpen={isPOModalOpen}
          onClose={handleClosePOModal}
          onSubmit={handleSubmitPO}
          isLoading={isSubmittingPO}
          initialOrderType="bip"
          initialOrderId={selectedOrderForPO?._id || null}
          initialProductName={selectedOrderForPO?.product || null}
          initialQuantity={selectedOrderForPO?.qty || null}
          initialGiftCode={selectedOrderForPO?.giftCode || null}
          initialUnitPrice={selectedOrderForPO ? selectedOrderForPO.amount / selectedOrderForPO.qty : null}
        />

        {/* Courier Dispatch Modal */}
        <CourierDispatchModal
          isOpen={isDispatchModalOpen}
          onClose={handleCloseDispatchModal}
          onDispatch={handleSubmitDispatch}
          orderType="bip"
          defaultDeclaredValue={selectedOrderForDispatch?.amount || 0}
          defaultProductDescription={selectedOrderForDispatch?.product || ''}
          isLoading={isDispatching}
        />

        {/* Bulk Purchase Order Modal */}
        <BulkPurchaseOrderModal
          isOpen={isBulkPOModalOpen}
          onClose={() => setIsBulkPOModalOpen(false)}
          onSubmit={handleSubmitBulkPO}
          isLoading={isCreatingBulkPO}
          orderCount={selectedOrdersForBulkPO.length}
          productName={
            selectedOrdersForBulkPO.length > 0
              ? orders.find(o => o._id === selectedOrdersForBulkPO[0])?.product || ''
              : ''
          }
        />

        {/* WhatsApp Confirmation Modal */}
        <WhatsAppConfirmationModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          onSubmit={()=>handleSubmitWhatsApp()}
          isLoading={isSendingWhatsApp}
          orderCount={selectedOrdersForWhatsApp.length}
          orderType="BIP"
        />

        {/* Edit Order Modal */}
        <EditBipOrderModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleSubmitEdit}
          isLoading={isUpdating}
          order={selectedOrderForEdit}
        />

        {/* Comment Modal */}
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          onSubmit={handleSubmitComment}
          isLoading={isAddingComment}
          title="Add Comment"
        />

        {/* Order Detail Modal */}
        <BipOrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          order={selectedOrderForDetail}
          onAddComment={handleAddCommentFromDetail}
          isAddingComment={isAddingComment}
        />
      </div>
    </AdminLayout>
  );
};

export default BipOrdersPage;

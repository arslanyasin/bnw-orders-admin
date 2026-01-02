'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Button, Table, Loader } from '@/components';
import { deliveryService } from '@/services/deliveryService';
import { DeliveryChallan } from '@/types';
import { Eye, Search, FileText, Download } from 'lucide-react';

const DeliveryChallansPage = () => {
  const router = useRouter();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

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

  // Fetch challans whenever dependencies change
  useEffect(() => {
    fetchChallans();
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const fetchChallans = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      const response = await deliveryService.getAll(params);

      setChallans(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch delivery challans:', error);
      setChallans([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChallan = (challan: DeliveryChallan) => {
    if (challan.pdfURLPath) {
      window.open(challan.pdfURLPath, '_blank');
    } else {
      alert('PDF not available');
    }
  };

  const handleDownload = (challan: DeliveryChallan) => {
    if (challan.pdfURLPath) {
      const link = document.createElement('a');
      link.href = challan.pdfURLPath;
      link.download = `${challan.challanNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('PDF not available');
    }
  };

  const columns = [
    {
      header: 'Challan Number',
      accessor: 'challanNumber',
      width: '140px',
    },
    {
      header: 'Customer Name',
      accessor: 'customerName',
      width: '180px',
    },
    {
      header: 'CNIC',
      accessor: 'customerCnic',
      width: '140px',
    },
    {
      header: 'Product',
      accessor: 'productName',
      width: '200px',
      render: (challan: DeliveryChallan) => (
        <div>
          <p className="font-medium text-gray-900">{challan.productName}</p>
          <p className="text-xs text-gray-500">{challan.productBrand}</p>
        </div>
      ),
    },
    {
      header: 'Serial Number',
      accessor: 'productSerialNumber',
      width: '130px',
      render: (challan: DeliveryChallan) => (
        <span className="text-sm font-mono text-gray-600">
          {challan.productSerialNumber || 'N/A'}
        </span>
      ),
    },
    {
      header: 'City',
      accessor: 'customerCity',
      width: '120px',
    },
    {
      header: 'Courier',
      accessor: 'courierName',
      width: '120px',
    },
    {
      header: 'Tracking Number',
      accessor: 'trackingNumber',
      width: '150px',
      render: (challan: DeliveryChallan) => (
        <span className="text-sm font-mono text-blue-600">
          {challan.trackingNumber}
        </span>
      ),
    },
    {
      header: 'Challan Date',
      accessor: 'challanDate',
      width: '120px',
      render: (challan: DeliveryChallan) => new Date(challan.challanDate).toLocaleDateString(),
    },
    {
      header: 'Dispatch Date',
      accessor: 'dispatchDate',
      width: '120px',
      render: (challan: DeliveryChallan) => new Date(challan.dispatchDate).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: '_id',
      width: '150px',
      render: (challan: DeliveryChallan) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewChallan(challan);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="View PDF"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(challan);
            }}
            className="text-green-600 hover:text-green-800"
            title="Download PDF"
          >
            <Download size={18} />
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
            <h1 className="text-2xl font-bold text-gray-900">Delivery Challans</h1>
            <p className="text-gray-600 mt-1">View and manage all delivery challans</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by challan number, customer name, CNIC, or tracking number..."
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
              <Loader size="lg" text="Loading delivery challans..." />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={challans}
                emptyMessage="No delivery challans found"
              />

              {/* Pagination */}
              {challans.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Left: Results info */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                        <span className="font-medium">{totalRecords}</span> results
                      </div>

                      {/* Records per page selector */}
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

                    {/* Right: Page navigation */}
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

                      {/* Page Numbers */}
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
      </div>
    </AdminLayout>
  );
};

export default DeliveryChallansPage;

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Loader } from '@/components';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';

const PrintChallansContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const fetchCombinedPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const type = searchParams.get('type'); // 'bank' or 'bip'
        const idsParam = searchParams.get('ids');

        if (!type || !idsParam) {
          setError('Missing required parameters');
          setIsLoading(false);
          return;
        }

        const orderIds = idsParam.split(',').filter(id => id.trim() !== '');
        setOrderCount(orderIds.length);

        // Prepare request based on type
        const requestData: any = {};
        if (type === 'bank') {
          requestData.bankOrderIds = orderIds;
        } else if (type === 'bip') {
          requestData.bipOrderIds = orderIds;
        }

        // Call bulk download API
        const blob = await deliveryService.bulkDownload(requestData);

        // Create object URL from blob
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error: any) {
        console.error('Failed to fetch combined PDF:', error);
        setError(error.message || 'Failed to load delivery challans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombinedPDF();

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [searchParams]);

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `delivery-challans-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Loading delivery challans...</p>
          <p className="mt-2 text-sm text-gray-500">Combining {orderCount} challan{orderCount !== 1 ? 's' : ''}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium mb-2">Error Loading Challans</p>
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              <ArrowLeft size={20} className="mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No delivery challans to display</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Controls - Hidden when printing */}
      <div className="no-print bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Combined Delivery Challans ({orderCount})
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                All {orderCount} delivery challan{orderCount !== 1 ? 's' : ''} combined into one document
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft size={20} className="mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download size={20} className="mr-2" />
                Download
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                <Printer size={20} className="mr-2" />
                Print All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner - Hidden when printing */}
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Printer className="text-green-600 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-green-900">
                All delivery challans have been combined successfully!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Click "Print All" to print the combined document, or "Download" to save it to your computer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="pdf-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            id="pdf-iframe"
            src={pdfUrl}
            className="pdf-iframe w-full"
            style={{ height: 'calc(100vh - 250px)', minHeight: '600px', border: 'none' }}
            title="Combined Delivery Challans"
          />
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          .no-print {
            display: none !important;
          }

          .pdf-container,
          .pdf-container * {
            visibility: visible;
          }

          .pdf-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
          }

          .pdf-iframe {
            width: 100% !important;
            height: 100vh !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

const PrintChallansPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PrintChallansContent />
    </Suspense>
  );
};

export default PrintChallansPage;

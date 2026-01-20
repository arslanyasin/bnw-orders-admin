'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { bankOrderService } from '@/services/bankOrderService';
import { bipService } from '@/services/bipService';
import { BankOrder, BipOrder } from '@/types';
import { Loader } from '@/components';

const PrintLabelsContent = () => {
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // 'bank' or 'bip'
  const ids = searchParams.get('ids');

  const [labelUrls, setLabelUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLabelUrls = async () => {
      try {
        if (!ids || !type) {
          setError('Missing order IDs or type');
          setIsLoading(false);
          return;
        }

        const orderIds = ids.split(',');
        const urls: string[] = [];

        // Fetch orders based on type
        if (type === 'bank') {
          for (const orderId of orderIds) {
            try {
              const response = await bankOrderService.getById(orderId);
              const order = response.data;

              if (order && order.shipmentId && typeof order.shipmentId === 'object') {
                const consignmentNo = order.shipmentId.consignmentNumber;
                if (consignmentNo) {
                  // TCS label URL
                  const labelUrl = `https://ociconnect.tcscourier.com/ecom/api/print/label?accesstoken=P%252FREqsxCAsG8lc1yIuJssO%252B74fL25IdfkxKRDDXopCELAHML%252B8DSn8SoAQ%252FVn589PJe3n%252BPeE94MESISWxDTE7jyoBZhaIrk1wfA0w9Z%252BKse2qHwdlovntjsC9oOJI7jJc5RVKGLzIdjnf33l3uOggf8ZeMjlcYdofY8u%252B7AO%252Fp7WijSPE66%252FUNHZb9twvxj&consignmentno=${consignmentNo}&shipperDetails=false&printtype=2`;
                  urls.push(labelUrl);
                }
              }
            } catch (err) {
              console.error(`Error fetching bank order ${orderId}:`, err);
            }
          }
        } else if (type === 'bip') {
          for (const orderId of orderIds) {
            try {
              const response = await bipService.getById(orderId);
              const order = response.data;

              if (order && order.shipmentId && typeof order.shipmentId === 'object') {
                const consignmentNo = order.shipmentId.consignmentNumber;
                if (consignmentNo) {
                  // TCS label URL
                  const labelUrl = `https://ociconnect.tcscourier.com/ecom/api/print/label?accesstoken=P%252FREqsxCAsG8lc1yIuJssO%252B74fL25IdfkxKRDDXopCELAHML%252B8DSn8SoAQ%252FVn589PJe3n%252BPeE94MESISWxDTE7jyoBZhaIrk1wfA0w9Z%252BKse2qHwdlovntjsC9oOJI7jJc5RVKGLzIdjnf33l3uOggf8ZeMjlcYdofY8u%252B7AO%252Fp7WijSPE66%252FUNHZb9twvxj&consignmentno=${consignmentNo}&shipperDetails=false&printtype=2`;
                  urls.push(labelUrl);
                }
              }
            } catch (err) {
              console.error(`Error fetching BIP order ${orderId}:`, err);
            }
          }
        }

        if (urls.length === 0) {
          setError('No labels found for the selected orders');
        } else {
          setLabelUrls(urls);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading labels:', err);
        setError(err.message || 'Failed to load labels');
        setIsLoading(false);
      }
    };

    fetchLabelUrls();
  }, [ids, type]);

  useEffect(() => {
    // Auto-print when labels are loaded
    if (!isLoading && labelUrls.length > 0 && !error) {
      // Small delay to ensure iframes are loaded
      setTimeout(() => {
        window.print();
      }, 2000);
    }
  }, [isLoading, labelUrls, error]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Labels</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="Loading labels..." />
      </div>
    );
  }

  return (
    <div className="print-labels-container">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-labels-container {
            width: 100%;
          }
          .labels-content {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 10px;
          }
          iframe {
            width: 100%;
            height: 400px;
            border: none;
            page-break-inside: avoid;
          }
        }
        @media screen {
          .labels-content {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            padding: 1rem;
          }
          iframe {
            width: 100%;
            height: 500px;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>

      <div className="no-print p-4 bg-gray-100 border-b border-gray-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Print TCS Labels</h1>
            <p className="text-sm text-gray-600 mt-1">
              {labelUrls.length} label{labelUrls.length !== 1 ? 's' : ''} loaded
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print All
            </button>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="labels-content">
        {labelUrls.map((url, index) => (
          <iframe
            key={index}
            src={url}
            title={`TCS Label ${index + 1}`}
            className="label-iframe"
          />
        ))}
      </div>
    </div>
  );
};

const PrintLabelsPage = () => {
  return (
    <Suspense fallback={<Loader size="lg" text="Loading..." />}>
      <PrintLabelsContent />
    </Suspense>
  );
};

export default PrintLabelsPage;

import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { BipOrder } from '@/types';
import { MessageCircle } from 'lucide-react';

interface BipOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: BipOrder | null;
  onAddComment: (orderId: string, comment: string) => Promise<void>;
  isAddingComment?: boolean;
}

const BipOrderDetailModal: React.FC<BipOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onAddComment,
  isAddingComment = false,
}) => {
  const [comment, setComment] = useState('');

  if (!order) return null;

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;

    await onAddComment(order._id, comment.trim());
    setComment('');
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'confirmed':
      case 'processing':
      case 'dispatched':
      case 'shipped':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BIP Order Details" size="lg">
      <div className="space-y-6">
        {/* Order Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">EFORMS</label>
            <p className="text-gray-900 font-medium">{order.eforms}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {order.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Order Date</label>
            <p className="text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">PO Number</label>
            <p className="text-gray-900">{order.poNumber}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">CNIC</label>
              <p className="text-gray-900">{order.cnic}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Mobile</label>
              <p className="text-gray-900">{order.mobile1 || order.mobile}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Authorized Receiver</label>
              <p className="text-gray-900">{order.authorizedReceiver || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Receiver CNIC</label>
              <p className="text-gray-900">{order.receiverCnic || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900">{order.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">City</label>
              <p className="text-gray-900">{order.city}</p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Product</label>
              <p className="text-gray-900">{order.product}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Gift Code</label>
              <p className="text-gray-900">{order.giftCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Color</label>
              <p className="text-gray-900">{order.color || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Quantity</label>
              <p className="text-gray-900">{order.qty}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-green-600 font-semibold">
                {order.amount ? order.amount.toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Shipment Information */}
        {order.shipmentId && typeof order.shipmentId === 'object' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Courier</label>
                <p className="text-gray-900">
                  {order.shipmentId.courierId && typeof order.shipmentId.courierId === 'object'
                    ? order.shipmentId.courierId.courierName
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                <p className="text-gray-900">{order.shipmentId.trackingNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Consignment Number</label>
                <p className="text-gray-900">{order.shipmentId.consignmentNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shipment Status</label>
                <p className="text-gray-900 capitalize">{order.shipmentId.status || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Challan */}
        {order.deliveryChallan && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Challan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Challan Number</label>
                <p className="text-gray-900">{order.deliveryChallan.challanNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Challan Date</label>
                <p className="text-gray-900">
                  {new Date(order.deliveryChallan.challanDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Comment Section */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Comment</h3>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isAddingComment}
          />
          <div className="flex justify-end mt-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitComment}
              disabled={isAddingComment || !comment.trim()}
              isLoading={isAddingComment}
            >
              Add Comment
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BipOrderDetailModal;

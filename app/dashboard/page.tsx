'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Loader } from '@/components';
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Users
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { ComprehensiveStats } from '@/types';

type OrderTypeTab = 'all' | 'bank_orders' | 'bip_orders';

const DashboardPage = () => {
  const [stats, setStats] = useState<ComprehensiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTypeTab>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchComprehensiveStats();
  }, [activeTab, startDate, endDate]);

  const fetchComprehensiveStats = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getComprehensiveStats({
        orderType: activeTab,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setStats(response.data || null);
    } catch (error: any) {
      console.error('Failed to fetch comprehensive stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader size="lg" text="Loading dashboard..." />
        </div>
      </AdminLayout>
    );
  }

  const topCards = [
    {
      title: 'Total Orders Today',
      value: stats?.topCards.totalOrdersToday || 0,
      icon: <Package size={20} />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Awaiting Confirmation',
      value: stats?.topCards.awaitingConfirmation || 0,
      icon: <Clock size={20} />,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Pending Purchase',
      value: stats?.topCards.pendingPurchase || 0,
      icon: <ShoppingCart size={20} />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Pending Dispatch',
      value: stats?.topCards.pendingDispatch || 0,
      icon: <Truck size={20} />,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Delivered Today',
      value: stats?.topCards.deliveredToday || 0,
      icon: <CheckCircle size={20} />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Cancelled Orders',
      value: stats?.topCards.cancelledOrders || 0,
      icon: <XCircle size={20} />,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
  ];

  return (
    <AdminLayout>
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Comprehensive view of your order management system</p>
        </div>

        {/* Tabs and Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Order Type Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setActiveTab('bank_orders')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'bank_orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bank Orders
              </button>
              <button
                onClick={() => setActiveTab('bip_orders')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'bip_orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                BIP Orders
              </button>
            </div>

            {/* Date Filters */}
            <div className="flex gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {topCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} border ${card.borderColor} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`${card.iconColor}`}>{card.icon}</div>
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-700">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats?.pipeline && Object.entries(stats.pipeline).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-2">
                  <div className="text-3xl font-bold text-blue-600">{value.count}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1 capitalize">
                    {key}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{value.percentage}% of total</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pending Aging */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-600" />
              Pending Orders Aging
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">0-1 Hour</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats?.pendingAging.zeroToOneHour || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">1-4 Hours</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats?.pendingAging.oneToFourHours || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">4-24 Hours</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats?.pendingAging.fourToTwentyFourHours || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">&gt;24 Hours</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats?.pendingAging.moreThanTwentyFourHours || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Financial Overview
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Orders Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats?.financialOverview.totalOrdersValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Pending Purchase Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats?.financialOverview.pendingPurchaseValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Pending Dispatch Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats?.financialOverview.pendingDispatchValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Delivered Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats?.financialOverview.deliveredValue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Team Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={20} className="text-blue-600" />
            Dispatch Team Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Courier</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Pending</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Dispatched</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Dispatch Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.dispatchTeam.map((team, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {team.courierName || 'Not Assigned'}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-orange-600">
                      {team.pending}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-green-600">
                      {team.dispatched}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">
                      {team.avgDispatch}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Performance */}
        {activeTab !== 'bip_orders' && stats?.bankPerformance && stats.bankPerformance.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              Bank Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bank</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Confirmed %</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cancel Rate %</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bankPerformance.map((bank, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {bank.bankName}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {bank.orders}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-medium text-green-600">
                        {bank.confirmedPercentage.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-medium text-red-600">
                        {bank.cancelRate.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {bank.avgDelivery}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Products with Delays */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={20} className="text-red-600" />
            Top Products with Purchase Delays
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Orders</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Pending Purchase</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Delay %</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topProductsDelays.slice(0, 10).map((product, index) => {
                  const delayPercentage = ((product.pendingPurchase / product.ordersCount) * 100).toFixed(1);
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {product.product}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {product.ordersCount}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-medium text-orange-600">
                        {product.pendingPurchase}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`text-sm font-medium ${
                          parseFloat(delayPercentage) > 50 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {delayPercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;

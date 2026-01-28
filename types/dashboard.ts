export interface DashboardStats {
  bankOrders: {
    total: number;
    completed: number;
    active: number;
  };
  products: {
    total: number;
    inStock: number;
    active: number;
  };
  vendors: {
    total: number;
    newVendors: number;
    active: number;
  };
  purchaseOrders: {
    total: number;
    capacityPercentage: number;
    active: number;
  };
}

export interface ComprehensiveStats {
  topCards: {
    totalOrdersToday: number;
    awaitingConfirmation: number;
    pendingPurchase: number;
    pendingDispatch: number;
    deliveredToday: number;
    cancelledOrders: number;
  };
  pipeline: {
    imported: {
      count: number;
      percentage: number;
    };
    confirmed: {
      count: number;
      percentage: number;
    };
    purchased: {
      count: number;
      percentage: number;
    };
    dispatched: {
      count: number;
      percentage: number;
    };
    delivered: {
      count: number;
      percentage: number;
    };
  };
  pendingAging: {
    zeroToOneHour: number;
    oneToFourHours: number;
    fourToTwentyFourHours: number;
    moreThanTwentyFourHours: number;
  };
  dispatchTeam: Array<{
    _id: string | null;
    pending: number;
    dispatched: number;
    courierName: string | null;
    avgDispatch: string;
  }>;
  bankPerformance: Array<{
    _id: string;
    bankName: string;
    orders: number;
    confirmedPercentage: number;
    cancelRate: number;
    avgDelivery: string;
  }>;
  topProductsDelays: Array<{
    _id: string;
    ordersCount: number;
    pendingPurchase: number;
    product: string;
  }>;
  financialOverview: {
    totalOrdersValue: number;
    pendingPurchaseValue: number;
    pendingDispatchValue: number;
    deliveredValue: number;
  };
}

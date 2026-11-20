// File: /types/admin.ts

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'out_of_stock';
}

export interface AdminStats {
  revenue: {
    total: number;
    growth: number;
    series: number[];
  };
  orders: {
    total: number;
    growth: number;
    series: number[];
  };
  customers: {
    total: number;
    growth: number;
  };
  avgOrderValue: {
    amount: number;
    growth: number;
  };
}

export interface SalesPerformanceLastOrder {
  id: number | string;
  customer_name?: string | null;
  customer_email?: string | null;
  sale_date?: string | null;
  created_at?: string | null;
  total_amount: number | string;
}

export interface SalesPerformanceOverview {
  total_orders: number;
  total_revenue: number | string;
  average_order_value: number | string;
}

export interface SalesPerformanceComparison {
  order_growth_percentage?: number | null;
  revenue_growth_percentage?: number | null;
}

export interface SalesPerformanceDailyPoint {
  date?: string;
  revenue?: number | string;
  order_count?: number;
}

export interface SalesPerformanceReport {
  overview?: SalesPerformanceOverview;
  comparison?: SalesPerformanceComparison;
  daily_trend?: SalesPerformanceDailyPoint[];
  today_orders?: number | null;
  last_order?: SalesPerformanceLastOrder | null;
}


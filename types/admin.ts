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

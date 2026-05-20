import { defineStore } from 'pinia';
import type { Order, Customer, AdminStats, InventoryAlert } from '@/types';
import { useProductService } from '@/composables/useProductService';

export const useAdminStore = defineStore('admin', {
  state: () => {
    const productService = useProductService();
    return {
    stats: {
      revenue: {
        total: 1284500,
        growth: 12.5,
        series: [45000, 52000, 48000, 61000, 55000, 65000, 72000]
      },
      orders: {
        total: 1245,
        growth: 8.2,
        series: [120, 145, 132, 168, 150, 180, 195]
      },
      customers: {
        total: 8450,
        growth: 15.4
      },
      avgOrderValue: {
        amount: 1031.7,
        growth: 4.1
      }
    } as AdminStats,
    
    recentOrders: [
      {
        id: 'ord_1',
        orderNumber: 'TC-9852',
        customerName: 'Alex Rivera',
        customerId: 'usr_1',
        totalAmount: 1299.99,
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        createdAt: '2024-05-18T14:30:00Z',
        items: [],
        shippingAddress: {
          street: '123 Enterprise Way',
          city: 'San Francisco',
          zipCode: '94105',
          country: 'USA'
        }
      },
      {
        id: 'ord_2',
        orderNumber: 'TC-9853',
        customerName: 'Sarah Jenkins',
        customerId: 'usr_2',
        totalAmount: 3450.50,
        status: 'processing' as const,
        paymentStatus: 'paid' as const,
        createdAt: '2024-05-19T09:15:00Z',
        items: [],
        shippingAddress: {
          street: '456 Tech Lane',
          city: 'Austin',
          zipCode: '78701',
          country: 'USA'
        }
      },
      {
        id: 'ord_3',
        orderNumber: 'TC-9854',
        customerName: 'Michael Chen',
        customerId: 'usr_3',
        totalAmount: 450.00,
        status: 'pending' as const,
        paymentStatus: 'unpaid' as const,
        createdAt: '2024-05-19T10:45:00Z',
        items: [],
        shippingAddress: {
          street: '789 Innovation Blvd',
          city: 'Seattle',
          zipCode: '98101',
          country: 'USA'
        }
      }
    ] as Order[],

    inventoryAlerts: [
      {
        productId: 'prod_1',
        productName: 'RTX 4090 Extreme Edition',
        currentStock: 3,
        threshold: 5,
        status: 'low'
      },
      {
        productId: 'prod_5',
        productName: 'Core i9-14900K',
        currentStock: 0,
        threshold: 10,
        status: 'out_of_stock'
      }
    ] as InventoryAlert[],

    customers: [
      {
        id: 'usr_1',
        name: 'Alex Rivera',
        email: 'alex@enterprise.com',
        role: 'customer',
        joinedAt: '2023-01-15',
        totalOrders: 12,
        totalSpent: 15400.50,
        status: 'active'
      },
      {
        id: 'usr_2',
        name: 'Sarah Jenkins',
        email: 'sarah.j@tech.io',
        role: 'customer',
        joinedAt: '2023-03-22',
        totalOrders: 5,
        totalSpent: 8900.00,
        status: 'active'
      }
    ] as Customer[]
    };
  },

  actions: {
    updateOrderStatus(orderId: string, status: Order['status']) {
      const order = this.recentOrders.find(o => o.id === orderId);
      if (order) order.status = status;
    },
    
    deleteProduct(productId: string) {
      // In a real app, this would call the API
      console.log(`Deleting product ${productId}`);
    },

    fetchStats() {
      // In a real app, this would call the API to refresh metrics
      console.log('Fetching latest system metrics...');
    }
  }
});

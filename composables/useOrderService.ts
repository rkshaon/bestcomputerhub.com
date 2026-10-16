// File: /composables/useOrderService.ts
import { useApiClient } from './useApiClient';
import type { Order } from '@/types/order';

export const useOrderService = () => {
  const apiClient = useApiClient();

  const getOrders = async (params: { page?: number; page_size?: number } = {}): Promise<{ results: Order[]; count: number }> => {
    try {
      const data = await apiClient.request<any>('/api/v1/orders/', {
        method: 'GET',
        query: params
      });
      const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const count = typeof data?.count === 'number' ? data.count : results.length;
      return { results, count };
    } catch (err: any) {
      throw err;
    }
  };

  const getOrderDetails = async (orderId: string): Promise<Order> => {
    try {
      const data = await apiClient.request<Order>(`/api/v1/orders/${orderId}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const cancelOrder = async (orderId: string): Promise<Order> => {
    try {
      const data = await apiClient.request<Order>(`/api/v1/orders/${orderId}/cancel/`, {
        method: 'POST'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    getOrders,
    getOrderDetails,
    cancelOrder,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

// File: /composables/useSalesService.ts
import { useApiClient } from './useApiClient';
import type { Order, OrderStatusResponse } from '@/types/order';
import { mapOrderSummary } from '@/utils/order';

export const useSalesService = () => {
  const apiClient = useApiClient();

  const getSales = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<{ results: Order[]; count: number }> => {
    try {
      const data = await apiClient.request<any>('/api/v1/sales/', {
        method: 'GET',
        query: params
      });
      const results = Array.isArray(data?.results) ? data.results.map(mapOrderSummary) : (Array.isArray(data) ? data.map(mapOrderSummary) : []);
      const count = typeof data?.count === 'number' ? data.count : results.length;
      return { results, count };
    } catch (err: any) {
      throw err;
    }
  };

  const getStatuses = async (): Promise<OrderStatusResponse> => {
    try {
      const data = await apiClient.request<OrderStatusResponse>('/api/v1/sales/statuses/', {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const getSaleDetails = async (saleId: string): Promise<Order> => {
    try {
      const data = await apiClient.request<Order>(`/api/v1/sales/${saleId}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateStatus = async (saleId: string, status: string): Promise<Order> => {
    try {
      const data = await apiClient.request<Order>(`/api/v1/sales/${saleId}/update-status/`, {
        method: 'POST',
        body: { status }
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const markPaid = async (saleId: string): Promise<Order> => {
    try {
      const data = await apiClient.request<Order>(`/api/v1/sales/${saleId}/mark-paid/`, {
        method: 'POST'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    getSales,
    getStatuses,
    getSaleDetails,
    updateStatus,
    markPaid,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

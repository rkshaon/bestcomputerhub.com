// File: /composables/useSalesService.ts
import { useApiClient } from './useApiClient';
import type { Order } from '@/types/order';

export const useSalesService = () => {
  const apiClient = useApiClient();

  const getSales = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<{ results: Order[]; count: number }> => {
    try {
      const data = await apiClient.request<{ results: Order[]; count: number }>('/api/v1/sales/', {
        method: 'GET',
        query: params
      });
      return data || { results: [], count: 0 };
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
    getSaleDetails,
    updateStatus,
    markPaid,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

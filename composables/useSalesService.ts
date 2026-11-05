// File: /composables/useSalesService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { Order, OrderStatusResponse } from '@/types/order';
import type { BackendOrderDetail } from '@/types/checkout';
import { mapOrderSummary, mapOrderDetail } from '@/utils/order';

export const pendingOrdersCount = ref<number | null>(null);

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

  const getPendingOrdersCount = async (): Promise<number> => {
    try {
      const response = await apiClient.request<any>('/api/v1/sales/pending-count/', {
        method: 'GET'
      });
      const count = typeof response?.data?.pending_orders === 'number'
        ? response.data.pending_orders
        : (typeof response?.pending_orders === 'number' ? response.pending_orders : 0);
      pendingOrdersCount.value = count;
      return count;
    } catch {
      if (pendingOrdersCount.value === null) {
        pendingOrdersCount.value = 0;
      }
      return pendingOrdersCount.value || 0;
    }
  };

  const getSaleDetails = async (saleId: string): Promise<Order> => {
    try {
      const data = await apiClient.request<BackendOrderDetail>(`/api/v1/sales/${saleId}/`, {
        method: 'GET'
      });
      return mapOrderDetail(data);
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
      getPendingOrdersCount().catch(() => {});
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
      getPendingOrdersCount().catch(() => {});
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const getSalesSummary = async (): Promise<{ data: Record<string, number> }> => {
    try {
      const data = await apiClient.request<{ success: boolean; data: Record<string, number> }>('/api/v1/sales/summary/', {
        method: 'GET'
      });
      return { data: data.data };
    } catch (err: any) {
      throw err;
    }
  };

  const getSalesPerformance = async (days: number = 90): Promise<any> => {
    try {
      const response = await apiClient.request<any>('/api/v1/sales/reports/performance/', {
        method: 'GET',
        query: { days }
      });
      return response?.data || response;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    getSales,
    getStatuses,
    getPendingOrdersCount,
    getSaleDetails,
    updateStatus,
    markPaid,
    getSalesSummary,
    getSalesPerformance,
    pendingOrdersCount,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

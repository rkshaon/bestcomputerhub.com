// File: /composables/useOrderService.ts
import { useApiClient } from './useApiClient';
import { mapOrderDetail, mapOrderSummary } from '@/utils/order';
import type { Order } from '@/types/order';
import type {
  BackendOrderCancelResponse,
  BackendOrderDetail,
  BackendOrderSummary
} from '@/types/checkout';

/**
 * Customer-facing storefront orders.
 * Contract: ZayrahLife-Backend/docs/checkout-api.md (sections 3–5)
 */
export const useOrderService = () => {
  const apiClient = useApiClient();

  /**
   * GET /api/v1/orders/ — the customer's own orders, newest first.
   * The backend returns a plain, unpaginated array.
   */
  const getOrders = async (): Promise<{ results: Order[]; count: number }> => {
    const data = await apiClient.request<BackendOrderSummary[] | { results: BackendOrderSummary[]; count?: number }>(
      '/api/v1/orders/',
      { method: 'GET' }
    );
    const rows: BackendOrderSummary[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    const results = rows.map(mapOrderSummary);
    return { results, count: results.length };
  };

  /** GET /api/v1/orders/{id}/ */
  const getOrderDetails = async (orderId: string | number): Promise<Order> => {
    const data = await apiClient.request<BackendOrderDetail>(`/api/v1/orders/${orderId}/`, {
      method: 'GET'
    });
    return mapOrderDetail(data);
  };

  /**
   * POST /api/v1/orders/{id}/cancel/
   * Only PENDING orders can be cancelled. Returns the backend's short
   * `{ id, status, message }` response; refetch the order for its full state.
   */
  const cancelOrder = async (orderId: string | number): Promise<BackendOrderCancelResponse> => {
    return apiClient.request<BackendOrderCancelResponse>(`/api/v1/orders/${orderId}/cancel/`, {
      method: 'POST'
    });
  };

  return {
    getOrders,
    getOrderDetails,
    cancelOrder,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

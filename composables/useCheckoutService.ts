// File: /composables/useCheckoutService.ts
import { useApiClient } from './useApiClient';
import { mapOrderDetail } from '@/utils/order';
import type { Order } from '@/types/order';
import type {
  BackendOrderDetail,
  CheckoutConfirmPayload,
  CheckoutValidatePayload,
  CheckoutValidateResponse
} from '@/types/checkout';

/**
 * Storefront checkout operations.
 * Contract: ZayrahLife-Backend/docs/checkout-api.md
 */
export const useCheckoutService = () => {
  const apiClient = useApiClient();

  /**
   * POST /api/v1/checkout/validate/
   * Prices the active cart for an address and shipping method.
   * Creates nothing. Returns 200 even when `is_valid` is false.
   */
  const validateCheckout = async (payload: CheckoutValidatePayload): Promise<CheckoutValidateResponse> => {
    const data = await apiClient.request<CheckoutValidateResponse>('/api/v1/checkout/validate/', {
      method: 'POST',
      body: payload
    });
    return {
      is_valid: !!data?.is_valid,
      cart: data?.cart ?? null,
      pricing: data?.pricing ?? null,
      shipping: data?.shipping ?? null,
      errors: Array.isArray(data?.errors) ? data.errors : []
    };
  };

  /**
   * POST /api/v1/checkout/confirm/
   * Places the order (Cash on Delivery) from the active cart.
   * The same `idempotency_key` must be reused for retries of one attempt.
   * Returns the created (or replayed) order; inspect `status`, since a
   * replay may return an already cancelled order.
   */
  const createOrder = async (payload: CheckoutConfirmPayload): Promise<Order> => {
    const data = await apiClient.request<BackendOrderDetail>('/api/v1/checkout/confirm/', {
      method: 'POST',
      body: payload,
      headers: {
        'Idempotency-Key': payload.idempotency_key
      }
    });
    return mapOrderDetail(data);
  };

  /** GET /api/v1/orders/{id}/ */
  const getOrderDetails = async (orderId: string | number): Promise<Order> => {
    const data = await apiClient.request<BackendOrderDetail>(`/api/v1/orders/${orderId}/`, {
      method: 'GET'
    });
    return mapOrderDetail(data);
  };

  /** One UUID per checkout attempt. */
  const generateIdempotencyKey = (): string => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  return {
    validateCheckout,
    createOrder,
    getOrderDetails,
    generateIdempotencyKey,
    isLoading: apiClient.isLoading,
    errorMsg: apiClient.errorMsg
  };
};

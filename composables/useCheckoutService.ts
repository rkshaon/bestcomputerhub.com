// File: /composables/useCheckoutService.ts
import { useApiClient } from './useApiClient';

export interface CheckoutValidationPayload {
  shipping_address_id: number | string;
  shipping_method_id: number | string;
}

export interface CheckoutValidationResponse {
  valid: boolean;
  subtotal: number;
  shipping_charge: number;
  discount: number;
  tax: number;
  grand_total: number;
  messages?: string[];
}

export interface CreateOrderPayload {
  shipping_address_id: number | string;
  shipping_method_id: number | string;
  payment_method: string;
  payment_details?: any;
}

export const useCheckoutService = () => {
  const apiClient = useApiClient();

  const validateCheckout = async (payload: CheckoutValidationPayload): Promise<CheckoutValidationResponse> => {
    try {
      const data = await apiClient.request<CheckoutValidationResponse>('/api/v1/checkout/validate/', {
        method: 'POST',
        body: payload
      });
      return data || { valid: true, subtotal: 0, shipping_charge: 0, discount: 0, tax: 0, grand_total: 0 };
    } catch (err: any) {
      throw err;
    }
  };

  const createOrder = async (payload: CreateOrderPayload, idempotencyKey: string): Promise<any> => {
    try {
      const data = await apiClient.request<any>('/api/v1/checkout/confirm/', {
        method: 'POST',
        body: payload,
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const getOrderDetails = async (orderId: string): Promise<any> => {
    try {
      const data = await apiClient.request<any>(`/api/v1/orders/${orderId}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const generateIdempotencyKey = () => {
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

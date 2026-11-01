// File: /composables/useOrderNotificationService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type {
  OrderNotificationRecipient,
  OrderNotificationRecipientQueryParams,
  PaginatedOrderNotificationRecipients,
  CreateOrderNotificationRecipientPayload,
  UpdateOrderNotificationRecipientPayload
} from '@/types';

const RECIPIENTS_ENDPOINT = '/api/v1/email/order-notification-recipients/';

/**
 * Admin management of the internal addresses that receive order
 * placed / cancelled notifications. The backend decides who is
 * notified and when; this service only manages the list.
 */
export const useOrderNotificationService = () => {
  const apiClient = useApiClient();
  const errorMsg = ref<string | null>(null);

  const getRecipients = async (
    params: OrderNotificationRecipientQueryParams = {}
  ): Promise<PaginatedOrderNotificationRecipients> => {
    errorMsg.value = null;
    const query: Record<string, string | number | boolean> = {};
    if (params.page) query.page = params.page;
    if (params.page_size) query.page_size = params.page_size;
    if (params.search?.trim()) query.search = params.search.trim();
    if (params.is_active !== undefined) query.is_active = params.is_active;

    try {
      const data = await apiClient.request<PaginatedOrderNotificationRecipients>(RECIPIENTS_ENDPOINT, {
        method: 'GET',
        params: query
      });
      return {
        count: data?.count ?? 0,
        next: data?.next ?? null,
        previous: data?.previous ?? null,
        results: data?.results ?? []
      };
    } catch (err: unknown) {
      errorMsg.value = extractErrorMessage(err, 'Failed to load order notification recipients.');
      throw err;
    }
  };

  const createRecipient = (payload: CreateOrderNotificationRecipientPayload): Promise<OrderNotificationRecipient> =>
    apiClient.request<OrderNotificationRecipient>(RECIPIENTS_ENDPOINT, {
      method: 'POST',
      body: payload
    });

  const updateRecipient = (
    id: number,
    payload: UpdateOrderNotificationRecipientPayload
  ): Promise<OrderNotificationRecipient> =>
    apiClient.request<OrderNotificationRecipient>(`${RECIPIENTS_ENDPOINT}${id}/`, {
      method: 'PATCH',
      body: payload
    });

  const deleteRecipient = (id: number): Promise<void> =>
    apiClient.request<void>(`${RECIPIENTS_ENDPOINT}${id}/`, {
      method: 'DELETE'
    });

  return {
    getRecipients,
    createRecipient,
    updateRecipient,
    deleteRecipient,
    errorMsg
  };
};

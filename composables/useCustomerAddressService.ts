// File: /composables/useCustomerAddressService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type {
  CustomerAddress,
  CustomerAddressQueryParams,
  PaginatedCustomerAddresses,
  CreateCustomerAddressPayload,
  UpdateCustomerAddressPayload
} from '@/types';

export const useCustomerAddressService = () => {
  const apiClient = useApiClient();

  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const errorMsg = ref<string | null>(null);

  /**
   * Fetches paginated customer addresses from GET /api/v1/customer-addresses/
   */
  const getCustomerAddresses = async (params: CustomerAddressQueryParams = {}): Promise<PaginatedCustomerAddresses> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const queryParams = new URLSearchParams();
      if (params.page && params.page > 0) {
        queryParams.append('page', params.page.toString());
      }
      if (params.page_size && params.page_size > 0) {
        queryParams.append('page_size', params.page_size.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/v1/customer-addresses/?${queryString}` : '/api/v1/customer-addresses/';

      const data = await apiClient.request<PaginatedCustomerAddresses>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        return {
          count: typeof data.count === 'number' ? data.count : data.results.length,
          next: data.next || null,
          previous: data.previous || null,
          results: data.results
        };
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (err: any) {
      const parsedError = extractErrorMessage(err, 'Failed to fetch saved addresses.');
      errorMsg.value = parsedError;
      isLoading.value = false;
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    }
  };

  /**
   * Creates a new customer address via POST /api/v1/customer-addresses/
   */
  const createCustomerAddress = async (payload: CreateCustomerAddressPayload): Promise<CustomerAddress | null> => {
    isCreating.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<CustomerAddress>('/api/v1/customer-addresses/', {
        method: 'POST',
        body: payload
      });

      isCreating.value = false;
      return data || null;
    } catch (err: any) {
      const parsedError = extractErrorMessage(err, 'Failed to create address.');
      errorMsg.value = parsedError;
      isCreating.value = false;
      throw err;
    }
  };

  /**
   * Partially updates an address via PATCH /api/v1/customer-addresses/{id}/
   * (e.g. tagging a saved address with a delivery zone). Returns the detail
   * representation.
   */
  const updateCustomerAddress = async (
    id: number,
    payload: UpdateCustomerAddressPayload
  ): Promise<CustomerAddress> => {
    isUpdating.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<CustomerAddress>(`/api/v1/customer-addresses/${id}/`, {
        method: 'PATCH',
        body: payload
      });
      isUpdating.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to update address.');
      isUpdating.value = false;
      throw err;
    }
  };

  return {
    getCustomerAddresses,
    createCustomerAddress,
    updateCustomerAddress,
    isLoading,
    isCreating,
    isUpdating,
    errorMsg
  };
};

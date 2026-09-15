// File: /composables/useCustomerService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { CustomerQueryParams, PaginatedCustomers } from '@/types';

export const useCustomerService = () => {
  const apiClient = useApiClient();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  /**
   * Fetches paginated customer records from DRF API endpoint: GET /api/v1/customers/
   */
  const getCustomers = async (params: CustomerQueryParams = {}): Promise<PaginatedCustomers> => {
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
      if (params.customer_type) {
        queryParams.append('customer_type', params.customer_type);
      }
      if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') {
        const activeVal = typeof params.is_active === 'boolean' ? String(params.is_active) : String(params.is_active).trim();
        if (activeVal === 'true' || activeVal === 'false') {
          queryParams.append('is_active', activeVal);
        }
      }
      if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/v1/customers/?${queryString}` : '/api/v1/customers/';

      const data = await apiClient.request<PaginatedCustomers>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      // Ensure valid shape fallback
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
      const parsedError = extractErrorMessage(err, 'Failed to fetch customer accounts.');
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

  return {
    getCustomers,
    isLoading,
    errorMsg
  };
};

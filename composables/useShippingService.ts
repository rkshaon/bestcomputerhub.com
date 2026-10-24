// File: /composables/useShippingService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { 
  ShippingMethod, 
  CreateShippingMethodPayload, 
  UpdateShippingMethodPayload, 
  ShippingMethodQueryParams, 
  PaginatedShippingMethods,
  ShippingZone,
  CreateShippingZonePayload,
  UpdateShippingZonePayload,
  ShippingZoneQueryParams,
  PaginatedShippingZones,
  ShippingRate,
  CreateShippingRatePayload,
  UpdateShippingRatePayload,
  ShippingRateQueryParams,
  PaginatedShippingRates,
  ShippingOption
} from '@/types';

export const useShippingService = () => {
  const apiClient = useApiClient();

  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const errorMsg = ref<string | null>(null);

  /**
   * List shipping methods with optional query parameters.
   */
  const getShippingMethods = async (params: ShippingMethodQueryParams = {}): Promise<PaginatedShippingMethods> => {
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
      if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      if (params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/v1/shipping/methods/?${queryString}` : '/api/v1/shipping/methods/';

      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          return {
            count: typeof data.count === 'number' ? data.count : data.results.length,
            next: data.next || null,
            previous: data.previous || null,
            results: data.results
          };
        } else if (Array.isArray(data)) {
          return {
            count: data.length,
            next: null,
            previous: null,
            results: data
          };
        }
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve shipping methods.');
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
   * Retrieve a specific shipping method by ID.
   */
  const getShippingMethod = async (id: number | string): Promise<ShippingMethod | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingMethod>(`/api/v1/shipping/methods/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to retrieve shipping method #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * Create a new shipping method.
   */
  const createShippingMethod = async (payload: CreateShippingMethodPayload): Promise<ShippingMethod | null> => {
    isCreating.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingMethod>('/api/v1/shipping/methods/', {
        method: 'POST',
        body: payload
      });
      isCreating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create shipping method.');
      isCreating.value = false;
      throw err;
    }
  };

  /**
   * Update an existing shipping method (PUT / PATCH).
   */
  const updateShippingMethod = async (
    id: number | string, 
    payload: UpdateShippingMethodPayload, 
    partial = false
  ): Promise<ShippingMethod | null> => {
    isUpdating.value = true;
    errorMsg.value = null;

    try {
      const method = partial ? 'PATCH' : 'PUT';
      const data = await apiClient.request<ShippingMethod>(`/api/v1/shipping/methods/${id}/`, {
        method,
        body: payload
      });
      isUpdating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to update shipping method #${id}.`);
      isUpdating.value = false;
      throw err;
    }
  };

  /**
   * Delete a shipping method.
   */
  const deleteShippingMethod = async (id: number | string): Promise<boolean> => {
    isDeleting.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request(`/api/v1/shipping/methods/${id}/`, {
        method: 'DELETE'
      });
      isDeleting.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to delete shipping method #${id}.`);
      isDeleting.value = false;
      throw err;
    }
  };

  /**
   * List shipping zones with optional query parameters.
   */
  const getShippingZones = async (params: ShippingZoneQueryParams = {}): Promise<PaginatedShippingZones> => {
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
      if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      if (params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/v1/shipping/zones/?${queryString}` : '/api/v1/shipping/zones/';

      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          return {
            count: typeof data.count === 'number' ? data.count : data.results.length,
            next: data.next || null,
            previous: data.previous || null,
            results: data.results
          };
        } else if (Array.isArray(data)) {
          return {
            count: data.length,
            next: null,
            previous: null,
            results: data
          };
        }
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve shipping zones.');
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
   * Retrieve a specific shipping zone by ID.
   */
  const getShippingZone = async (id: number | string): Promise<ShippingZone | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingZone>(`/api/v1/shipping/zones/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to retrieve shipping zone #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * Create a new shipping zone.
   */
  const createShippingZone = async (payload: CreateShippingZonePayload): Promise<ShippingZone | null> => {
    isCreating.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingZone>('/api/v1/shipping/zones/', {
        method: 'POST',
        body: payload
      });
      isCreating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create shipping zone.');
      isCreating.value = false;
      throw err;
    }
  };

  /**
   * Update an existing shipping zone (PUT / PATCH).
   */
  const updateShippingZone = async (
    id: number | string, 
    payload: UpdateShippingZonePayload, 
    partial = false
  ): Promise<ShippingZone | null> => {
    isUpdating.value = true;
    errorMsg.value = null;

    try {
      const method = partial ? 'PATCH' : 'PUT';
      const data = await apiClient.request<ShippingZone>(`/api/v1/shipping/zones/${id}/`, {
        method,
        body: payload
      });
      isUpdating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to update shipping zone #${id}.`);
      isUpdating.value = false;
      throw err;
    }
  };

  /**
   * Delete a shipping zone.
   */
  const deleteShippingZone = async (id: number | string): Promise<boolean> => {
    isDeleting.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request(`/api/v1/shipping/zones/${id}/`, {
        method: 'DELETE'
      });
      isDeleting.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to delete shipping zone #${id}.`);
      isDeleting.value = false;
      throw err;
    }
  };

  /**
   * List shipping rates with optional query parameters.
   */
  const getShippingRates = async (params: ShippingRateQueryParams = {}): Promise<PaginatedShippingRates> => {
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
      if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      if (params.zone !== undefined && params.zone !== '') {
        queryParams.append('zone', params.zone.toString());
      }
      if (params.method !== undefined && params.method !== '') {
        queryParams.append('method', params.method.toString());
      }
      if (params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/v1/shipping/rates/?${queryString}` : '/api/v1/shipping/rates/';

      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          return {
            count: typeof data.count === 'number' ? data.count : data.results.length,
            next: data.next || null,
            previous: data.previous || null,
            results: data.results
          };
        } else if (Array.isArray(data)) {
          return {
            count: data.length,
            next: null,
            previous: null,
            results: data
          };
        }
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve shipping rates.');
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
   * Retrieve a specific shipping rate by ID.
   */
  const getShippingRate = async (id: number | string): Promise<ShippingRate | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingRate>(`/api/v1/shipping/rates/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to retrieve shipping rate #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * Create a new shipping rate.
   */
  const createShippingRate = async (payload: CreateShippingRatePayload): Promise<ShippingRate | null> => {
    isCreating.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<ShippingRate>('/api/v1/shipping/rates/', {
        method: 'POST',
        body: payload
      });
      isCreating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create shipping rate.');
      isCreating.value = false;
      throw err;
    }
  };

  /**
   * Update an existing shipping rate (PUT / PATCH).
   */
  const updateShippingRate = async (
    id: number | string, 
    payload: UpdateShippingRatePayload, 
    partial = false
  ): Promise<ShippingRate | null> => {
    isUpdating.value = true;
    errorMsg.value = null;

    try {
      const method = partial ? 'PATCH' : 'PUT';
      const data = await apiClient.request<ShippingRate>(`/api/v1/shipping/rates/${id}/`, {
        method,
        body: payload
      });
      isUpdating.value = false;
      return data || null;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to update shipping rate #${id}.`);
      isUpdating.value = false;
      throw err;
    }
  };

  /**
   * Delete a shipping rate.
   */
  const deleteShippingRate = async (id: number | string): Promise<boolean> => {
    isDeleting.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request(`/api/v1/shipping/rates/${id}/`, {
        method: 'DELETE'
      });
      isDeleting.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to delete shipping rate #${id}.`);
      isDeleting.value = false;
      throw err;
    }
  };

  /**
   * Get available shipping options for a given customer address ID.
   * Endpoint: GET /api/v1/shipping/options/?address_id={address_id}
   */
  const getShippingOptions = async (addressId: number | string): Promise<ShippingOption[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<any>(`/api/v1/shipping/options/?address_id=${addressId}`, {
        method: 'GET'
      });
      isLoading.value = false;

      if (data && typeof data === 'object') {
        let rawList: any[] = [];
        if (Array.isArray(data.options)) {
          rawList = data.options;
        } else if (Array.isArray(data.results)) {
          rawList = data.results;
        } else if (Array.isArray(data)) {
          rawList = data;
        }
        return rawList.map((opt: any) => {
          const methodId = opt.method_id ?? opt.id ?? opt.shipping_method_id;
          return {
            ...opt,
            id: opt.id ?? methodId,
            method_id: methodId,
            name: opt.shipping_method_name || opt.name,
            shipping_charge: Number(opt.shipping_charge) || 0,
            base_charge: Number(opt.base_charge) || 0,
            is_free_shipping: !!opt.is_free_shipping,
            free_shipping_threshold: opt.free_shipping_threshold
          };
        });
      }
      return [];
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve shipping options.');
      isLoading.value = false;
      return [];
    }
  };

  return {
    getShippingMethods,
    getShippingMethod,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    getShippingZones,
    getShippingZone,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    getShippingRates,
    getShippingRate,
    createShippingRate,
    updateShippingRate,
    deleteShippingRate,
    getShippingOptions,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    errorMsg
  };
};

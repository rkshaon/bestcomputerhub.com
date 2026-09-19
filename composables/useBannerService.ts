// File: /composables/useBannerService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type {
  Banner,
  BannerStorefront,
  BannerPlacement,
  BannerFilters,
  StorefrontBannerFilters,
  CreateBannerPayload,
  UpdateBannerPayload,
  BannerReorderRequest,
  BannerReorderResponse,
  PaginatedResponse
} from '@/types';

export const useBannerService = () => {
  const apiClient = useApiClient();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  /**
   * Normalize an administrative Banner API response.
   */
  const mapBannerResponse = (b: any): Banner => {
    if (!b) return b;
    return {
      id: Number(b.id),
      placement: Number(b.placement ?? (typeof b.placement_id === 'number' ? b.placement_id : 0)),
      placement_name: b.placement_name !== undefined ? String(b.placement_name) : (b.placement_detail?.name ? String(b.placement_detail.name) : undefined),
      placement_code: b.placement_code !== undefined ? String(b.placement_code) : (b.placement_detail?.code ? String(b.placement_detail.code) : undefined),
      title: b.title ? String(b.title) : '',
      subtitle: b.subtitle ? String(b.subtitle) : '',
      image: b.image ? String(b.image) : '',
      mobile_image: b.mobile_image ? String(b.mobile_image) : null,
      cta_text: b.cta_text ? String(b.cta_text) : '',
      cta_url: b.cta_url ? String(b.cta_url) : '',
      display_order: b.display_order !== undefined ? Number(b.display_order) : 0,
      is_active: b.is_active !== undefined ? Boolean(b.is_active) : true,
      start_at: b.start_at ? String(b.start_at) : null,
      end_at: b.end_at ? String(b.end_at) : null,
      deleted_at: b.deleted_at ? String(b.deleted_at) : null,
      created_by: b.created_by !== undefined && b.created_by !== null ? Number(b.created_by) : null,
      updated_by: b.updated_by !== undefined && b.updated_by !== null ? Number(b.updated_by) : null,
      created_at: b.created_at ? String(b.created_at) : new Date().toISOString(),
      updated_at: b.updated_at ? String(b.updated_at) : new Date().toISOString()
    };
  };

  /**
   * Normalize a Storefront Banner API response.
   */
  const mapBannerStorefrontResponse = (b: any): BannerStorefront => {
    if (!b) return b;
    return {
      id: Number(b.id),
      title: b.title ? String(b.title) : '',
      subtitle: b.subtitle ? String(b.subtitle) : '',
      image: b.image ? String(b.image) : '',
      mobile_image: b.mobile_image ? String(b.mobile_image) : null,
      cta_text: b.cta_text ? String(b.cta_text) : '',
      cta_url: b.cta_url ? String(b.cta_url) : '',
      display_order: b.display_order !== undefined ? Number(b.display_order) : 0
    };
  };

  /**
   * Normalize a Banner Placement API response.
   */
  const mapPlacementResponse = (p: any): BannerPlacement => {
    if (!p) return p;
    return {
      id: Number(p.id),
      name: p.name ? String(p.name) : '',
      code: p.code ? String(p.code) : '',
      description: p.description ? String(p.description) : '',
      is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
      deleted_at: p.deleted_at ? String(p.deleted_at) : null,
      created_at: p.created_at ? String(p.created_at) : new Date().toISOString(),
      updated_at: p.updated_at ? String(p.updated_at) : new Date().toISOString()
    };
  };

  // ==========================================
  // 1. ADMIN BANNERS CRUD & REORDER
  // ==========================================

  /**
   * GET /api/v1/banners/
   * Fetches paginated banners with optional placement, active status, search and ordering filters.
   */
  const getBannersList = async (params: BannerFilters = {}): Promise<PaginatedResponse<Banner>> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const qParams = new URLSearchParams();
      const page = params.page || 1;
      const pageSize = params.page_size || 10;

      qParams.append('page', page.toString());
      qParams.append('page_size', pageSize.toString());

      if (params.placement !== undefined && params.placement !== '') {
        qParams.append('placement', String(params.placement));
      }
      if (params.placement_code !== undefined && params.placement_code !== '') {
        qParams.append('placement_code', String(params.placement_code));
      }
      if (params.is_active !== undefined && params.is_active !== '') {
        qParams.append('is_active', String(params.is_active));
      }
      if (params.search && params.search.trim()) {
        qParams.append('search', params.search.trim());
      }
      if (params.ordering) {
        qParams.append('ordering', params.ordering);
      }

      const queryString = qParams.toString() ? `?${qParams.toString()}` : '';
      const response = await apiClient.request<any>(`/api/v1/banners/${queryString}`, {
        method: 'GET'
      });

      isLoading.value = false;

      let results: Banner[] = [];
      let count = 0;
      let pages = 1;

      if (response && typeof response === 'object') {
        if ('results' in response && Array.isArray(response.results)) {
          results = response.results.map(mapBannerResponse);
          count = response.count ?? results.length;
          pages = response.pages ?? response.total_pages ?? (Math.ceil(count / pageSize) || 1);
        } else if ('data' in response && Array.isArray(response.data)) {
          results = response.data.map(mapBannerResponse);
          count = response.total ?? results.length;
          pages = Math.ceil(count / pageSize) || 1;
        } else if (Array.isArray(response)) {
          results = response.map(mapBannerResponse);
          count = response.length;
          pages = Math.ceil(count / pageSize) || 1;
        }
      }

      return {
        results,
        count,
        page,
        pages
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to fetch banners list.');
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * GET /api/v1/banners/{id}/
   * Retrieves single banner details.
   */
  const getBanner = async (id: number | string): Promise<Banner> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>(`/api/v1/banners/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return mapBannerResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to retrieve banner #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * POST /api/v1/banners/
   * Creates a new banner. Accepts FormData for multipart image uploads.
   */
  const createBanner = async (payload: FormData | CreateBannerPayload): Promise<Banner> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      let body: any = payload;
      if (!(payload instanceof FormData)) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
          if (value === undefined) continue;
          if (value === null) {
            formData.append(key, '');
          } else if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else {
            formData.append(key, String(value));
          }
        }
        body = formData;
      }

      const response = await apiClient.request<any>('/api/v1/banners/', {
        method: 'POST',
        body
      });

      isLoading.value = false;
      return mapBannerResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create banner.');
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * PATCH /api/v1/banners/{id}/
   * Updates an existing banner. Supports both JSON updates and FormData multipart uploads.
   */
  const updateBanner = async (
    id: number | string,
    payload: FormData | UpdateBannerPayload | Partial<Banner>
  ): Promise<Banner> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      let body: any = payload;
      let hasFile = false;

      if (!(payload instanceof FormData)) {
        // Check if any payload property is a File/Blob instance
        for (const val of Object.values(payload)) {
          if (val instanceof File || val instanceof Blob) {
            hasFile = true;
            break;
          }
        }

        if (hasFile) {
          const formData = new FormData();
          for (const [key, value] of Object.entries(payload)) {
            if (value === undefined) continue;
            if (value === null) {
              formData.append(key, '');
            } else if (value instanceof File || value instanceof Blob) {
              formData.append(key, value);
            } else if (typeof value === 'boolean') {
              formData.append(key, value ? 'true' : 'false');
            } else {
              formData.append(key, String(value));
            }
          }
          body = formData;
        }
      }

      const response = await apiClient.request<any>(`/api/v1/banners/${id}/`, {
        method: 'PATCH',
        body
      });

      isLoading.value = false;
      return mapBannerResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to update banner #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * DELETE /api/v1/banners/{id}/
   * Deletes a banner.
   */
  const deleteBanner = async (id: number | string): Promise<{ success?: boolean; detail?: string }> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>(`/api/v1/banners/${id}/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return response || { success: true };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to delete banner #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * POST /api/v1/banners/reorder/
   * Reorders banners within a placement.
   * Sends { placement: number, banners: [{ id: number, display_order: number }] }
   */
  const reorderBanners = async (payload: BannerReorderRequest): Promise<BannerReorderResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>('/api/v1/banners/reorder/', {
        method: 'POST',
        body: payload
      });
      isLoading.value = false;
      return {
        detail: response?.detail || response?.message || 'Banners reordered successfully.'
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to reorder banners.');
      isLoading.value = false;
      throw err;
    }
  };

  // ==========================================
  // 2. STOREFRONT AVAILABLE BANNERS
  // ==========================================

  /**
   * GET /api/v1/banners/available/
   * Fetches active, currently scheduled storefront banners in backend display_order.
   * Supports optional placement parameter (?placement=<id> or ?placement_code=<code>).
   */
  const getAvailableBanners = async (
    placementIdOrFilters?: number | string | StorefrontBannerFilters
  ): Promise<BannerStorefront[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const qParams = new URLSearchParams();

      if (placementIdOrFilters !== undefined && placementIdOrFilters !== null) {
        if (typeof placementIdOrFilters === 'object') {
          if (placementIdOrFilters.placement !== undefined) {
            qParams.append('placement', String(placementIdOrFilters.placement));
          }
          if (placementIdOrFilters.placement_code !== undefined) {
            qParams.append('placement_code', String(placementIdOrFilters.placement_code));
          }
        } else if (String(placementIdOrFilters).trim() !== '') {
          qParams.append('placement', String(placementIdOrFilters).trim());
        }
      }

      const queryString = qParams.toString() ? `?${qParams.toString()}` : '';
      const response = await apiClient.request<any>(`/api/v1/banners/available/${queryString}`, {
        method: 'GET'
      });

      isLoading.value = false;

      let results: any[] = [];
      if (Array.isArray(response)) {
        results = response;
      } else if (response && typeof response === 'object') {
        if ('results' in response && Array.isArray(response.results)) {
          results = response.results;
        } else if ('data' in response && Array.isArray(response.data)) {
          results = response.data;
        }
      }

      // Backend already returns items ordered by display_order ASC, created_at DESC
      return results.map(mapBannerStorefrontResponse);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve available storefront banners.');
      isLoading.value = false;
      throw err;
    }
  };

  // ==========================================
  // 3. PLACEMENTS CRUD
  // ==========================================

  /**
   * GET /api/v1/placements/
   * Fetches paginated placement definitions.
   */
  const getPlacementsList = async (params: {
    page?: number;
    page_size?: number;
    is_active?: boolean | string;
    search?: string;
  } = {}): Promise<PaginatedResponse<BannerPlacement>> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const qParams = new URLSearchParams();
      const page = params.page || 1;
      const pageSize = params.page_size || 50;

      qParams.append('page', page.toString());
      qParams.append('page_size', pageSize.toString());

      if (params.is_active !== undefined && params.is_active !== '') {
        qParams.append('is_active', String(params.is_active));
      }
      if (params.search && params.search.trim()) {
        qParams.append('search', params.search.trim());
      }

      const queryString = qParams.toString() ? `?${qParams.toString()}` : '';
      const response = await apiClient.request<any>(`/api/v1/placements/${queryString}`, {
        method: 'GET'
      });

      isLoading.value = false;

      let results: BannerPlacement[] = [];
      let count = 0;
      let pages = 1;

      if (response && typeof response === 'object') {
        if ('results' in response && Array.isArray(response.results)) {
          results = response.results.map(mapPlacementResponse);
          count = response.count ?? results.length;
          pages = response.pages ?? response.total_pages ?? (Math.ceil(count / pageSize) || 1);
        } else if ('data' in response && Array.isArray(response.data)) {
          results = response.data.map(mapPlacementResponse);
          count = response.total ?? results.length;
          pages = Math.ceil(count / pageSize) || 1;
        } else if (Array.isArray(response)) {
          results = response.map(mapPlacementResponse);
          count = response.length;
          pages = Math.ceil(count / pageSize) || 1;
        }
      }

      return {
        results,
        count,
        page,
        pages
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to fetch placements list.');
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * GET /api/v1/placements/{id}/
   * Retrieves single placement details.
   */
  const getPlacement = async (id: number | string): Promise<BannerPlacement> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>(`/api/v1/placements/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return mapPlacementResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to retrieve placement #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * POST /api/v1/placements/
   * Creates a new placement.
   */
  const createPlacement = async (payload: Partial<BannerPlacement>): Promise<BannerPlacement> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>('/api/v1/placements/', {
        method: 'POST',
        body: payload
      });
      isLoading.value = false;
      return mapPlacementResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create placement.');
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * PATCH /api/v1/placements/{id}/
   * Updates an existing placement.
   */
  const updatePlacement = async (
    id: number | string,
    payload: Partial<BannerPlacement>
  ): Promise<BannerPlacement> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>(`/api/v1/placements/${id}/`, {
        method: 'PATCH',
        body: payload
      });
      isLoading.value = false;
      return mapPlacementResponse(response);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to update placement #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  /**
   * DELETE /api/v1/placements/{id}/
   * Deletes a placement.
   */
  const deletePlacement = async (id: number | string): Promise<{ success?: boolean; detail?: string }> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const response = await apiClient.request<any>(`/api/v1/placements/${id}/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return response || { success: true };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, `Failed to delete placement #${id}.`);
      isLoading.value = false;
      throw err;
    }
  };

  return {
    isLoading,
    errorMsg,
    // Admin Banners
    getBannersList,
    getBanner,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    // Storefront Banners
    getAvailableBanners,
    // Placements
    getPlacementsList,
    getPlacement,
    createPlacement,
    updatePlacement,
    deletePlacement,
    // Normalization helpers
    mapBannerResponse,
    mapBannerStorefrontResponse,
    mapPlacementResponse
  };
};

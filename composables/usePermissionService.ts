// File: /composables/usePermissionService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { Permission, PaginatedPermissions } from '@/types';

// Shared module-scoped cache
const permissionsCache = ref<Permission[] | null>(null);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);
const fetchPromise = ref<Promise<Permission[]> | null>(null);

export const usePermissionService = () => {
  const apiClient = useApiClient();

  const checkMockMode = (): boolean => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
  };

  const getPermissions = async (forceRefresh = false): Promise<Permission[]> => {
    if (!forceRefresh && permissionsCache.value && permissionsCache.value.length > 0) {
      return permissionsCache.value;
    }

    if (fetchPromise.value && !forceRefresh) {
      return fetchPromise.value;
    }

    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const fallbacks = getFallbackPermissions();
      permissionsCache.value = fallbacks;
      isLoading.value = false;
      return fallbacks;
    }

    fetchPromise.value = (async () => {
      try {
        const data = await apiClient.request<PaginatedPermissions | Permission[]>('/api/v1/permissions/', {
          method: 'GET'
        });

        let list: Permission[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          list = data.results;
        }

        if (list.length > 0) {
          permissionsCache.value = list;
        } else {
          // If empty list returned, use standard permissions set
          permissionsCache.value = getFallbackPermissions();
        }
        return permissionsCache.value;
      } catch (err: any) {
        const msg = err.data?.detail || err.data?.message || err.message || 'Failed to fetch permissions registry.';
        errorMsg.value = msg;
        if (!permissionsCache.value || permissionsCache.value.length === 0) {
          permissionsCache.value = getFallbackPermissions();
        }
        return permissionsCache.value;
      } finally {
        isLoading.value = false;
        fetchPromise.value = null;
      }
    })();

    return fetchPromise.value;
  };

  const clearCache = () => {
    permissionsCache.value = null;
  };

  const getPermissionsPage = async (params: { page: number; search?: string }): Promise<PaginatedPermissions> => {
    const page = params.page || 1;
    const search = params.search || '';

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 250));
      let all = getFallbackPermissions();
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(p => p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q));
      }
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const pageItems = all.slice(startIndex, startIndex + pageSize);
      const hasNext = startIndex + pageSize < all.length;

      return {
        count: all.length,
        next: hasNext ? `/api/v1/permissions/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/v1/permissions/?page=${page - 1}` : null,
        results: pageItems
      };
    }

    try {
      const queryObj: Record<string, any> = { page };
      if (search) queryObj.search = search;

      const data = await apiClient.request<PaginatedPermissions | Permission[]>('/api/v1/permissions/', {
        method: 'GET',
        params: queryObj
      });

      if (Array.isArray(data)) {
        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const pageItems = data.slice(startIndex, startIndex + pageSize);
        return {
          count: data.length,
          next: startIndex + pageSize < data.length ? `/api/v1/permissions/?page=${page + 1}` : null,
          previous: page > 1 ? `/api/v1/permissions/?page=${page - 1}` : null,
          results: pageItems
        };
      }

      return data;
    } catch (err: any) {
      let all = getFallbackPermissions();
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(p => p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q));
      }
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const pageItems = all.slice(startIndex, startIndex + pageSize);
      const hasNext = startIndex + pageSize < all.length;

      return {
        count: all.length,
        next: hasNext ? `/api/v1/permissions/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/v1/permissions/?page=${page - 1}` : null,
        results: pageItems
      };
    }
  };

  return {
    permissions: permissionsCache,
    isLoading,
    error: errorMsg,
    getPermissions,
    getPermissionsPage,
    clearCache
  };
};

function getFallbackPermissions(): Permission[] {
  return [
    { id: 1, codename: 'add_user', name: 'Can add user' },
    { id: 2, codename: 'change_user', name: 'Can change user' },
    { id: 3, codename: 'delete_user', name: 'Can delete user' },
    { id: 4, codename: 'view_user', name: 'Can view user' },
    { id: 5, codename: 'add_product', name: 'Can add product' },
    { id: 6, codename: 'change_product', name: 'Can change product' },
    { id: 7, codename: 'delete_product', name: 'Can delete product' },
    { id: 8, codename: 'view_product', name: 'Can view product' },
    { id: 9, codename: 'add_category', name: 'Can add category' },
    { id: 10, codename: 'change_category', name: 'Can change category' },
    { id: 11, codename: 'delete_category', name: 'Can delete category' },
    { id: 12, codename: 'view_category', name: 'Can view category' },
    { id: 13, codename: 'add_brand', name: 'Can add brand' },
    { id: 14, codename: 'change_brand', name: 'Can change brand' },
    { id: 15, codename: 'delete_brand', name: 'Can delete brand' },
    { id: 16, codename: 'view_brand', name: 'Can view brand' },
    { id: 17, codename: 'add_order', name: 'Can add order' },
    { id: 18, codename: 'change_order', name: 'Can change order' },
    { id: 19, codename: 'delete_order', name: 'Can delete order' },
    { id: 20, codename: 'view_order', name: 'Can view order' },
    { id: 21, codename: 'add_group', name: 'Can add role' },
    { id: 22, codename: 'change_group', name: 'Can change role' },
    { id: 23, codename: 'delete_group', name: 'Can delete role' },
    { id: 24, codename: 'view_group', name: 'Can view role' },
    { id: 25, codename: 'add_logentry', name: 'Can add log entry' },
    { id: 26, codename: 'change_logentry', name: 'Can change log entry' },
    { id: 27, codename: 'delete_logentry', name: 'Can delete log entry' },
    { id: 28, codename: 'view_logentry', name: 'Can view log entry' }
  ];
}

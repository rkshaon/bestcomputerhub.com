import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { Brand } from '@/types';

const BRANDS_STORAGE_KEY = 'techcore_mock_brands_registry';

export const useBrandService = () => {
  const apiClient = useApiClient();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  // Default mock brands for TechCore premium enterprise feel
  const getMockBrands = (): Brand[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(BRANDS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      const defaults: Brand[] = [
        { id: '1', name: 'Intel Corporation', slug: 'intel', display_order: 1, is_active: true },
        { id: '2', name: 'Advanced Micro Devices', slug: 'amd', display_order: 2, is_active: true },
        { id: '3', name: 'NVIDIA Enterprise', slug: 'nvidia', display_order: 3, is_active: true },
        { id: '4', name: 'Samsung Semiconductor', slug: 'samsung-semiconductor', display_order: 4, is_active: true },
        { id: '5', name: 'TSMC', slug: 'tsmc', display_order: 5, is_active: true }
      ];
      localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  };

  const checkMockMode = (): boolean => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase || '';
    return !apiBase || apiBase.trim() === '';
  };

  // Trailing Slashes Requirement: ALWAYS append trailing slash (/)
  const getBrandsList = async (): Promise<Brand[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      return getMockBrands();
    }

    try {
      const data = await apiClient.request<any>('/api/v1/brands/', {
        method: 'GET'
      });
      isLoading.value = false;

      let results: Brand[] = [];
      if (data && typeof data === 'object') {
        if ('results' in data && Array.isArray(data.results)) {
          results = data.results;
        } else if (Array.isArray(data)) {
          results = data;
        }
      }
      return results;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to retrieve partner brands.';
      isLoading.value = false;
      return getMockBrands();
    }
  };

  return {
    getBrandsList,
    isLoading,
    errorMsg
  };
};

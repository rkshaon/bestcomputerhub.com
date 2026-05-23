import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useProductService } from './useProductService';
import type { Brand } from '@/types';

const BRANDS_STORAGE_KEY = 'techcore_mock_brands_registry';

export const useBrandService = () => {
  const apiClient = useApiClient();
  const productService = useProductService();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  // Initialize mock state
  const getMockBrands = (): Brand[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(BRANDS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default brands with is_active defaulted to true
      const defaults: Brand[] = productService.getBrands().map(b => ({
        ...b,
        is_active: b.is_active !== undefined ? b.is_active : true
      }));
      
      localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  };

  const saveMockBrands = (brandsList: Brand[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brandsList));
    } catch {}
  };

  const checkMockMode = (): boolean => {
    // Determine mock mode based on useApiClient rules
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase || '';
    return !apiBase || apiBase.trim() === '';
  };

  // 1. Get All Brands (Paginated / Filtered or simple list)
  const getBrandsList = async (): Promise<Brand[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      // Simulate artificial latency
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;
      return getMockBrands();
    }

    try {
      const data = await apiClient.request<Brand[] | { data: Brand[] }>('/api/v1/brands', {
        method: 'GET'
      });
      isLoading.value = false;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to retrieve brands registry.';
      isLoading.value = false;
      // Fallback to mock brands if API fails so the system doesn't visually crash
      return getMockBrands();
    }
  };

  // 2. Fetch Brand Details
  const getBrandDetails = async (id: string): Promise<Brand | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      isLoading.value = false;
      const brandsList = getMockBrands();
      return brandsList.find(b => b.id === id) || null;
    }

    try {
      const data = await apiClient.request<Brand>(`/api/v1/brands/${id}`, {
        method: 'GET'
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to retrieve brand audit.';
      isLoading.value = false;
      // Fallback
      return getMockBrands().find(b => b.id === id) || null;
    }
  };

  // 3. Create Brand
  const createBrand = async (payload: { name: string; slug: string; description: string; is_active: boolean }): Promise<Brand> => {
    isLoading.value = true;
    errorMsg.value = null;

    // Standard business validations
    if (!payload.name?.trim()) {
      const err = new Error('Brand name is required');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }
    if (!payload.slug?.trim()) {
      const err = new Error('Brand slug identifier is required');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;

      const brandsList = getMockBrands();
      
      // Slug uniqueness checker
      if (brandsList.some(b => b.slug.toLowerCase() === payload.slug.toLowerCase())) {
        const err = new Error(`Protocol Violation: Brand slug "${payload.slug}" is already registered.`);
        errorMsg.value = err.message;
        throw err;
      }

      const newBrand: Brand = {
        id: 'brand_' + Math.floor(Math.random() * 1000000),
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description?.trim() || '',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80', // Default modern container placeholder logo
        productCount: 0,
        is_active: payload.is_active
      };

      brandsList.push(newBrand);
      saveMockBrands(brandsList);
      return newBrand;
    }

    try {
      const data = await apiClient.request<Brand>('/api/v1/brands/', {
        method: 'POST',
        body: payload
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to register brand partner.';
      isLoading.value = false;
      throw err;
    }
  };

  // 4. Edit Brand
  const updateBrand = async (id: string, payload: { name: string; slug: string; description: string; is_active: boolean }): Promise<Brand> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (!payload.name?.trim()) {
      const err = new Error('Brand name is required');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }
    if (!payload.slug?.trim()) {
      const err = new Error('Brand slug identifier is required');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;

      const brandsList = getMockBrands();
      const idx = brandsList.findIndex(b => b.id === id);
      const existingBrand = brandsList[idx];
      if (idx === -1 || !existingBrand) {
        throw new Error('Brand not found in administrative mock node.');
      }

      // Check unique slug on other brands
      if (brandsList.some((b, i) => i !== idx && b.slug.toLowerCase() === payload.slug.toLowerCase())) {
        const err = new Error(`Protocol Violation: Brand slug "${payload.slug}" is already registered.`);
        errorMsg.value = err.message;
        throw err;
      }

      const updatedBrand: Brand = {
        id: existingBrand.id,
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description?.trim() || '',
        logo: existingBrand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80',
        productCount: existingBrand.productCount || 0,
        is_active: payload.is_active
      };

      brandsList[idx] = updatedBrand;
      saveMockBrands(brandsList);
      return updatedBrand;
    }

    try {
      const data = await apiClient.request<Brand>(`/api/v1/brands/${id}`, {
        method: 'PUT',
        body: payload
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to patch brand profile.';
      isLoading.value = false;
      throw err;
    }
  };

  // 5. Delete Brand
  const deleteBrand = async (id: string): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      const brandsList = getMockBrands();
      const filtered = brandsList.filter(b => b.id !== id);
      saveMockBrands(filtered);
      return true;
    }

    try {
      await apiClient.request(`/api/v1/brands/${id}`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to delete partner registry.';
      isLoading.value = false;
      throw err;
    }
  };

  return {
    getBrandsList,
    getBrandDetails,
    createBrand,
    updateBrand,
    deleteBrand,
    isLoading,
    errorMsg
  };
};

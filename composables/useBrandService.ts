// File: /composables/useBrandService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useProductService } from './useProductService';
import { extractErrorMessage } from './useToast';
import type { Brand, PaginatedResponse } from '@/types';

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
      
      // Default brands with is_active defaulted to true and mock display_order
      const defaults: Brand[] = productService.getBrands().map((b, idx) => ({
        ...b,
        is_active: b.is_active !== undefined ? b.is_active : true,
        display_order: idx + 1
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
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
  };

  // 1. Get All Brands (Paginated / Filtered or simple list)
  const getBrandsList = async (): Promise<Brand[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    const sortByDisplayOrder = (list: Brand[]) => {
      return list.sort((a, b) => {
        const orderA = a.display_order !== undefined ? a.display_order : 999999;
        const orderB = b.display_order !== undefined ? b.display_order : 999999;
        return orderA - orderB;
      });
    };

    if (checkMockMode()) {
      // Simulate artificial latency
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;
      return sortByDisplayOrder(getMockBrands());
    }

    try {
      const data = await apiClient.request<any>('/api/v1/brands/', {
        method: 'GET'
      });
      isLoading.value = false;
      let list: Brand[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === 'object') {
        if ('data' in data && Array.isArray(data.data)) {
          list = data.data;
        } else if ('results' in data && Array.isArray(data.results)) {
          list = data.results;
        } else if ('brands' in data && Array.isArray(data.brands)) {
          list = data.brands;
        }
      }
      return sortByDisplayOrder(list);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve brands registry.');
      isLoading.value = false;
      // Fallback to mock brands if API fails so the system doesn't visually crash
      return sortByDisplayOrder(getMockBrands());
    }
  };

  // 1.2 Get Paginated Brands List via Generic paginated response
  const getBrandsPaginatedList = async (filters: { page?: number; page_size?: number; search?: string; ordering?: string } = {}): Promise<PaginatedResponse<Brand>> => {
    isLoading.value = true;
    errorMsg.value = null;

    const page = filters.page || 1;
    const pageSize = filters.page_size || 5;
    const search = filters.search || '';
    const ordering = filters.ordering || '';

    const sortByDisplayOrder = (list: Brand[]) => {
      return list.sort((a, b) => {
        const orderA = a.display_order !== undefined ? a.display_order : 999999;
        const orderB = b.display_order !== undefined ? b.display_order : 999999;
        return orderA - orderB;
      });
    };

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      isLoading.value = false;

      let list = getMockBrands();
      if (search) {
        list = list.filter(b => 
          b.name.toLowerCase().includes(search.toLowerCase()) || 
          b.slug.toLowerCase().includes(search.toLowerCase()) || 
          (b.description || '').toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sort by ordering field if specified, otherwise display_order
      if (ordering) {
        const isDesc = ordering.startsWith('-');
        const field = isDesc ? ordering.substring(1) : ordering;
        list.sort((a: any, b: any) => {
          let valA = a[field];
          let valB = b[field];
          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          if (strA < strB) return isDesc ? 1 : -1;
          if (strA > strB) return isDesc ? -1 : 1;
          return 0;
        });
      } else {
        sortByDisplayOrder(list);
      }

      const totalCount = list.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const results = list.slice(startIndex, startIndex + pageSize);

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages
      };
    }

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      if (search) params.append('search', search);
      if (ordering) params.append('ordering', ordering);

      const endpoint = `/api/v1/brands/?${params.toString()}`;
      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      let results: Brand[] = [];
      let totalCount = 0;
      let totalPages = 1;

      if (data && typeof data === 'object') {
        if ('results' in data && Array.isArray(data.results)) {
          results = data.results;
          totalCount = data.count !== undefined ? data.count : results.length;
          totalPages = data.pages !== undefined ? data.pages : Math.ceil(totalCount / pageSize);
        } else if ('data' in data && Array.isArray(data.data)) {
          results = data.data;
          totalCount = data.total !== undefined ? data.total : results.length;
          totalPages = Math.ceil(totalCount / pageSize);
        } else if (Array.isArray(data)) {
          results = data;
          totalCount = data.length;
          totalPages = Math.ceil(totalCount / pageSize);
        }
      }

      sortByDisplayOrder(results);

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve brands paginated taxonomy.');
      isLoading.value = false;

      // Fallback
      const list = getMockBrands();
      const totalCount = list.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const results = list.slice(startIndex, startIndex + pageSize);

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages
      };
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
      const data = await apiClient.request<Brand>(`/api/v1/brands/${id}/`, {
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
  const createBrand = async (payload: { name: string; slug: string; description: string; is_active: boolean; display_order?: number }): Promise<Brand> => {
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
        is_active: payload.is_active,
        display_order: payload.display_order
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
      errorMsg.value = extractErrorMessage(err, 'Failed to register brand partner.');
      isLoading.value = false;
      throw err;
    }
  };

  // 4. Edit Brand
  const updateBrand = async (id: string, payload: { name: string; slug: string; description: string; is_active: boolean; display_order?: number }): Promise<Brand> => {
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
        is_active: payload.is_active,
        display_order: payload.display_order
      };

      brandsList[idx] = updatedBrand;
      saveMockBrands(brandsList);
      return updatedBrand;
    }

    try {
      const { slug, ...bodyWithoutSlug } = payload;
      const data = await apiClient.request<Brand>(`/api/v1/brands/${id}/`, {
        method: 'PUT',
        body: bodyWithoutSlug
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to patch brand profile.');
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
      await apiClient.request(`/api/v1/brands/${id}/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to delete partner registry.');
      isLoading.value = false;
      throw err;
    }
  };

  return {
    getBrandsList,
    getBrandsPaginatedList,
    getBrandDetails,
    createBrand,
    updateBrand,
    deleteBrand,
    isLoading,
    errorMsg
  };
};

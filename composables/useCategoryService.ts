import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useProductService } from './useProductService';
import type { Category } from '@/types';

const CATEGORIES_STORAGE_KEY = 'techcore_mock_categories_registry';

export interface CategoryFilters {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  parent?: string; // parentCategoryId filter
}

export interface PaginatedCategoriesResponse {
  results: Category[];
  count: number;
  page: number;
  pages: number;
}

export const useCategoryService = () => {
  const apiClient = useApiClient();
  const productService = useProductService();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  // Initialize mock state
  const getMockCategories = (): Category[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      const defaults = productService.getCategories();
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  };

  const saveMockCategories = (categoriesList: Category[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoriesList));
    } catch {}
  };

  const checkMockMode = (): boolean => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase || '';
    return !apiBase || apiBase.trim() === '';
  };

  // Trailing Slashes Requirement: ALWAYS append trailing slash (/)
  const getCategoriesList = async (filters: CategoryFilters = {}): Promise<PaginatedCategoriesResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    const page = filters.page || 1;
    const pageSize = filters.page_size || 6;
    const search = filters.search || '';
    const ordering = filters.ordering || '';
    const parent = filters.parent || '';

    if (checkMockMode()) {
      // Simulate artificial latency
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      let list = getMockCategories();

      // Apply parent filter
      if (parent) {
        if (parent === 'none') {
          // Main level categories
          list = list.filter(c => !c.parentCategoryId);
        } else {
          list = list.filter(c => c.parentCategoryId === parent);
        }
      }

      // Apply search filter
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(c => 
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        );
      }

      // Apply ordering filter
      if (ordering) {
        const isDesc = ordering.startsWith('-');
        const field = isDesc ? ordering.substring(1) : ordering;
        list.sort((a: any, b: any) => {
          const valA = a[field] || '';
          const valB = b[field] || '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
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
      // Build query string parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      if (search) params.append('search', search);
      if (ordering) params.append('ordering', ordering);
      
      // Send parent only if it is a valid numeric category id
      if (parent && /^\d+$/.test(parent)) {
        params.append('parent', parent);
      }

      const queryString = params.toString();
      const endpoint = `/api/v1/categories/?${queryString}`;

      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      isLoading.value = false;

      // Handle standard paginated responses, with safety fallbacks
      let results: Category[] = [];
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

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages
      };
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to retrieve categories taxonomy.';
      isLoading.value = false;
      
      // Fallback in case of API failure to prevent visual app breakage
      const list = getMockCategories();
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

  const getCategoryDetails = async (id: string): Promise<Category | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      isLoading.value = false;
      return getMockCategories().find(c => c.id === id) || null;
    }

    try {
      const data = await apiClient.request<Category>(`/api/v1/categories/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to retrieve category details.';
      isLoading.value = false;
      return getMockCategories().find(c => c.id === id) || null;
    }
  };

  const createCategory = async (payload: { name: string; slug: string; description: string | null; parent: number | string | null }): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (!payload.name?.trim()) {
      const err = new Error('Category name designation is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }
    if (!payload.slug?.trim()) {
      const err = new Error('Category slug identifier is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    // Standardize parent to numeric format or null
    let parentId: number | null = null;
    if (payload.parent !== undefined && payload.parent !== null && payload.parent !== '') {
      const parsed = parseInt(String(payload.parent), 10);
      if (!isNaN(parsed)) {
        parentId = parsed;
      }
    }

    const requestBody = {
      name: payload.name.trim(),
      slug: payload.slug.trim().toLowerCase(),
      description: payload.description?.trim() || null,
      parent: parentId
    };

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      if (categoriesList.some(c => c.slug.toLowerCase() === requestBody.slug.toLowerCase())) {
        const err = new Error(`Protocol Violation: Category slug "${requestBody.slug}" is already registered.`);
        errorMsg.value = err.message;
        throw err;
      }

      const newCategory: Category = {
        id: String(Math.floor(Math.random() * 1000000)),
        name: requestBody.name,
        slug: requestBody.slug,
        description: requestBody.description || undefined,
        parentCategoryId: parentId ? String(parentId) : undefined,
        subCategories: []
      };

      // Also update the parent category's subCategories list if applicable
      if (parentId) {
        const parentCat = categoriesList.find(c => c.id === String(parentId));
        if (parentCat) {
          if (!parentCat.subCategories) parentCat.subCategories = [];
          parentCat.subCategories.push(newCategory.id);
        }
      }

      categoriesList.push(newCategory);
      saveMockCategories(categoriesList);
      return newCategory;
    }

    try {
      const data = await apiClient.request<Category>('/api/v1/categories/', {
        method: 'POST',
        body: requestBody
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to create category node.';
      isLoading.value = false;
      throw err;
    }
  };

  const updateCategory = async (id: string, payload: { name: string; slug: string; description: string; parentCategoryId?: string; icon?: string; image?: string }): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (!payload.name?.trim()) {
      const err = new Error('Category name designation is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }
    if (!payload.slug?.trim()) {
      const err = new Error('Category slug identifier is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const idx = categoriesList.findIndex(c => c.id === id);
      if (idx === -1) {
        throw new Error('Category node not found.');
      }

      const existingCategory = categoriesList[idx];
      if (!existingCategory) {
        throw new Error('Category node not found.');
      }
      const oldParent = existingCategory.parentCategoryId;

      const updatedCategory: Category = {
        id: existingCategory.id,
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description?.trim() || '',
        parentCategoryId: payload.parentCategoryId || undefined,
        icon: payload.icon || undefined,
        image: payload.image || undefined,
        subCategories: existingCategory.subCategories || []
      };

      // Handle custom parent transitions in mock storage
      if (oldParent !== payload.parentCategoryId) {
        // Remove from old parent
        if (oldParent) {
          const oldParentCat = categoriesList.find(c => c.id === oldParent);
          if (oldParentCat && oldParentCat.subCategories) {
            oldParentCat.subCategories = oldParentCat.subCategories.filter(s => s !== id);
          }
        }
        // Add to new parent
        if (payload.parentCategoryId) {
          const newParentCat = categoriesList.find(c => c.id === payload.parentCategoryId);
          if (newParentCat) {
            if (!newParentCat.subCategories) newParentCat.subCategories = [];
            if (!newParentCat.subCategories.includes(id)) {
              newParentCat.subCategories.push(id);
            }
          }
        }
      }

      categoriesList[idx] = updatedCategory;
      saveMockCategories(categoriesList);
      return updatedCategory;
    }

    try {
      const { slug, ...bodyWithoutSlug } = payload;
      const data = await apiClient.request<Category>(`/api/v1/categories/${id}/`, {
        method: 'PUT',
        body: bodyWithoutSlug
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to update category node.';
      isLoading.value = false;
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const target = categoriesList.find(c => c.id === id);
      if (target) {
        // Unlink parent
        if (target.parentCategoryId) {
          const parentCat = categoriesList.find(c => c.id === target.parentCategoryId);
          if (parentCat && parentCat.subCategories) {
            parentCat.subCategories = parentCat.subCategories.filter(s => s !== id);
          }
        }
        // Any children of this category should lose their parent connection
        categoriesList.forEach(c => {
          if (c.parentCategoryId === id) {
            delete c.parentCategoryId;
          }
        });
      }

      const filtered = categoriesList.filter(c => c.id !== id);
      saveMockCategories(filtered);
      return true;
    }

    try {
      await apiClient.request(`/api/v1/categories/${id}/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return true;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to delete category node.';
      isLoading.value = false;
      throw err;
    }
  };

  return {
    getCategoriesList,
    getCategoryDetails,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    errorMsg
  };
};

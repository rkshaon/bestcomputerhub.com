// File: /composables/useCategoryService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useProductService } from './useProductService';
import { extractErrorMessage } from './useToast';
import type { Category, PaginatedResponse, CategoryFilters, PaginatedCategoriesResponse, CategoryImportResponse } from '@/types';

const CATEGORIES_STORAGE_KEY = 'techcore_mock_categories_registry';

// Storefront direct category children cache keyed by parent category ID
const categoryChildrenCache = ref<Record<string, Category[]>>({});
const loadedChildrenParentIds = ref<Set<string>>(new Set());
const loadingParentIds = ref<Set<string>>(new Set());

export const useCategoryService = () => {
  const apiClient = useApiClient();
  const productService = useProductService();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  const mapCategoryResponse = (cat: any): Category => {
    if (!cat) return cat;
    let parentId: string | undefined = undefined;
    if (cat.parentCategoryId !== undefined) {
      parentId = String(cat.parentCategoryId);
    } else if (cat.parent) {
      parentId = typeof cat.parent === 'object' ? String(cat.parent.id) : String(cat.parent);
    }
    const mapped: Category = {
      ...cat,
      id: String(cat.id),
      parentCategoryId: parentId,
      has_children: typeof cat.has_children === 'boolean'
        ? cat.has_children
        : Boolean(cat.children?.length || cat.subCategories?.length)
    };
    if (cat.children && Array.isArray(cat.children)) {
      mapped.children = cat.children.map(mapCategoryResponse);
    }
    return mapped;
  };

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
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
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
    const is_parent = filters.is_parent;

    if (checkMockMode()) {
      // Simulate artificial latency
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      let list = getMockCategories();

      // Apply parent filter or is_parent filter
      if (is_parent) {
        list = list.filter(c => !c.parentCategoryId);
      } else if (parent) {
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
        // Default sort by order ascending
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      if (parent) params.append('parent', parent);
      if (is_parent !== undefined) {
        params.append('is_parent', is_parent.toString());
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
          results = data.results.map(mapCategoryResponse);
          totalCount = data.count !== undefined ? data.count : results.length;
          totalPages = data.pages !== undefined ? data.pages : Math.ceil(totalCount / pageSize);
        } else if ('data' in data && Array.isArray(data.data)) {
          results = data.data.map(mapCategoryResponse);
          totalCount = data.total !== undefined ? data.total : results.length;
          totalPages = Math.ceil(totalCount / pageSize);
        } else if (Array.isArray(data)) {
          results = data.map(mapCategoryResponse);
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
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve categories taxonomy.');
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
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve category details.');
      isLoading.value = false;
      return getMockCategories().find(c => c.id === id) || null;
    }
  };

  const createCategory = async (payload: { name: string; slug: string; description: string; parentCategoryId?: string; icon?: string; image?: string; order?: number }): Promise<Category> => {
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
      if (categoriesList.some(c => c.slug.toLowerCase() === payload.slug.toLowerCase())) {
        const err = new Error(`Protocol Violation: Category slug "${payload.slug}" is already registered.`);
        errorMsg.value = err.message;
        throw err;
      }

      const newCategory: Category = {
        id: 'cat_' + Math.floor(Math.random() * 1000000),
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description?.trim() || '',
        parentCategoryId: payload.parentCategoryId || undefined,
        icon: payload.icon || undefined,
        image: payload.image || undefined,
        subCategories: [],
        order: payload.order !== undefined ? Number(payload.order) : 0
      };

      // Also update the parent category's subCategories list if applicable
      if (payload.parentCategoryId) {
        const parentCat = categoriesList.find(c => c.id === payload.parentCategoryId);
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
      const { parentCategoryId, ...rest } = payload;
      const apiPayload = {
        ...rest,
        parent: parentCategoryId || null
      };
      const data = await apiClient.request<any>('/api/v1/categories/', {
        method: 'POST',
        body: apiPayload
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to create category node.');
      isLoading.value = false;
      throw err;
    }
  };

  const updateCategory = async (id: string, payload: { name: string; slug: string; description: string; parentCategoryId?: string; icon?: string; image?: string; order?: number }): Promise<Category> => {
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

      if (categoriesList.some((c, i) => i !== idx && c.slug.toLowerCase() === payload.slug.toLowerCase())) {
        const err = new Error(`Protocol Violation: Category slug "${payload.slug}" is already registered.`);
        errorMsg.value = err.message;
        throw err;
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
        subCategories: existingCategory.subCategories || [],
        order: payload.order !== undefined ? Number(payload.order) : 0
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
      const { parentCategoryId, ...rest } = payload;
      const apiPayload = {
        ...rest,
        parent: parentCategoryId || null
      };
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/`, {
        method: 'PUT',
        body: apiPayload
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to update category node.');
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
      errorMsg.value = extractErrorMessage(err, 'Failed to delete category node.');
      isLoading.value = false;
      throw err;
    }
  };

  const importCategoriesFromCSV = async (file: File): Promise<CategoryImportResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;
      try {
        const text = await file.text();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          return { success: true, created: 0, errors: [] };
        }
        
        // Parse simple CSV (header row + data)
        const headerRow = lines[0];
        if (!headerRow) {
          return { success: false, created: 0, errors: ['CSV file is empty or missing headers.'] };
        }
        const headers = headerRow.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
        const slugIdx = headers.findIndex(h => h.toLowerCase() === 'slug');
        const descIdx = headers.findIndex(h => h.toLowerCase() === 'description');
        const iconIdx = headers.findIndex(h => h.toLowerCase() === 'icon');
        const parentIdx = headers.findIndex(h => h.toLowerCase() === 'parent' || h.toLowerCase() === 'parentcategoryid');

        if (nameIdx === -1) {
          return { success: false, created: 0, errors: ['CSV must contain a "name" column.'] };
        }

        const categoriesList = getMockCategories();
        let createdCount = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row) continue;
          const cols = row.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const name = cols[nameIdx] || '';
          if (!name) {
            errors.push(`Row ${i + 1}: Name cannot be empty.`);
            continue;
          }

          const slug = slugIdx !== -1 && cols[slugIdx] ? cols[slugIdx] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const description = descIdx !== -1 ? cols[descIdx] : '';
          const icon = iconIdx !== -1 ? cols[iconIdx] : '📁';
          const parentVal = parentIdx !== -1 ? cols[parentIdx] : '';

          let parentCategoryId: string | undefined = undefined;
          if (parentVal) {
            const parentCat = categoriesList.find(c => c.id === parentVal || c.name.toLowerCase() === parentVal.toLowerCase());
            if (parentCat) {
              parentCategoryId = parentCat.id;
            }
          }

          const newCategory: Category = {
            id: 'cat_mock_' + Math.floor(Math.random() * 1000000),
            name,
            slug,
            description,
            icon,
            parentCategoryId,
            subCategories: []
          };

          if (parentCategoryId) {
            const p = categoriesList.find(c => c.id === parentCategoryId);
            if (p) {
              if (!p.subCategories) p.subCategories = [];
              p.subCategories.push(newCategory.id);
            }
          }

          categoriesList.push(newCategory);
          createdCount++;
        }

        saveMockCategories(categoriesList);
        return { success: true, created: createdCount, errors };
      } catch (err: any) {
        return { success: false, created: 0, errors: [err.message || 'CSV parse failed.'] };
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.request<CategoryImportResponse>('/api/v1/categories/import-csv/', {
        method: 'POST',
        body: formData
      });
      isLoading.value = false;
      return res;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to import CSV categories.';
      isLoading.value = false;
      throw err;
    }
  };

  const importCategoriesFromJSON = async (file: File): Promise<CategoryImportResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : (data.categories || [data]);
        
        const categoriesList = getMockCategories();
        let createdCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (!item.name) {
            errors.push(`Item ${i + 1}: Name is required.`);
            continue;
          }

          const name = item.name;
          const slug = item.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const description = item.description || '';
          const icon = item.icon || '📁';
          const parentVal = item.parent || item.parentCategoryId || '';

          let parentCategoryId: string | undefined = undefined;
          if (parentVal) {
            const parentCat = categoriesList.find(c => c.id === parentVal || c.name.toLowerCase() === parentVal.toLowerCase());
            if (parentCat) {
              parentCategoryId = parentCat.id;
            }
          }

          const newCategory: Category = {
            id: 'cat_mock_' + Math.floor(Math.random() * 1000000),
            name,
            slug,
            description,
            icon,
            parentCategoryId,
            subCategories: []
          };

          if (parentCategoryId) {
            const p = categoriesList.find(c => c.id === parentCategoryId);
            if (p) {
              if (!p.subCategories) p.subCategories = [];
              p.subCategories.push(newCategory.id);
            }
          }

          categoriesList.push(newCategory);
          createdCount++;
        }

        saveMockCategories(categoriesList);
        return { success: true, created: createdCount, errors };
      } catch (err: any) {
        return { success: false, created: 0, errors: [err.message || 'JSON parse failed.'] };
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.request<CategoryImportResponse>('/api/v1/categories/import-json/', {
        method: 'POST',
        body: formData
      });
      isLoading.value = false;
      return res;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to import JSON categories.';
      isLoading.value = false;
      throw err;
    }
  };

  const importCategoriesFromXLSX = async (file: File): Promise<CategoryImportResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      isLoading.value = false;
      
      const categoriesList = getMockCategories();
      const mockNames = ['Rack Cabinets', 'PDU Systems', 'SFP Transceivers', 'Patch Cables', 'Management Consoles'];
      let createdCount = 0;

      mockNames.forEach(name => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!categoriesList.some(c => c.slug === slug)) {
          categoriesList.push({
            id: 'cat_mock_' + Math.floor(Math.random() * 1000000),
            name,
            slug,
            description: `Auto-generated category imported from premium Excel spreadsheet node: ${name}`,
            icon: '📦',
            subCategories: []
          });
          createdCount++;
        }
      });

      saveMockCategories(categoriesList);
      return { success: true, created: createdCount, errors: [] };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.request<CategoryImportResponse>('/api/v1/categories/import-xlsx/', {
        method: 'POST',
        body: formData
      });
      isLoading.value = false;
      return res;
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Failed to import XLSX categories.';
      isLoading.value = false;
      throw err;
    }
  };

  const getRootCategories = async (params: { page?: number; page_size?: number } = { page: 1 }): Promise<Category[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    const page = params.page || 1;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    if (params.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/categories/roots/${queryString ? `?${queryString}` : ''}`;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const res = getMockCategories()
        .filter(c => !c.parentCategoryId)
        .map(c => ({
          ...c,
          has_children: typeof c.has_children === 'boolean'
            ? c.has_children
            : Boolean(c.children?.length || c.subCategories?.length)
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return res;
    }

    try {
      const data = await apiClient.request<PaginatedResponse<Category> | Category[]>(endpoint, {
        method: 'GET'
      });
      isLoading.value = false;

      let results: Category[] = [];
      if (data && typeof data === 'object') {
        if ('results' in data && Array.isArray(data.results)) {
          results = data.results.map(mapCategoryResponse);
        } else if ('data' in data && Array.isArray(data.data)) {
          results = data.data.map(mapCategoryResponse);
        } else if (Array.isArray(data)) {
          results = data.map(mapCategoryResponse);
        }
      }
      return results;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve root categories.');
      isLoading.value = false;
      throw err;
    }
  };

  const getCategoryUrl = (cat: Category, customList?: Category[]): string => {
    const list = customList || getMockCategories();
    const path: string[] = [cat.slug];
    let current = cat;
    for (let depth = 0; depth < 10; depth++) {
      if (!current.parentCategoryId) break;
      const parent = list.find(p => p.id === current.parentCategoryId);
      if (!parent) break;
      path.unshift(parent.slug);
      current = parent;
    }
    return `/product-category/${path.join('/')}/`;
  };

  const isChildrenLoading = (parentId: string | number): boolean => {
    return loadingParentIds.value.has(String(parentId));
  };

  const getChildrenForParent = (parentId: string | number): Category[] => {
    return categoryChildrenCache.value[String(parentId)] || [];
  };

  const hasChildrenLoaded = (parentId: string | number): boolean => {
    return loadedChildrenParentIds.value.has(String(parentId));
  };

  const storeChildrenInCache = (parentId: string | number, children: Category[]) => {
    const key = String(parentId);
    categoryChildrenCache.value[key] = children;
    loadedChildrenParentIds.value.add(key);
  };

  const getCategoryChildrenBatch = async (parentIds: (string | number)[]): Promise<Category[]> => {
    if (!parentIds.length) return [];

    const parentIdStrings = parentIds.map(String);
    const missingParentIds = parentIdStrings.filter(id => !loadedChildrenParentIds.value.has(id));

    // If all requested parent IDs already have their direct children loaded, return from cache immediately
    if (missingParentIds.length === 0) {
      const allCached: Category[] = [];
      parentIdStrings.forEach(pId => {
        const cached = categoryChildrenCache.value[pId];
        if (cached) {
          allCached.push(...cached);
        }
      });
      return allCached;
    }

    // Mark parent IDs as currently loading
    missingParentIds.forEach(id => loadingParentIds.value.add(id));

    const idsParam = missingParentIds.join(',');
    const endpoint = `/api/v1/categories/children/?ids=${encodeURIComponent(idsParam)}`;

    if (checkMockMode()) {
      try {
        await new Promise(resolve => setTimeout(resolve, 150));
        const allMock = getMockCategories();
        missingParentIds.forEach(pId => {
          const children = allMock
            .filter(c => String(c.parentCategoryId) === pId)
            .map(mapCategoryResponse);
          storeChildrenInCache(pId, children);
        });

        const result: Category[] = [];
        parentIdStrings.forEach(pId => {
          result.push(...getChildrenForParent(pId));
        });
        return result;
      } finally {
        missingParentIds.forEach(id => loadingParentIds.value.delete(id));
      }
    }

    try {
      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      let rawItems: any[] = [];
      if (Array.isArray(data)) {
        rawItems = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          rawItems = data.results;
        } else if (Array.isArray(data.data)) {
          rawItems = data.data;
        } else {
          // In case DRF returns { [parentId]: Category[] }
          Object.entries(data).forEach(([parentId, children]) => {
            if (Array.isArray(children)) {
              children.forEach(ch => {
                rawItems.push({
                  ...ch,
                  parentCategoryId: ch.parentCategoryId ?? ch.parent ?? parentId
                });
              });
            }
          });
        }
      }

      const fetchedChildren = rawItems.map(mapCategoryResponse);

      // Store fetched direct children in cache keyed by parent category ID
      missingParentIds.forEach(pId => {
        const childrenForParent = fetchedChildren.filter(
          child => String(child.parentCategoryId) === pId
        );
        storeChildrenInCache(pId, childrenForParent);
      });

      const combinedResult: Category[] = [];
      parentIdStrings.forEach(pId => {
        combinedResult.push(...getChildrenForParent(pId));
      });

      return combinedResult;
    } catch (err: any) {
      console.warn('Failed to load category children batch:', err.message || err);
      const fallbackResult: Category[] = [];
      parentIdStrings.forEach(pId => {
        fallbackResult.push(...getChildrenForParent(pId));
      });
      return fallbackResult;
    } finally {
      missingParentIds.forEach(id => loadingParentIds.value.delete(id));
    }
  };

  return {
    getCategoriesList,
    getRootCategories,
    getCategoryChildrenBatch,
    getChildrenForParent,
    hasChildrenLoaded,
    isChildrenLoading,
    storeChildrenInCache,
    categoryChildrenCache,
    loadedChildrenParentIds,
    loadingParentIds,
    getCategoryDetails,
    getCategoryUrl,
    createCategory,
    updateCategory,
    deleteCategory,
    importCategoriesFromCSV,
    importCategoriesFromJSON,
    importCategoriesFromXLSX,
    isLoading,
    errorMsg
  };
};

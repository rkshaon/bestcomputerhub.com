// File: /composables/useCategoryService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useProductService } from './useProductService';
import { extractErrorMessage } from './useToast';
import type { Category, PaginatedResponse, CategoryFilters, PaginatedCategoriesResponse, CategoryImportResponse, CategorySummaryResponse, BulkMenuUpdateResponse, CategoryPathItem, CategoryPathResponse, CategoryPriceRange, FeaturedCategory, FeaturedCategoriesReorderRequest, FeaturedCategoriesReorderResponse } from '@/types';

const CATEGORIES_STORAGE_KEY = 'techcore_mock_categories_registry';

// Storefront direct category children cache keyed by parent category ID
const categoryChildrenCache = ref<Record<string, Category[]>>({});
const loadedChildrenParentIds = ref<Set<string>>(new Set());
const loadingParentIds = ref<Set<string>>(new Set());
const expandedCategoryIds = ref<Set<string>>(new Set());
const categoryParentMap = new Map<string, string | null>();

export const useCategoryService = () => {
  const apiClient = useApiClient();
  const productService = useProductService();

  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  const mapCategoryResponse = (cat: any): Category => {
    if (!cat) return cat;
    let parentId: string | undefined = undefined;
    const rawParent = cat.parentCategoryId ?? cat.parent_category_id ?? cat.parent_id ?? cat.parent_category ?? cat.parent_slug ?? cat.parent;
    if (rawParent !== undefined && rawParent !== null) {
      if (typeof rawParent === 'object') {
        parentId = rawParent.id !== undefined && rawParent.id !== null 
          ? String(rawParent.id) 
          : (rawParent.slug ? String(rawParent.slug) : undefined);
      } else {
        parentId = String(rawParent);
      }
    }
    const mapped: Category = {
      ...cat,
      id: String(cat.id),
      short_description_title: cat.short_description_title !== undefined && cat.short_description_title !== null ? String(cat.short_description_title) : '',
      short_description: cat.short_description !== undefined && cat.short_description !== null ? String(cat.short_description) : '',
      parentCategoryId: parentId,
      order: cat.display_order !== undefined ? Number(cat.display_order) : (cat.order !== undefined ? Number(cat.order) : 0),
      display_order: cat.display_order !== undefined ? Number(cat.display_order) : (cat.order !== undefined ? Number(cat.order) : 0),
      show_in_menu: cat.show_in_menu !== undefined ? Boolean(cat.show_in_menu) : (cat.is_menu !== undefined ? Boolean(cat.is_menu) : true),
      is_menu: cat.is_menu !== undefined ? Boolean(cat.is_menu) : (cat.show_in_menu !== undefined ? Boolean(cat.show_in_menu) : true),
      is_featured: cat.is_featured !== undefined ? Boolean(cat.is_featured) : false,
      featured_display_order: cat.featured_display_order !== undefined ? Number(cat.featured_display_order) : undefined,
      featured_icon: cat.featured_icon !== undefined ? (cat.featured_icon || null) : null,
      has_children: typeof cat.has_children === 'boolean'
        ? cat.has_children
        : Boolean(cat.children?.length || cat.subCategories?.length)
    };
    if (mapped.id) {
      categoryParentMap.set(String(mapped.id), parentId ? String(parentId) : null);
    }
    if (cat.children && Array.isArray(cat.children)) {
      mapped.children = cat.children.map(mapCategoryResponse);
    }
    return mapped;
  };

  const mapFeaturedCategoryResponse = (cat: any): FeaturedCategory => {
    if (!cat) return cat;
    return {
      id: typeof cat.id === 'number' ? cat.id : String(cat.id),
      name: cat.name || '',
      slug: cat.slug || '',
      featured_icon: cat.featured_icon !== undefined ? (cat.featured_icon || null) : (cat.icon || null),
      icon: cat.icon,
      image: cat.image,
      is_featured: cat.is_featured !== undefined ? Boolean(cat.is_featured) : true,
      featured_display_order: cat.featured_display_order !== undefined ? Number(cat.featured_display_order) : (cat.display_order !== undefined ? Number(cat.display_order) : undefined),
      description: cat.description,
      short_description: cat.short_description,
      short_description_title: cat.short_description_title
    };
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
    const is_menu = filters.is_menu;
    const menu = filters.menu;

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

      if (is_menu) {
        list = list.filter(c => Boolean(c.show_in_menu || c.is_menu));
      }
      if (menu && menu !== 'all') {
        if (menu === 'menu_only') {
          list = list.filter(c => Boolean(c.show_in_menu || c.is_menu));
        } else {
          list = list.filter(c => String(c.id) === String(menu) || c.slug === menu);
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
        pages: totalPages,
        next: page < totalPages ? `?page=${page + 1}` : null,
        previous: page > 1 ? `?page=${page - 1}` : null
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
      if (is_menu !== undefined) {
        params.append('is_menu', is_menu.toString());
      }
      if (menu) {
        params.append('menu', menu);
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
      let nextUrl: string | null = null;
      let prevUrl: string | null = null;

      if (data && typeof data === 'object') {
        if ('next' in data) nextUrl = data.next ?? null;
        if ('previous' in data) prevUrl = data.previous ?? null;

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

      if (!nextUrl && page < totalPages) {
        nextUrl = `?page=${page + 1}`;
      }

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages,
        next: nextUrl,
        previous: prevUrl
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
        pages: totalPages,
        next: page < totalPages ? `?page=${page + 1}` : null,
        previous: page > 1 ? `?page=${page - 1}` : null
      };
    }
  };

  const getCategorySummary = async (): Promise<CategorySummaryResponse> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const list = getMockCategories();
      const rootCount = list.filter(c => !c.parentCategoryId).length;
      const subCount = list.filter(c => !!c.parentCategoryId).length;
      const menuRootCount = list.filter(c => !c.parentCategoryId && (c.show_in_menu || c.is_menu)).length;
      const menuSubCount = list.filter(c => !!c.parentCategoryId && (c.show_in_menu || c.is_menu)).length;
      return {
        total_categories: list.length,
        root_categories: rootCount,
        sub_categories: subCount,
        menu_categories: menuRootCount,
        sub_menu_categories: menuSubCount
      };
    }

    try {
      const data = await apiClient.request<CategorySummaryResponse>('/api/v1/categories/summary/', {
        method: 'GET'
      });
      isLoading.value = false;
      return {
        total_categories: data?.total_categories ?? 0,
        root_categories: data?.root_categories ?? 0,
        sub_categories: data?.sub_categories ?? 0,
        menu_categories: data?.menu_categories,
        sub_menu_categories: data?.sub_menu_categories
      };
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve category summary.');
      isLoading.value = false;
      const list = getMockCategories();
      const rootCount = list.filter(c => !c.parentCategoryId).length;
      const subCount = list.filter(c => !!c.parentCategoryId).length;
      const menuRootCount = list.filter(c => !c.parentCategoryId && (c.show_in_menu || c.is_menu)).length;
      const menuSubCount = list.filter(c => !!c.parentCategoryId && (c.show_in_menu || c.is_menu)).length;
      return {
        total_categories: list.length,
        root_categories: rootCount,
        sub_categories: subCount,
        menu_categories: menuRootCount,
        sub_menu_categories: menuSubCount
      };
    }
  };

  const getCategoryDetails = async (id: string): Promise<Category | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      isLoading.value = false;
      return getMockCategories().find(c => c.id === id || c.slug === id) || null;
    }

    try {
      let resolvedId = id;
      // If the ID is a non-numeric slug, resolve it to the numeric ID first
      if (id && !/^\d+$/.test(id.trim())) {
        const listRes = await getCategoriesList({ search: id, page_size: 10 });
        const exactMatch = listRes.results.find(c => c.slug?.toLowerCase() === id.trim().toLowerCase());
        if (exactMatch && exactMatch.id) {
          resolvedId = String(exactMatch.id);
        } else {
          // Fall back to mock if not found in backend list
          const mockMatch = getMockCategories().find(c => c.slug === id || c.id === id);
          if (mockMatch) {
            isLoading.value = false;
            return mockMatch;
          }
          isLoading.value = false;
          return null;
        }
      }

      const data = await apiClient.request<any>(`/api/v1/categories/${resolvedId}/`, {
        method: 'GET'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve category details.');
      isLoading.value = false;
      return getMockCategories().find(c => c.id === id || c.slug === id) || null;
    }
  };

  const createCategory = async (payload: { name: string; slug: string; short_description_title?: string; short_description?: string; description: string; parentCategoryId?: string; icon?: string; image?: string; order?: number }): Promise<Category> => {
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
        short_description_title: payload.short_description_title !== undefined ? payload.short_description_title.trim() : '',
        short_description: payload.short_description !== undefined ? payload.short_description.trim() : '',
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
      const { parentCategoryId, short_description, short_description_title, ...rest } = payload;
      const apiPayload = {
        ...rest,
        short_description: short_description !== undefined ? short_description.trim() : '',
        short_description_title: short_description_title !== undefined ? short_description_title.trim() : '',
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

  const updateCategory = async (
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      short_description_title: string;
      short_description: string;
      description: string;
      parentCategoryId: string;
      icon: string;
      image: string;
      order: number;
      show_in_menu: boolean;
      is_menu: boolean;
    }>
  ): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (payload.name !== undefined && !payload.name.trim()) {
      const err = new Error('Category name designation is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }
    if (payload.slug !== undefined && !payload.slug.trim()) {
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

      if (payload.slug !== undefined && categoriesList.some((c, i) => i !== idx && c.slug.toLowerCase() === payload.slug!.toLowerCase())) {
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
        ...existingCategory,
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.slug !== undefined ? { slug: payload.slug.trim().toLowerCase() } : {}),
        ...(payload.short_description_title !== undefined ? { short_description_title: payload.short_description_title.trim() } : {}),
        ...(payload.short_description !== undefined ? { short_description: payload.short_description.trim() } : {}),
        ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
        ...(payload.parentCategoryId !== undefined ? { parentCategoryId: payload.parentCategoryId || undefined } : {}),
        ...(payload.icon !== undefined ? { icon: payload.icon || undefined } : {}),
        ...(payload.image !== undefined ? { image: payload.image || undefined } : {}),
        ...(payload.order !== undefined ? { order: Number(payload.order) || 0 } : {}),
        ...(payload.show_in_menu !== undefined ? { show_in_menu: Boolean(payload.show_in_menu) } : {}),
        ...(payload.is_menu !== undefined ? { is_menu: Boolean(payload.is_menu) } : {})
      };

      // Handle custom parent transitions in mock storage
      if (payload.parentCategoryId !== undefined && oldParent !== payload.parentCategoryId) {
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
      const { parentCategoryId, short_description, short_description_title, ...rest } = payload;
      const apiPayload: any = {
        ...rest
      };
      if (short_description !== undefined) {
        apiPayload.short_description = short_description.trim();
      }
      if (short_description_title !== undefined) {
        apiPayload.short_description_title = short_description_title.trim();
      }
      if (parentCategoryId !== undefined) {
        apiPayload.parent = parentCategoryId || null;
      }
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/`, {
        method: 'PATCH',
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

  const markAsMenu = async (slug: string): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => c.slug === slug || c.id === slug);
      if (cat) {
        cat.show_in_menu = true;
        cat.is_menu = true;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${slug} not found.`);
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${slug}/mark-as-menu/`, {
        method: 'POST'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to mark category as menu.');
      isLoading.value = false;
      throw err;
    }
  };

  const removeFromMenu = async (slug: string): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => c.slug === slug || c.id === slug);
      if (cat) {
        cat.show_in_menu = false;
        cat.is_menu = false;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${slug} not found.`);
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${slug}/remove-from-menu/`, {
        method: 'POST'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to remove category from menu.');
      isLoading.value = false;
      throw err;
    }
  };

  const bulkUpdateMenu = async (
    ids: (string | number)[],
    showInMenu: boolean
  ): Promise<BulkMenuUpdateResponse> => {
    if (!ids.length) {
      return { updated_count: 0, show_in_menu: showInMenu };
    }

    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const idStrings = new Set(ids.map(String));
      let count = 0;

      categoriesList.forEach(cat => {
        if (idStrings.has(String(cat.id)) || (cat.slug && idStrings.has(cat.slug))) {
          cat.show_in_menu = showInMenu;
          cat.is_menu = showInMenu;
          count++;
        }
      });

      saveMockCategories(categoriesList);
      return { updated_count: count, show_in_menu: showInMenu };
    }

    try {
      const parsedIds = ids.map(id => {
        const num = Number(id);
        return !isNaN(num) && String(num) === String(id).trim() ? num : id;
      });

      const res = await apiClient.request<BulkMenuUpdateResponse>('/api/v1/categories/bulk-menu-update/', {
        method: 'POST',
        body: {
          ids: parsedIds,
          show_in_menu: showInMenu
        }
      });
      isLoading.value = false;
      return res;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to update categories menu status.');
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

  const getRootCategories = async (params: { page?: number; page_size?: number; is_menu?: boolean } = { page: 1 }): Promise<Category[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    const page = params.page || 1;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    if (params.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }
    if (params.is_menu !== undefined) {
      queryParams.append('is_menu', params.is_menu.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/categories/roots/${queryString ? `?${queryString}` : ''}`;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      let mockList = getMockCategories().filter(c => !c.parentCategoryId);
      if (params.is_menu) {
        mockList = mockList.filter(c => c.show_in_menu === true || c.is_menu === true);
      }
      const res = mockList
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

  const isChildrenLoading = (parentId: string | number, isMenu?: boolean): boolean => {
    const key = String(parentId);
    let targetIsMenu = isMenu;
    if (targetIsMenu === undefined) {
      const route = useRoute();
      const isAdmin = route && route.path && route.path.includes('/admin/');
      targetIsMenu = !isAdmin;
    }
    const cacheKey = `${key}:${targetIsMenu ? 'menu' : 'all'}`;
    return loadingParentIds.value.has(cacheKey);
  };

  const getChildrenForParent = (parentId: string | number, isMenu?: boolean): Category[] => {
    const key = String(parentId);
    let targetIsMenu = isMenu;
    if (targetIsMenu === undefined) {
      const route = useRoute();
      const isAdmin = route && route.path && route.path.includes('/admin/');
      targetIsMenu = !isAdmin;
    }

    if (targetIsMenu) {
      if (loadedChildrenParentIds.value.has(`${key}:all`)) {
        const unfiltered = categoryChildrenCache.value[`${key}:all`] || [];
        return unfiltered.filter(c => c.show_in_menu === true || c.is_menu === true);
      }
      return categoryChildrenCache.value[`${key}:menu`] || [];
    } else {
      return categoryChildrenCache.value[`${key}:all`] || [];
    }
  };

  const hasChildrenLoaded = (parentId: string | number, isMenu?: boolean): boolean => {
    const key = String(parentId);
    if (isMenu === true) {
      return loadedChildrenParentIds.value.has(`${key}:all`) || loadedChildrenParentIds.value.has(`${key}:menu`);
    } else if (isMenu === false) {
      return loadedChildrenParentIds.value.has(`${key}:all`);
    } else {
      const route = useRoute();
      const isAdmin = route && route.path && route.path.includes('/admin/');
      if (isAdmin) {
        return loadedChildrenParentIds.value.has(`${key}:all`);
      } else {
        return loadedChildrenParentIds.value.has(`${key}:all`) || loadedChildrenParentIds.value.has(`${key}:menu`);
      }
    }
  };

  const isNodeExpanded = (id: string | number): boolean => {
    return expandedCategoryIds.value.has(String(id));
  };

  const collapseDescendants = (parentId: string, set: Set<string>) => {
    // Check both potential cache entries
    const children = [
      ...(categoryChildrenCache.value[`${parentId}:all`] || []),
      ...(categoryChildrenCache.value[`${parentId}:menu`] || [])
    ];
    children.forEach(child => {
      const childId = String(child.id);
      if (set.has(childId)) {
        set.delete(childId);
        collapseDescendants(childId, set);
      }
    });

    for (const [catId, pId] of categoryParentMap.entries()) {
      if (pId === parentId && set.has(catId)) {
        set.delete(catId);
        collapseDescendants(catId, set);
      }
    }
  };

  const setNodeExpanded = (
    id: string | number,
    isExpanded: boolean,
    parentId?: string | number | null
  ) => {
    const key = String(id);

    if (parentId !== undefined) {
      categoryParentMap.set(key, parentId !== null ? String(parentId) : null);
    }

    if (isExpanded) {
      const nodeParentId = categoryParentMap.has(key)
        ? categoryParentMap.get(key)
        : (parentId !== undefined && parentId !== null ? String(parentId) : null);

      const updated = new Set(expandedCategoryIds.value);

      // Sibling-level accordion: collapse only expanded categories that share the same immediate parent
      for (const expId of updated) {
        if (expId !== key) {
          const expParentId = categoryParentMap.has(expId)
            ? categoryParentMap.get(expId)
            : null;

          if (expParentId === nodeParentId) {
            updated.delete(expId);
            collapseDescendants(expId, updated);
          }
        }
      }

      updated.add(key);
      expandedCategoryIds.value = updated;
    } else {
      const updated = new Set(expandedCategoryIds.value);
      updated.delete(key);
      collapseDescendants(key, updated);
      expandedCategoryIds.value = updated;
    }
  };

  const toggleNodeExpanded = (
    id: string | number,
    forceState?: boolean,
    parentId?: string | number | null
  ): boolean => {
    const key = String(id);
    const willExpand = forceState !== undefined ? forceState : !expandedCategoryIds.value.has(key);
    setNodeExpanded(id, willExpand, parentId);
    return willExpand;
  };

  const expandNode = (id: string | number, parentId?: string | number | null) => {
    setNodeExpanded(id, true, parentId);
  };

  const collapseNode = (id: string | number) => {
    setNodeExpanded(id, false);
  };

  const storeChildrenInCache = (parentId: string | number, children: Category[], isMenu?: boolean) => {
    const key = String(parentId);
    let targetIsMenu = isMenu;
    if (targetIsMenu === undefined) {
      const hasNonMenu = children.some(c => c.show_in_menu === false || c.is_menu === false);
      targetIsMenu = !hasNonMenu;
    }

    const cacheKey = `${key}:${targetIsMenu ? 'menu' : 'all'}`;

    categoryChildrenCache.value = {
      ...categoryChildrenCache.value,
      [cacheKey]: children
    };
    children.forEach(child => {
      if (child.id) {
        categoryParentMap.set(String(child.id), key);
      }
    });
    const updatedLoadedSet = new Set(loadedChildrenParentIds.value);
    updatedLoadedSet.add(cacheKey);
    loadedChildrenParentIds.value = updatedLoadedSet;
  };

  const getCategoryChildrenBatch = async (
    parentIds: (string | number)[],
    options: { force?: boolean; is_menu?: boolean } = {}
  ): Promise<Category[]> => {
    if (!parentIds.length) return [];

    const parentIdStrings = parentIds.map(String);
    const isMenuOpt = options.is_menu;
    const missingParentIds = options.force
      ? parentIdStrings
      : parentIdStrings.filter(id => !hasChildrenLoaded(id, isMenuOpt));

    // If all requested parent IDs already have their direct children loaded and not forcing, return from cache immediately
    if (missingParentIds.length === 0 && !options.force) {
      const allCached: Category[] = [];
      parentIdStrings.forEach(pId => {
        const cached = getChildrenForParent(pId, isMenuOpt);
        allCached.push(...cached);
      });
      return allCached;
    }

    if (checkMockMode()) {
      try {
        await new Promise(resolve => setTimeout(resolve, 150));
        const allMock = getMockCategories();
        missingParentIds.forEach(pId => {
          let children = allMock.filter(c => String(c.parentCategoryId) === pId);
          if (options.is_menu) {
            children = children.filter(c => c.show_in_menu === true || c.is_menu === true);
          }
          const mapped = children.map(mapCategoryResponse);
          storeChildrenInCache(pId, mapped, options.is_menu);
        });

        const result: Category[] = [];
        parentIdStrings.forEach(pId => {
          result.push(...getChildrenForParent(pId, isMenuOpt));
        });
        return result;
      } finally {
        missingParentIds.forEach(id => {
          const cacheKey = `${id}:${isMenuOpt ? 'menu' : 'all'}`;
          loadingParentIds.value.delete(cacheKey);
        });
      }
    }

    // Real API mode: filter out and resolve non-numeric (mock/slug) IDs instantly from mock categories
    // to prevent cache-poisoning or invalid API requests.
    const numericMissingIds: string[] = [];
    const nonNumericMissingIds: string[] = [];

    missingParentIds.forEach(id => {
      if (/^\d+$/.test(id)) {
        numericMissingIds.push(id);
      } else {
        nonNumericMissingIds.push(id);
      }
    });

    // Instantly resolve non-numeric IDs using mock categories
    nonNumericMissingIds.forEach(pId => {
      const allMock = getMockCategories();
      let children = allMock.filter(c => String(c.parentCategoryId) === pId);
      if (options.is_menu) {
        children = children.filter(c => c.show_in_menu === true || c.is_menu === true);
      }
      const mapped = children.map(mapCategoryResponse);
      storeChildrenInCache(pId, mapped, options.is_menu);
    });

    // If there are no numeric missing IDs left to load, return everything from cache
    if (numericMissingIds.length === 0) {
      const result: Category[] = [];
      parentIdStrings.forEach(pId => {
        result.push(...getChildrenForParent(pId, isMenuOpt));
      });
      return result;
    }

    // Mark remaining numeric parent IDs as currently loading
    numericMissingIds.forEach(id => {
      const cacheKey = `${id}:${isMenuOpt ? 'menu' : 'all'}`;
      loadingParentIds.value.add(cacheKey);
    });

    const idsParam = numericMissingIds.join(',');
    const queryParams = new URLSearchParams();
    queryParams.append('ids', idsParam);
    if (options.is_menu !== undefined) {
      queryParams.append('is_menu', options.is_menu.toString());
    }
    const endpoint = `/api/v1/categories/children/?${queryParams.toString()}`;

    try {
      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      let rawItems: any[] = [];
      const processDictionary = (dict: Record<string, any>) => {
        Object.entries(dict).forEach(([parentId, children]) => {
          if (Array.isArray(children)) {
            children.forEach(ch => {
              rawItems.push({
                ...ch,
                parentCategoryId: ch.parentCategoryId ?? ch.parent_category_id ?? ch.parent_id ?? ch.parent_category ?? ch.parent_slug ?? ch.parent ?? parentId
              });
            });
          }
        });
      };

      if (Array.isArray(data)) {
        rawItems = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          rawItems = data.results;
        } else if (Array.isArray(data.data)) {
          rawItems = data.data;
        } else if (data.results && typeof data.results === 'object') {
          processDictionary(data.results);
        } else if (data.data && typeof data.data === 'object') {
          processDictionary(data.data);
        } else {
          processDictionary(data);
        }
      }

      const fetchedChildren = rawItems.map(mapCategoryResponse);

      // Check if the backend response contains any usable parent identifier for the missing parent IDs
      const responseHasParentIdentifiers = fetchedChildren.some(
        child => child.parentCategoryId !== undefined && numericMissingIds.includes(String(child.parentCategoryId))
      );

      // Store fetched direct children in cache keyed by parent category ID
      numericMissingIds.forEach(pId => {
        const normalizedPId = String(pId);
        let childrenForParent = fetchedChildren.filter(
          child => child.parentCategoryId !== undefined && String(child.parentCategoryId) === normalizedPId
        );

        // Fallback for single parent request if parentCategoryId was not explicitly returned on child objects
        if (childrenForParent.length === 0 && numericMissingIds.length === 1 && fetchedChildren.length > 0) {
          fetchedChildren.forEach(child => {
            child.parentCategoryId = normalizedPId;
          });
          childrenForParent = fetchedChildren;
        }

        // Only store/cache if we are confident:
        // - It's a single parent request (fallback was applied or genuinely empty)
        // - Or there are genuinely no children in the response (all requested parents are empty)
        // - Or the response genuinely contains parent identifiers to map children
        const isConfident = 
          numericMissingIds.length === 1 || 
          fetchedChildren.length === 0 || 
          responseHasParentIdentifiers;

        if (isConfident) {
          storeChildrenInCache(normalizedPId, childrenForParent, options.is_menu);
        }
      });

      const combinedResult: Category[] = [];
      parentIdStrings.forEach(pId => {
        combinedResult.push(...getChildrenForParent(pId, isMenuOpt));
      });

      return combinedResult;
    } catch (err: any) {
      console.warn('Failed to load category children batch:', err.message || err);
      const fallbackResult: Category[] = [];
      parentIdStrings.forEach(pId => {
        fallbackResult.push(...getChildrenForParent(pId, isMenuOpt));
      });
      return fallbackResult;
    } finally {
      numericMissingIds.forEach(id => {
        const cacheKey = `${id}:${isMenuOpt ? 'menu' : 'all'}`;
        loadingParentIds.value.delete(cacheKey);
      });
    }
  };

  const refreshChildrenForParent = async (parentId: string | number): Promise<Category[]> => {
    const key = String(parentId);
    return await getCategoryChildrenBatch([key], { force: true });
  };

  const reorderCategory = async (slug: string, displayOrder: number): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;

      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => c.slug === slug || String(c.id) === slug);
      if (cat) {
        cat.order = displayOrder;
        cat.display_order = displayOrder;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${slug} not found.`);
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${slug}/reorder/`, {
        method: 'POST',
        body: {
          display_order: displayOrder
        }
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to reorder category.');
      isLoading.value = false;
      throw err;
    }
  };

  const getCategoryPath = async (
    identifier: { id?: number | string; slug?: string } | number | string
  ): Promise<CategoryPathItem[]> => {
    let paramKey = 'slug';
    let paramVal = '';

    if (typeof identifier === 'object' && identifier !== null) {
      if (identifier.id !== undefined && identifier.id !== null && identifier.id !== '') {
        paramKey = 'id';
        paramVal = String(identifier.id);
      } else if (identifier.slug) {
        paramKey = 'slug';
        paramVal = String(identifier.slug);
      }
    } else if (typeof identifier === 'number') {
      paramKey = 'id';
      paramVal = String(identifier);
    } else if (typeof identifier === 'string') {
      if (/^\d+$/.test(identifier.trim())) {
        paramKey = 'id';
        paramVal = identifier.trim();
      } else {
        paramKey = 'slug';
        paramVal = identifier.trim();
      }
    }

    if (!paramVal) return [];

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const categoriesList: Category[] = getMockCategories();
      const targetCat: Category | undefined = categoriesList.find(c => String(c.id) === paramVal || c.slug === paramVal);
      if (!targetCat) return [];

      const trail: CategoryPathItem[] = [];
      let current: Category | undefined = targetCat;
      while (current) {
        trail.unshift({
          id: current.id,
          slug: current.slug,
          name: current.name
        });
        if (current.parentCategoryId) {
          const parentIdToFind: string = String(current.parentCategoryId);
          current = categoriesList.find((c: Category) => String(c.id) === parentIdToFind || c.slug === parentIdToFind);
        } else {
          break;
        }
      }
      return trail;
    }

    try {
      const endpoint = `/api/v1/categories/path/?${paramKey}=${encodeURIComponent(paramVal)}`;
      const data = await apiClient.request<any>(endpoint, {
        method: 'GET'
      });

      if (data && typeof data === 'object') {
        if ('path' in data && Array.isArray(data.path)) {
          return data.path.map((item: any) => ({
            id: item.id !== undefined ? item.id : '',
            slug: String(item.slug || ''),
            name: String(item.name || '')
          }));
        }
        if (Array.isArray(data)) {
          return data.map((item: any) => ({
            id: item.id !== undefined ? item.id : '',
            slug: String(item.slug || ''),
            name: String(item.name || '')
          }));
        }
      }
      return [];
    } catch (err: any) {
      console.warn('Failed to retrieve category path:', err?.message || err);
      return [];
    }
  };

  const getCategoryPriceRange = async (idOrSlug: string | number): Promise<CategoryPriceRange | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      isLoading.value = false;
      const catProducts = productService.getProducts({
        category: String(idOrSlug)
      });
      if (catProducts && catProducts.length > 0) {
        const prices = catProducts.map(p => p.price).filter(p => typeof p === 'number' && !isNaN(p));
        if (prices.length > 0) {
          return {
            category_id: String(idOrSlug),
            min_price: Math.min(...prices),
            max_price: Math.max(...prices)
          };
        }
      }
      return {
        category_id: String(idOrSlug),
        min_price: null,
        max_price: null
      };
    }

    try {
      const endpoint = `/api/v1/categories/${idOrSlug}/price-range/`;
      const data = await apiClient.request<CategoryPriceRange>(endpoint, {
        method: 'GET'
      });
      isLoading.value = false;
      return data;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to retrieve category price range.');
      isLoading.value = false;
      const catProducts = productService.getProducts({
        category: String(idOrSlug)
      });
      if (catProducts && catProducts.length > 0) {
        const prices = catProducts.map(p => p.price).filter(p => typeof p === 'number' && !isNaN(p));
        if (prices.length > 0) {
          return {
            category_id: String(idOrSlug),
            min_price: Math.min(...prices),
            max_price: Math.max(...prices)
          };
        }
      }
      return {
        category_id: String(idOrSlug),
        min_price: null,
        max_price: null
      };
    }
  };

  const getFeaturedCategories = async (): Promise<FeaturedCategory[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      const featured = categoriesList
        .filter(c => c.is_featured === true)
        .sort((a, b) => (a.featured_display_order ?? a.order ?? 0) - (b.featured_display_order ?? b.order ?? 0))
        .map(mapFeaturedCategoryResponse);
      return featured;
    }

    try {
      const data = await apiClient.request<any>('/api/v1/categories/featured/', {
        method: 'GET'
      });
      isLoading.value = false;
      const results = Array.isArray(data) ? data : (data?.results || []);
      return results.map(mapFeaturedCategoryResponse);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to fetch featured categories.');
      isLoading.value = false;
      throw err;
    }
  };

  const uploadFeaturedCategoryIcon = async (
    id: string | number,
    iconFile: File
  ): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => String(c.id) === String(id) || c.slug === String(id));
      if (cat) {
        cat.featured_icon = URL.createObjectURL(iconFile);
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${id} not found.`);
    }

    try {
      const formData = new FormData();
      formData.append('featured_icon', iconFile);

      const data = await apiClient.request<any>(`/api/v1/categories/${id}/featured-icon/`, {
        method: 'POST',
        body: formData
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to upload featured category icon.');
      isLoading.value = false;
      throw err;
    }
  };

  const featureCategory = async (id: string | number): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => String(c.id) === String(id) || c.slug === String(id));
      if (cat) {
        cat.is_featured = true;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${id} not found.`);
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/feature/`, {
        method: 'POST'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to mark category as featured.');
      isLoading.value = false;
      throw err;
    }
  };

  const unfeatureCategory = async (id: string | number): Promise<Category> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => String(c.id) === String(id) || c.slug === String(id));
      if (cat) {
        cat.is_featured = false;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      throw new Error(`Category ${id} not found.`);
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/unfeature/`, {
        method: 'POST'
      });
      isLoading.value = false;
      return mapCategoryResponse(data);
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to unfeature category.');
      isLoading.value = false;
      throw err;
    }
  };

  const deleteFeaturedCategoryIcon = async (id: string | number): Promise<Category | boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      const cat = categoriesList.find(c => String(c.id) === String(id) || c.slug === String(id));
      if (cat) {
        cat.featured_icon = null;
        saveMockCategories(categoriesList);
        return mapCategoryResponse(cat);
      }
      return true;
    }

    try {
      const data = await apiClient.request<any>(`/api/v1/categories/${id}/featured-icon/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return data ? mapCategoryResponse(data) : true;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to delete featured category icon.');
      isLoading.value = false;
      throw err;
    }
  };

  const reorderFeaturedCategories = async (
    categoryIds: (number | string)[]
  ): Promise<FeaturedCategoriesReorderResponse | FeaturedCategory[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    const parsedIds = categoryIds.map(id => {
      const num = Number(id);
      return !isNaN(num) && String(num) === String(id).trim() ? num : id;
    });

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      isLoading.value = false;
      const categoriesList = getMockCategories();
      parsedIds.forEach((id, idx) => {
        const cat = categoriesList.find(c => String(c.id) === String(id) || c.slug === String(id));
        if (cat) {
          cat.featured_display_order = idx + 1;
        }
      });
      saveMockCategories(categoriesList);
      return { success: true, category_ids: parsedIds };
    }

    try {
      const data = await apiClient.request<any>('/api/v1/categories/featured/reorder/', {
        method: 'PATCH',
        body: {
          category_ids: parsedIds
        }
      });
      isLoading.value = false;
      if (Array.isArray(data)) {
        return data.map(mapFeaturedCategoryResponse);
      }
      return data;
    } catch (err: any) {
      errorMsg.value = extractErrorMessage(err, 'Failed to reorder featured categories.');
      isLoading.value = false;
      throw err;
    }
  };

  return {
    getCategoriesList,
    getCategorySummary,
    getRootCategories,
    getCategoryChildrenBatch,
    refreshChildrenForParent,
    reorderCategory,
    getCategoryPath,
    getCategoryPriceRange,
    getChildrenForParent,
    hasChildrenLoaded,
    isChildrenLoading,
    storeChildrenInCache,
    categoryChildrenCache,
    loadedChildrenParentIds,
    loadingParentIds,
    expandedCategoryIds,
    isNodeExpanded,
    setNodeExpanded,
    toggleNodeExpanded,
    expandNode,
    collapseNode,
    getCategoryDetails,
    getCategoryUrl,
    createCategory,
    updateCategory,
    deleteCategory,
    markAsMenu,
    removeFromMenu,
    bulkUpdateMenu,
    importCategoriesFromCSV,
    importCategoriesFromJSON,
    importCategoriesFromXLSX,
    getFeaturedCategories,
    uploadFeaturedCategoryIcon,
    setFeaturedCategoryIcon: uploadFeaturedCategoryIcon,
    featureCategory,
    markCategoryAsFeatured: featureCategory,
    unfeatureCategory,
    removeCategoryFromFeatured: unfeatureCategory,
    deleteFeaturedCategoryIcon,
    removeFeaturedCategoryIcon: deleteFeaturedCategoryIcon,
    reorderFeaturedCategories,
    isLoading,
    errorMsg
  };
};

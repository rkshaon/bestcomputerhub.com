// File: /composables/useMegaMenu.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { Category } from '@/types';

/**
 * Desktop mega-menu category tree state.
 *
 * Categories ARE the menu structure:
 *   root category -> hover -> category ID -> direct children -> submenu -> lazily deeper.
 *
 * Children are keyed strictly by the parent category ID. The
 * `GET /api/v1/categories/children/?ids=` endpoint returns a FLAT list of
 * children without any parent reference on each item, so this implementation
 * always requests exactly ONE parent ID per call. That keeps the parent ->
 * children association unambiguous and independently traceable.
 */

interface CategoryChildrenApiItem {
  id: string | number;
  name: string;
  slug: string;
  has_children?: boolean;
  icon?: string;
  image?: string;
  description?: string;
  order?: number;
}

// Module-level state so every mega-menu panel shares one cache per app instance
const childrenByParentId = ref<Record<string, Category[]>>({});
const loadedParentIds = ref<Set<string>>(new Set());
const loadingParentIds = ref<Set<string>>(new Set());

// Non-reactive de-duplication of concurrent requests for the same parent ID
const inFlightRequests = new Map<string, Promise<Category[]>>();

const toCategory = (item: CategoryChildrenApiItem, parentId: string): Category => ({
  id: String(item.id),
  name: item.name,
  slug: item.slug,
  icon: item.icon,
  image: item.image,
  description: item.description,
  order: item.order,
  parentCategoryId: parentId,
  has_children: item.has_children === true
});

const extractChildrenItems = (payload: unknown): CategoryChildrenApiItem[] => {
  if (Array.isArray(payload)) {
    return payload as CategoryChildrenApiItem[];
  }
  if (payload && typeof payload === 'object') {
    const results = (payload as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return results as CategoryChildrenApiItem[];
    }
  }
  return [];
};

export const useMegaMenu = () => {
  const apiClient = useApiClient();

  const getChildren = (parentId: string | number): Category[] => {
    return childrenByParentId.value[String(parentId)] ?? [];
  };

  const hasLoadedChildren = (parentId: string | number): boolean => {
    return loadedParentIds.value.has(String(parentId));
  };

  const isLoadingChildren = (parentId: string | number): boolean => {
    return loadingParentIds.value.has(String(parentId));
  };

  const setLoading = (key: string, loading: boolean) => {
    const next = new Set(loadingParentIds.value);
    if (loading) {
      next.add(key);
    } else {
      next.delete(key);
    }
    loadingParentIds.value = next;
  };

  /**
   * Lazily load the direct children of a single category ID.
   * Returns cached children immediately when already loaded.
   */
  const ensureChildren = async (parentId: string | number): Promise<Category[]> => {
    const key = String(parentId);
    if (!key) return [];

    if (loadedParentIds.value.has(key)) {
      return childrenByParentId.value[key] ?? [];
    }

    const pending = inFlightRequests.get(key);
    if (pending) return pending;

    const request = (async (): Promise<Category[]> => {
      setLoading(key, true);
      try {
        const payload = await apiClient.request<unknown>(
          `/api/v1/categories/children/?ids=${encodeURIComponent(key)}&is_menu=true`,
          { method: 'GET' }
        );

        const children = extractChildrenItems(payload).map(item => toCategory(item, key));

        childrenByParentId.value = { ...childrenByParentId.value, [key]: children };
        loadedParentIds.value = new Set(loadedParentIds.value).add(key);

        return children;
      } catch {
        // Leave the parent ID unmarked so a later hover can retry.
        return [];
      } finally {
        setLoading(key, false);
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, request);
    return request;
  };

  /**
   * Category URLs are built from the known ancestor slug path so the menu keeps
   * producing the existing `/product-category/<root>/.../<leaf>` shape.
   */
  const buildCategoryUrl = (ancestorSlugs: string[], category: Category): string => {
    const segments = [...ancestorSlugs, category.slug].filter(Boolean);
    return `/product-category/${segments.join('/')}/`;
  };

  const logCategoryChildren = (_category: Category, _children: Category[]) => {
    // Diagnostic logging removed for production clean state
  };

  return {
    childrenByParentId,
    getChildren,
    hasLoadedChildren,
    isLoadingChildren,
    ensureChildren,
    buildCategoryUrl,
    logCategoryChildren
  };
};

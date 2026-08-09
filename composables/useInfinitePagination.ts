// File: /composables/useInfinitePagination.ts
import { ref, watch, unref, isRef, computed, type Ref, type MaybeRef, onMounted } from 'vue';
import { refDebounced } from '@vueuse/core';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FetchPageParams {
  page: number;
  search?: string;
  [key: string]: any;
}

export type FetcherFn<T> = (params: FetchPageParams) => Promise<PaginatedResponse<T> | T[]>;

export interface UseInfinitePaginationOptions<T> {
  /**
   * Async function that fetches a single paginated page.
   * Receives { page, search, ...extraParams }
   */
  fetcher: FetcherFn<T>;

  /**
   * Reactive search string or ref.
   */
  search?: MaybeRef<string>;

  /**
   * Reactive object containing additional query parameters.
   */
  extraParams?: MaybeRef<Record<string, any>>;

  /**
   * Number of items per page. Defaults to 10.
   */
  pageSize?: number;

  /**
   * Deduplication key extractor (default tries item.id or item.slug or JSON string)
   */
  dedupeKey?: (item: T) => string | number;

  /**
   * Whether to automatically load page 1 on initialization/mount. Defaults to true.
   */
  autoFetch?: boolean;

  /**
   * Optional initial items list.
   */
  initialData?: T[];

  /**
   * Debounce delay in milliseconds for user search input (defaults to 300ms).
   */
  debounceMs?: number;
}

export function useInfinitePagination<T>(options: UseInfinitePaginationOptions<T>) {
  const {
    fetcher,
    search,
    extraParams,
    pageSize = 10,
    dedupeKey = (item: any) => item?.id ?? item?.slug ?? JSON.stringify(item),
    autoFetch = true,
    initialData = [],
    debounceMs = 300
  } = options;

  const items = ref<T[]>(initialData) as Ref<T[]>;
  const totalCount = ref<number>(initialData.length);
  const currentPage = ref<number>(1);
  const hasMore = ref<boolean>(true);

  const isLoading = ref<boolean>(false);
  const isFetchingNextPage = ref<boolean>(false);
  const error = ref<string | null>(null);

  const defaultKeyGetter = dedupeKey;

  // Deduplication helper
  const mergeItems = (existing: T[], incoming: T[]): T[] => {
    const existingKeys = new Set(existing.map(item => defaultKeyGetter(item)));
    const uniqueIncoming = incoming.filter(item => {
      const key = defaultKeyGetter(item);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    return [...existing, ...uniqueIncoming];
  };

  // Helper to standardise response shape
  const parseResponse = (res: PaginatedResponse<T> | T[]): { results: T[]; count: number; hasNext: boolean } => {
    if (Array.isArray(res)) {
      return {
        results: res,
        count: res.length,
        hasNext: false
      };
    }

    if (res && typeof res === 'object') {
      const results = Array.isArray(res.results) ? res.results : [];
      const count = typeof res.count === 'number' ? res.count : results.length;
      const hasNext = !!res.next;
      return { results, count, hasNext };
    }

    return { results: [], count: 0, hasNext: false };
  };

  // Fetch page 1
  const fetchFirstPage = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    error.value = null;
    currentPage.value = 1;

    try {
      const searchVal = search ? unref(search) : undefined;
      const extra = extraParams ? unref(extraParams) : {};

      const response = await fetcher({
        page: 1,
        search: searchVal,
        ...extra
      });

      const parsed = parseResponse(response);
      items.value = parsed.results;
      totalCount.value = parsed.count;

      // Determine if more pages exist
      if (parsed.hasNext) {
        hasMore.value = true;
      } else {
        hasMore.value = parsed.results.length >= pageSize && parsed.results.length < parsed.count;
      }
    } catch (err: any) {
      error.value = err?.data?.detail || err?.message || 'Failed to fetch paginated data.';
      hasMore.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  // Load next page
  const loadNextPage = async () => {
    // Duplicate request prevention & guards
    if (isLoading.value || isFetchingNextPage.value || !hasMore.value) {
      return;
    }

    isFetchingNextPage.value = true;
    error.value = null;
    const nextPageNum = currentPage.value + 1;

    try {
      const searchVal = search ? unref(search) : undefined;
      const extra = extraParams ? unref(extraParams) : {};

      const response = await fetcher({
        page: nextPageNum,
        search: searchVal,
        ...extra
      });

      const parsed = parseResponse(response);

      if (parsed.results.length === 0) {
        hasMore.value = false;
      } else {
        items.value = mergeItems(items.value, parsed.results);
        currentPage.value = nextPageNum;
        totalCount.value = Math.max(totalCount.value, parsed.count, items.value.length);

        if (parsed.hasNext) {
          hasMore.value = true;
        } else {
          hasMore.value = items.value.length < parsed.count;
        }
      }
    } catch (err: any) {
      error.value = err?.data?.detail || err?.message || 'Failed to load additional items.';
    } finally {
      isFetchingNextPage.value = false;
    }
  };

  // Refresh (clear and refetch page 1)
  const refresh = async () => {
    items.value = [];
    totalCount.value = 0;
    currentPage.value = 1;
    hasMore.value = true;
    await fetchFirstPage();
  };

  // Reset without immediate fetch
  const reset = () => {
    items.value = [];
    totalCount.value = 0;
    currentPage.value = 1;
    hasMore.value = true;
    isLoading.value = false;
    isFetchingNextPage.value = false;
    error.value = null;
  };

  // Watch search query if provided (debounced to prevent API requests on every keystroke)
  if (search !== undefined) {
    const searchRef = isRef(search) ? (search as Ref<string>) : computed(() => unref(search));
    const debouncedSearch = refDebounced(searchRef, debounceMs);
    watch(
      debouncedSearch,
      () => {
        fetchFirstPage();
      }
    );
  }

  // Watch extraParams if provided
  if (extraParams !== undefined) {
    watch(
      () => unref(extraParams),
      () => {
        fetchFirstPage();
      },
      { deep: true }
    );
  }

  if (autoFetch) {
    onMounted(() => {
      fetchFirstPage();
    });
  }

  return {
    items,
    totalCount,
    currentPage,
    hasMore,
    isLoading,
    isFetchingNextPage,
    error,
    fetchFirstPage,
    loadNextPage,
    refresh,
    reset
  };
}

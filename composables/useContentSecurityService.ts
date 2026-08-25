// File: /composables/useContentSecurityService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { 
  KeywordRule, 
  KeywordRulesQueryParams, 
  PaginatedKeywordRules 
} from '@/types';

export const useContentSecurityService = () => {
  const apiClient = useApiClient();
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  const checkMockMode = (): boolean => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
  };

  const getFallbackKeywordRules = (): KeywordRule[] => {
    return [
      {
        id: 1,
        keyword: 'free crypto giveaway',
        category: 'SPAM',
        match_type: 'WORD',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-20T12:00:00Z'
      },
      {
        id: 2,
        keyword: 'whatsapp +',
        category: 'SCAM',
        match_type: 'SUBSTRING',
        severity: 'MEDIUM',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-18T10:30:00Z'
      },
      {
        id: 3,
        keyword: 'telegram @',
        category: 'SPAM',
        match_type: 'SUBSTRING',
        severity: 'MEDIUM',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-15T14:45:00Z'
      },
      {
        id: 4,
        keyword: 'viagra',
        category: 'ADULT',
        match_type: 'WORD',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-10T09:15:00Z'
      },
      {
        id: 5,
        keyword: 'casino bonus',
        category: 'GAMBLING',
        match_type: 'SUBSTRING',
        severity: 'CRITICAL',
        is_enabled: false,
        is_active: false,
        created_at: '2026-08-10T09:15:00Z'
      }
    ];
  };

  const getKeywordRules = async (
    params?: KeywordRulesQueryParams
  ): Promise<PaginatedKeywordRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackKeywordRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => r.keyword.toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
      }
      if (params?.match_type) {
        results = results.filter((r) => r.match_type === params.match_type);
      }
      if (params?.is_active !== undefined) {
        results = results.filter((r) => r.is_active === params.is_active);
      }
      if (params?.is_enabled !== undefined) {
        results = results.filter((r) => r.is_enabled === params.is_enabled);
      }

      // Pagination
      const page = params?.page || 1;
      const pageSize = params?.page_size || 10;
      const totalCount = results.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const paginatedResults = results.slice(start, start + pageSize);

      isLoading.value = false;
      return {
        results: paginatedResults,
        count: totalCount,
        page,
        pages: totalPages,
        next: page < totalPages ? `?page=${page + 1}` : null,
        previous: page > 1 ? `?page=${page - 1}` : null
      };
    }

    try {
      const queryObj: Record<string, any> = {};
      if (params?.page) queryObj.page = params.page;
      if (params?.page_size) queryObj.page_size = params.page_size;
      if (params?.search) queryObj.search = params.search;
      if (params?.category) queryObj.category = params.category;
      if (params?.severity) queryObj.severity = params.severity;
      if (params?.match_type) queryObj.match_type = params.match_type;
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/keyword-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: KeywordRule[] = [];
      let count = 0;
      let pageNum = params?.page || 1;
      let totalPagesNum = 1;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object') {
        results = data.results || [];
        count = data.count || results.length;
        pageNum = data.page || params?.page || 1;
        totalPagesNum = data.pages || Math.ceil(count / (params?.page_size || 10)) || 1;
      }

      return {
        results,
        count,
        page: pageNum,
        pages: totalPagesNum,
        next: data?.next || null,
        previous: data?.previous || null
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to fetch keyword rules.');
      errorMsg.value = msg;
      return {
        results: [],
        count: 0,
        page: params?.page || 1,
        pages: 1,
        next: null,
        previous: null
      };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error: errorMsg,
    getKeywordRules
  };
};

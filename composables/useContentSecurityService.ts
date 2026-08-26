// File: /composables/useContentSecurityService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { 
  KeywordRule, 
  KeywordRuleDetail,
  CreateKeywordRulePayload,
  UpdateKeywordRulePayload,
  KeywordRulesQueryParams, 
  PaginatedKeywordRules,
  DomainRule,
  CreateDomainRulePayload,
  DomainRulesQueryParams,
  PaginatedDomainRules
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

  const createKeywordRule = async (
    payload: CreateKeywordRulePayload
  ): Promise<KeywordRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedKeyword = payload.keyword?.trim();
    if (!trimmedKeyword) {
      const err = new Error('Keyword is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateKeywordRulePayload = {
      keyword: trimmedKeyword,
      category: payload.category,
      severity: payload.severity,
      match_type: payload.match_type,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: KeywordRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        keyword: cleanPayload.keyword,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        match_type: cleanPayload.match_type,
        is_enabled: cleanPayload.is_enabled,
        is_active: cleanPayload.is_enabled,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<KeywordRule>(
        '/api/v1/content-security/keyword-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create keyword rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getKeywordRuleDetails = async (
    id: string | number
  ): Promise<KeywordRuleDetail | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const fallbackList = getFallbackKeywordRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));
      isLoading.value = false;
      if (!found) return null;
      return {
        id: found.id,
        keyword: found.keyword,
        category: found.category,
        severity: found.severity,
        match_type: found.match_type,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for content filtering.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<KeywordRuleDetail>(
        `/api/v1/content-security/keyword-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve keyword rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateKeywordRule = async (
    id: string | number,
    payload: UpdateKeywordRulePayload
  ): Promise<KeywordRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      isLoading.value = false;
      const fallbackList = getFallbackKeywordRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) {
        throw new Error('Keyword rule not found.');
      }
      const existing = fallbackList[idx]!;
      const updated: KeywordRule = {
        ...existing,
        keyword: payload.keyword !== undefined ? payload.keyword : existing.keyword,
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        match_type: payload.match_type !== undefined ? payload.match_type : existing.match_type,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated keyword rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security Admin',
        updated_by: 'Security Admin'
      };
    }

    try {
      const data = await apiClient.request<KeywordRuleDetail>(
        `/api/v1/content-security/keyword-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update keyword rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteKeywordRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackKeywordRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/keyword-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete keyword rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackDomainRules = (): DomainRule[] => {
    return [
      {
        id: 1,
        domain: 'casino-example.com',
        category: 'GAMBLING',
        match_type: 'SUBDOMAIN',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-22T10:00:00Z'
      },
      {
        id: 2,
        domain: 'free-giveaway-zone.xyz',
        category: 'PHISHING',
        match_type: 'EXACT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-21T14:30:00Z'
      },
      {
        id: 3,
        domain: 'tracker-telemetry.biz',
        category: 'MALWARE',
        match_type: 'SUBDOMAIN',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-19T09:15:00Z'
      },
      {
        id: 4,
        domain: 'free-file-vault-dl.com',
        category: 'MALWARE',
        match_type: 'EXACT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-12T16:20:00Z'
      }
    ];
  };

  const getDomainRules = async (
    params?: DomainRulesQueryParams
  ): Promise<PaginatedDomainRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackDomainRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => r.domain.toLowerCase().includes(q));
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

      const data = await apiClient.request<any>('/api/v1/content-security/domain-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: DomainRule[] = [];
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
      const msg = extractErrorMessage(err, 'Failed to fetch domain rules.');
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

  const createDomainRule = async (
    payload: CreateDomainRulePayload
  ): Promise<DomainRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedDomain = payload.domain?.trim();
    if (!trimmedDomain) {
      const err = new Error('Domain is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateDomainRulePayload = {
      domain: trimmedDomain,
      category: payload.category,
      severity: payload.severity,
      match_type: payload.match_type,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: DomainRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        domain: cleanPayload.domain,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        match_type: cleanPayload.match_type,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<DomainRule>(
        '/api/v1/content-security/domain-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create domain rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  return {
    isLoading,
    error: errorMsg,
    getKeywordRules,
    createKeywordRule,
    getKeywordRuleDetails,
    updateKeywordRule,
    deleteKeywordRule,
    getDomainRules,
    createDomainRule
  };
};

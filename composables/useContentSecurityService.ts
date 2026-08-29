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
  DomainRuleDetail,
  CreateDomainRulePayload,
  UpdateDomainRulePayload,
  DomainRulesQueryParams,
  PaginatedDomainRules,
  HiddenContentRule,
  HiddenContentRuleDetail,
  CreateHiddenContentRulePayload,
  UpdateHiddenContentRulePayload,
  HiddenContentRulesQueryParams,
  PaginatedHiddenContentRules,
  ObfuscationRule,
  ObfuscationRuleDetail,
  CreateObfuscationRulePayload,
  UpdateObfuscationRulePayload,
  ObfuscationRulesQueryParams,
  PaginatedObfuscationRules,
  RedirectRule,
  RedirectRuleDetail,
  CreateRedirectRulePayload,
  UpdateRedirectRulePayload,
  RedirectRulesQueryParams,
  PaginatedRedirectRules,
  HtmlAttributeRule,
  HtmlAttributeRuleDetail,
  CreateHtmlAttributeRulePayload,
  UpdateHtmlAttributeRulePayload,
  HtmlAttributeRulesQueryParams,
  PaginatedHtmlAttributeRules,
  HtmlTagRule,
  HtmlTagRuleDetail,
  CreateHtmlTagRulePayload,
  UpdateHtmlTagRulePayload,
  HtmlTagRulesQueryParams,
  PaginatedHtmlTagRules,
  ContentScan,
  ContentScansQueryParams,
  PaginatedContentScans,
  ContentScanRunRequest,
  ContentScanRunResult,
  ContentScanDetail,
  Finding,
  ContentScanFindingDetail,
  ContentScanFindingReviewRequest,
  ContentScanFindingResolveRequest,
  ContentScanFindingListItem,
  ContentScanFindingsQueryParams,
  PaginatedContentScanFindings,
  DetectionRulesSummary
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

  const getDomainRuleDetails = async (
    id: string | number
  ): Promise<DomainRuleDetail | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const fallbackList = getFallbackDomainRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));
      isLoading.value = false;
      if (!found) return null;
      return {
        id: found.id,
        domain: found.domain,
        category: found.category,
        severity: found.severity,
        match_type: found.match_type,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for domain filtering heuristics.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<DomainRuleDetail>(
        `/api/v1/content-security/domain-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve domain rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateDomainRule = async (
    id: string | number,
    payload: UpdateDomainRulePayload
  ): Promise<DomainRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      isLoading.value = false;
      const fallbackList = getFallbackDomainRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) {
        throw new Error('Domain rule not found.');
      }
      const existing = fallbackList[idx]!;
      const updated: DomainRule = {
        ...existing,
        domain: payload.domain !== undefined ? payload.domain : existing.domain,
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        match_type: payload.match_type !== undefined ? payload.match_type : existing.match_type,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated domain rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security Admin',
        updated_by: 'Security Admin'
      };
    }

    try {
      const data = await apiClient.request<DomainRuleDetail>(
        `/api/v1/content-security/domain-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update domain rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteDomainRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackDomainRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/domain-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete domain rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackHiddenContentRules = (): HiddenContentRule[] => {
    return [
      {
        id: 1,
        pattern: 'display:none',
        category: 'HIDDEN_CONTENT',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-20T12:00:00Z'
      },
      {
        id: 2,
        pattern: 'visibility:hidden',
        category: 'HIDDEN_CONTENT',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-18T10:30:00Z'
      },
      {
        id: 3,
        pattern: 'opacity:0',
        category: 'OBFUSCATION',
        severity: 'MEDIUM',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-15T14:45:00Z'
      },
      {
        id: 4,
        pattern: 'font-size:0',
        category: 'SPAM',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-10T09:15:00Z'
      },
      {
        id: 5,
        pattern: 'text-indent:-9999px',
        category: 'HIDDEN_CONTENT',
        severity: 'CRITICAL',
        is_enabled: false,
        is_active: false,
        created_at: '2026-08-08T09:15:00Z'
      }
    ];
  };

  const getHiddenContentRules = async (
    params?: HiddenContentRulesQueryParams
  ): Promise<PaginatedHiddenContentRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackHiddenContentRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => r.pattern.toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
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
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/hidden-content-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: HiddenContentRule[] = [];
      let count = 0;
      let pageNum = 1;
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
      const msg = extractErrorMessage(err, 'Failed to fetch hidden content rules.');
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

  const createHiddenContentRule = async (
    payload: CreateHiddenContentRulePayload
  ): Promise<HiddenContentRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedPattern = payload.pattern?.trim();
    if (!trimmedPattern) {
      const err = new Error('Pattern is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateHiddenContentRulePayload = {
      pattern: trimmedPattern,
      category: payload.category,
      severity: payload.severity,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null && payload.description.trim() !== ''
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: HiddenContentRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        pattern: cleanPayload.pattern,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<HiddenContentRule>(
        '/api/v1/content-security/hidden-content-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create hidden content rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getHiddenContentRuleDetails = async (
    id: string | number
  ): Promise<HiddenContentRuleDetail | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const fallbackList = getFallbackHiddenContentRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));
      isLoading.value = false;
      if (!found) return null;
      return {
        id: found.id,
        pattern: found.pattern,
        category: found.category,
        severity: found.severity,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for hidden content CSS declaration heuristics.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<HiddenContentRuleDetail>(
        `/api/v1/content-security/hidden-content-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve hidden content rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateHiddenContentRule = async (
    id: string | number,
    payload: UpdateHiddenContentRulePayload
  ): Promise<HiddenContentRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      isLoading.value = false;
      const fallbackList = getFallbackHiddenContentRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) {
        throw new Error('Hidden content rule not found.');
      }
      const existing = fallbackList[idx]!;
      const updated: HiddenContentRule = {
        ...existing,
        pattern: payload.pattern !== undefined ? payload.pattern : existing.pattern,
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated hidden content rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security Admin',
        updated_by: 'Security Admin'
      };
    }

    try {
      const data = await apiClient.request<HiddenContentRuleDetail>(
        `/api/v1/content-security/hidden-content-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update hidden content rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteHiddenContentRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackHiddenContentRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/hidden-content-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete hidden content rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackObfuscationRules = (): ObfuscationRule[] => {
    return [
      {
        id: 1,
        pattern: 'eval\\(',
        category: 'OBFUSCATION',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-20T10:00:00Z'
      },
      {
        id: 2,
        pattern: 'String\\.fromCharCode',
        category: 'OBFUSCATION',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-18T14:30:00Z'
      },
      {
        id: 3,
        pattern: 'unescape\\(',
        category: 'OBFUSCATION',
        severity: 'HIGH',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-15T09:00:00Z'
      },
      {
        id: 4,
        pattern: 'base64_decode',
        category: 'INJECTION',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-12T11:20:00Z'
      },
      {
        id: 5,
        pattern: '&#x[0-9a-fA-F]+;',
        category: 'OBFUSCATION',
        severity: 'MEDIUM',
        is_enabled: false,
        is_active: false,
        created_at: '2026-08-08T16:45:00Z'
      }
    ];
  };

  const getObfuscationRules = async (
    params?: ObfuscationRulesQueryParams
  ): Promise<PaginatedObfuscationRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackObfuscationRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => r.pattern.toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
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
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/obfuscation-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: ObfuscationRule[] = [];
      let count = 0;
      let pageNum = 1;
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
      const msg = extractErrorMessage(err, 'Failed to fetch obfuscation rules.');
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

  const createObfuscationRule = async (
    payload: CreateObfuscationRulePayload
  ): Promise<ObfuscationRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedPattern = payload.pattern?.trim();
    if (!trimmedPattern) {
      const err = new Error('Pattern is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateObfuscationRulePayload = {
      pattern: trimmedPattern,
      category: payload.category,
      severity: payload.severity,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null && payload.description.trim() !== ''
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: ObfuscationRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        pattern: cleanPayload.pattern,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<ObfuscationRule>(
        '/api/v1/content-security/obfuscation-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create obfuscation rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getObfuscationRuleDetails = async (
    id: string | number
  ): Promise<ObfuscationRuleDetail | null> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const fallbackList = getFallbackObfuscationRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));
      isLoading.value = false;
      if (!found) return null;
      return {
        id: found.id,
        pattern: found.pattern,
        category: found.category,
        severity: found.severity,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for code obfuscation pattern / regex heuristics.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<ObfuscationRuleDetail>(
        `/api/v1/content-security/obfuscation-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve obfuscation rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateObfuscationRule = async (
    id: string | number,
    payload: UpdateObfuscationRulePayload
  ): Promise<ObfuscationRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackObfuscationRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) {
        throw new Error(`Obfuscation rule #${id} not found.`);
      }
      const existing = fallbackList[idx]!;
      const updated: ObfuscationRule = {
        ...existing,
        pattern: payload.pattern !== undefined ? payload.pattern : existing.pattern,
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated obfuscation rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<ObfuscationRuleDetail>(
        `/api/v1/content-security/obfuscation-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update obfuscation rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteObfuscationRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackObfuscationRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/obfuscation-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete obfuscation rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackRedirectRules = (): RedirectRule[] => {
    return [
      {
        id: 1,
        pattern: 'http-equiv="refresh"',
        category: 'REDIRECT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-22T10:00:00Z'
      },
      {
        id: 2,
        pattern: 'window\\.location',
        category: 'REDIRECT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-18T14:30:00Z'
      },
      {
        id: 3,
        pattern: 'bit\\.ly/|tinyurl\\.com/',
        category: 'REDIRECT',
        severity: 'MEDIUM',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-14T09:00:00Z'
      },
      {
        id: 4,
        pattern: 'document\\.location\\.replace',
        category: 'REDIRECT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-10T11:20:00Z'
      },
      {
        id: 5,
        pattern: 'top\\.location\\.href',
        category: 'REDIRECT',
        severity: 'HIGH',
        is_enabled: false,
        is_active: false,
        created_at: '2026-08-05T16:45:00Z'
      }
    ];
  };

  const getRedirectRules = async (
    params?: RedirectRulesQueryParams
  ): Promise<PaginatedRedirectRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackRedirectRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => r.pattern.toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
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
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/redirect-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: RedirectRule[] = [];
      let count = 0;
      let pageNum = 1;
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
      const msg = extractErrorMessage(err, 'Failed to fetch redirect rules.');
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

  const createRedirectRule = async (
    payload: CreateRedirectRulePayload
  ): Promise<RedirectRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedPattern = payload.pattern?.trim();
    if (!trimmedPattern) {
      const err = new Error('Pattern is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateRedirectRulePayload = {
      pattern: trimmedPattern,
      category: payload.category,
      severity: payload.severity,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null && payload.description.trim() !== ''
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: RedirectRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        pattern: cleanPayload.pattern,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<RedirectRule>(
        '/api/v1/content-security/redirect-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create redirect rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getRedirectRuleDetails = async (
    id: string | number
  ): Promise<RedirectRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      isLoading.value = false;
      const fallbackList = getFallbackRedirectRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));

      if (!found) {
        const err = new Error(`Redirect rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      return {
        id: found.id,
        pattern: found.pattern,
        category: found.category,
        severity: found.severity,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for redirect pattern / heuristic inspection.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<RedirectRuleDetail>(
        `/api/v1/content-security/redirect-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve redirect rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateRedirectRule = async (
    id: string | number,
    payload: UpdateRedirectRulePayload
  ): Promise<RedirectRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackRedirectRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      const existing = idx !== -1 ? fallbackList[idx] : null;

      if (!existing) {
        const err = new Error(`Redirect rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      const updated: RedirectRule = {
        ...existing,
        pattern: payload.pattern !== undefined ? payload.pattern.trim() : existing.pattern,
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated redirect rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<RedirectRuleDetail>(
        `/api/v1/content-security/redirect-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update redirect rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteRedirectRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackRedirectRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/redirect-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete redirect rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackHtmlTagRules = (): HtmlTagRule[] => {
    return [
      {
        id: 1,
        tag: 'script',
        pattern: 'script',
        category: 'DANGEROUS_TAGS',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-24T10:00:00Z'
      },
      {
        id: 2,
        tag: 'iframe',
        pattern: 'iframe',
        category: 'EMBEDDED_CONTENT',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-24T09:30:00Z'
      },
      {
        id: 3,
        tag: 'object',
        pattern: 'object',
        category: 'PLUGIN_OBJECTS',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-10T14:15:00Z'
      },
      {
        id: 4,
        tag: 'embed',
        pattern: 'embed',
        category: 'PLUGIN_OBJECTS',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-10T11:20:00Z'
      },
      {
        id: 5,
        tag: 'base',
        pattern: 'base',
        category: 'DOM_HIJACKING',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-05T16:00:00Z'
      }
    ];
  };

  const getHtmlTagRules = async (
    params?: HtmlTagRulesQueryParams
  ): Promise<PaginatedHtmlTagRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackHtmlTagRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => (r.tag || r.pattern || '').toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
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
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/html-tag-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: HtmlTagRule[] = [];
      let count = 0;
      let pageNum = 1;
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

      isLoading.value = false;
      return {
        results,
        count,
        page: pageNum,
        pages: totalPagesNum,
        next: data?.next || null,
        previous: data?.previous || null
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML tag rules.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const createHtmlTagRule = async (
    payload: CreateHtmlTagRulePayload
  ): Promise<HtmlTagRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedTag = payload.tag?.trim();
    if (!trimmedTag) {
      const err = new Error('Tag / pattern is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateHtmlTagRulePayload = {
      tag: trimmedTag,
      category: payload.category,
      severity: payload.severity,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null && payload.description.trim() !== ''
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: HtmlTagRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        tag: cleanPayload.tag,
        pattern: cleanPayload.tag,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<HtmlTagRule>(
        '/api/v1/content-security/html-tag-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create HTML tag rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getHtmlTagRuleDetails = async (
    id: string | number
  ): Promise<HtmlTagRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlTagRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));

      if (!found) {
        const err = new Error(`HTML tag rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      return {
        id: found.id,
        tag: found.tag || found.pattern,
        pattern: found.pattern || found.tag,
        category: found.category,
        severity: found.severity,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for HTML tag pattern / heuristic inspection.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<HtmlTagRuleDetail>(
        `/api/v1/content-security/html-tag-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML tag rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateHtmlTagRule = async (
    id: string | number,
    payload: UpdateHtmlTagRulePayload
  ): Promise<HtmlTagRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlTagRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      const existing = idx !== -1 ? fallbackList[idx] : null;

      if (!existing) {
        const err = new Error(`HTML tag rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      const updated: HtmlTagRule = {
        ...existing,
        tag: payload.tag !== undefined ? payload.tag.trim() : (existing.tag || existing.pattern),
        pattern: payload.tag !== undefined ? payload.tag.trim() : (existing.pattern || existing.tag),
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated HTML tag rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<HtmlTagRuleDetail>(
        `/api/v1/content-security/html-tag-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update HTML tag rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteHtmlTagRule = async (id: string | number): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlTagRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/html-tag-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete HTML tag rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackHtmlAttributeRules = (): HtmlAttributeRule[] => {
    return [
      {
        id: 1,
        attribute: 'onerror',
        pattern: 'onerror',
        category: 'INJECTION',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-23T10:00:00Z'
      },
      {
        id: 2,
        attribute: 'onclick',
        pattern: 'onclick',
        category: 'INJECTION',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-23T09:30:00Z'
      },
      {
        id: 3,
        attribute: 'onload',
        pattern: 'onload',
        category: 'INJECTION',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-20T14:15:00Z'
      },
      {
        id: 4,
        attribute: 'javascript:',
        pattern: 'javascript:',
        category: 'PHISHING',
        severity: 'CRITICAL',
        is_enabled: true,
        is_active: true,
        created_at: '2026-08-15T11:20:00Z'
      },
      {
        id: 5,
        attribute: 'formaction',
        pattern: 'formaction',
        category: 'REDIRECT',
        severity: 'HIGH',
        is_enabled: false,
        is_active: false,
        created_at: '2026-08-08T16:00:00Z'
      }
    ];
  };

  const getHtmlAttributeRules = async (
    params?: HtmlAttributeRulesQueryParams
  ): Promise<PaginatedHtmlAttributeRules> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackHtmlAttributeRules();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter((r) => (r.attribute || r.pattern || '').toLowerCase().includes(q));
      }
      if (params?.category) {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity) {
        results = results.filter((r) => r.severity === params.severity);
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
      if (params?.is_active !== undefined) queryObj.is_active = params.is_active;
      if (params?.is_enabled !== undefined) queryObj.is_enabled = params.is_enabled;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/html-attribute-rules/', {
        method: 'GET',
        params: queryObj
      });

      let results: HtmlAttributeRule[] = [];
      let count = 0;
      let pageNum = 1;
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

      isLoading.value = false;
      return {
        results,
        count,
        page: pageNum,
        pages: totalPagesNum,
        next: data?.next || null,
        previous: data?.previous || null
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML attribute rules.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const createHtmlAttributeRule = async (
    payload: CreateHtmlAttributeRulePayload
  ): Promise<HtmlAttributeRule> => {
    isLoading.value = true;
    errorMsg.value = null;

    const trimmedAttribute = payload.attribute?.trim();
    if (!trimmedAttribute) {
      const err = new Error('Attribute / pattern is required.');
      errorMsg.value = err.message;
      isLoading.value = false;
      throw err;
    }

    const cleanPayload: CreateHtmlAttributeRulePayload = {
      attribute: trimmedAttribute,
      category: payload.category,
      severity: payload.severity,
      is_enabled: Boolean(payload.is_enabled),
      ...(payload.description !== undefined && payload.description !== null && payload.description.trim() !== ''
        ? { description: payload.description.trim() }
        : {})
    };

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newRule: HtmlAttributeRule = {
        id: Math.floor(1000 + Math.random() * 9000),
        attribute: cleanPayload.attribute,
        category: cleanPayload.category,
        severity: cleanPayload.severity,
        is_enabled: cleanPayload.is_enabled ?? true,
        is_active: cleanPayload.is_enabled ?? true,
        created_at: new Date().toISOString()
      };
      isLoading.value = false;
      return newRule;
    }

    try {
      const data = await apiClient.request<HtmlAttributeRule>(
        '/api/v1/content-security/html-attribute-rules/',
        {
          method: 'POST',
          body: cleanPayload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create HTML attribute rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getHtmlAttributeRuleDetails = async (
    id: string | number
  ): Promise<HtmlAttributeRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlAttributeRules();
      const found = fallbackList.find((r) => String(r.id) === String(id));

      if (!found) {
        const err = new Error(`HTML attribute rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      return {
        id: found.id,
        attribute: found.attribute || found.pattern,
        pattern: found.pattern || found.attribute,
        category: found.category,
        severity: found.severity,
        is_enabled: found.is_enabled,
        is_active: found.is_active,
        description: 'Auto-generated security rule for HTML attribute pattern / heuristic inspection.',
        created_at: found.created_at,
        updated_at: found.created_at,
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<HtmlAttributeRuleDetail>(
        `/api/v1/content-security/html-attribute-rules/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML attribute rule details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const updateHtmlAttributeRule = async (
    id: string | number,
    payload: UpdateHtmlAttributeRulePayload
  ): Promise<HtmlAttributeRuleDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlAttributeRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      const existing = idx !== -1 ? fallbackList[idx] : null;

      if (!existing) {
        const err = new Error(`HTML attribute rule #${id} not found.`);
        errorMsg.value = err.message;
        throw err;
      }

      const updated: HtmlAttributeRule = {
        ...existing,
        attribute: payload.attribute !== undefined ? payload.attribute.trim() : (existing.attribute || existing.pattern),
        pattern: payload.attribute !== undefined ? payload.attribute.trim() : (existing.pattern || existing.attribute),
        category: payload.category !== undefined ? payload.category : existing.category,
        severity: payload.severity !== undefined ? payload.severity : existing.severity,
        is_enabled: payload.is_enabled !== undefined ? payload.is_enabled : existing.is_enabled
      };
      fallbackList[idx] = updated;
      return {
        ...updated,
        description: payload.description !== undefined ? payload.description : 'Updated HTML attribute rule.',
        updated_at: new Date().toISOString(),
        created_by: 'Security System',
        updated_by: 'Security System'
      };
    }

    try {
      const data = await apiClient.request<HtmlAttributeRuleDetail>(
        `/api/v1/content-security/html-attribute-rules/${id}/`,
        {
          method: 'PATCH',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update HTML attribute rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const deleteHtmlAttributeRule = async (
    id: string | number
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      const fallbackList = getFallbackHtmlAttributeRules();
      const idx = fallbackList.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        fallbackList.splice(idx, 1);
      }
      return true;
    }

    try {
      await apiClient.request(
        `/api/v1/content-security/html-attribute-rules/${id}/`,
        {
          method: 'DELETE'
        }
      );
      isLoading.value = false;
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete HTML attribute rule.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackContentScans = (): ContentScan[] => {
    return [
      {
        id: 'CS-1092',
        content_type: 'Product',
        object_id: '101',
        field_name: 'description',
        status: 'Critical',
        risk_score: 98,
        finding_count: 1,
        scanner_version: 'v2.1.0',
        scanned_at: '2026-08-25T11:52:00Z'
      },
      {
        id: 'CS-1088',
        content_type: 'Product',
        object_id: '104',
        field_name: 'specifications',
        status: 'Critical',
        risk_score: 92,
        finding_count: 1,
        scanner_version: 'v2.1.0',
        scanned_at: '2026-08-25T11:48:00Z'
      },
      {
        id: 'CS-1084',
        content_type: 'Category',
        object_id: '15',
        field_name: 'description',
        status: 'Needs Review',
        risk_score: 65,
        finding_count: 2,
        scanner_version: 'v2.1.0',
        scanned_at: '2026-08-25T11:40:00Z'
      },
      {
        id: 'CS-1080',
        content_type: 'Product',
        object_id: '112',
        field_name: 'description',
        status: 'Clean',
        risk_score: 0,
        finding_count: 0,
        scanner_version: 'v2.1.0',
        scanned_at: '2026-08-25T11:34:00Z'
      },
      {
        id: 'CS-1075',
        content_type: 'Product',
        object_id: '120',
        field_name: 'name',
        status: 'Clean',
        risk_score: 4,
        finding_count: 0,
        scanner_version: 'v2.1.0',
        scanned_at: '2026-08-25T11:22:00Z'
      }
    ];
  };

  const getContentScans = async (
    params?: ContentScansQueryParams
  ): Promise<PaginatedContentScans> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackContentScans();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (r) =>
            r.field_name.toLowerCase().includes(q) ||
            String(r.id).toLowerCase().includes(q) ||
            String(r.object_id).toLowerCase().includes(q) ||
            r.content_type.toLowerCase().includes(q)
        );
      }
      if (params?.content_type && params.content_type !== 'all') {
        results = results.filter((r) => r.content_type === params.content_type);
      }
      if (params?.status && params.status !== 'all') {
        results = results.filter((r) => r.status === params.status);
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
      if (params?.content_type && params.content_type !== 'all') queryObj.content_type = params.content_type;
      if (params?.status && params.status !== 'all') queryObj.status = params.status;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/scans/', {
        method: 'GET',
        params: queryObj
      });

      let results: ContentScan[] = [];
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

      isLoading.value = false;
      return {
        results,
        count,
        page: pageNum,
        pages: totalPagesNum,
        next: data.next || null,
        previous: data.previous || null
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve content scans.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const runContentScan = async (
    payload: ContentScanRunRequest
  ): Promise<ContentScanRunResult> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      isLoading.value = false;
      return {
        scanned_objects: {},
        scanned_fields: {},
        flagged_fields: {},
        total_findings: 0,
        status_counts: {},
        scans: []
      };
    }

    try {
      const data = await apiClient.request<ContentScanRunResult>(
        '/api/v1/content-security/scans/run/',
        {
          method: 'POST',
          body: payload
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to run content scan.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getContentScanDetails = async (
    id: string | number
  ): Promise<ContentScanDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      isLoading.value = false;
      return {
        id: Number(id),
        content_type: 'Product',
        object_id: 1,
        object_label: 'Product #1',
        field_name: 'description',
        status: 'COMPLETED',
        risk_score: 0,
        scanner_version: '1.0.0',
        content_hash: 'abc123hash',
        scanned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        findings: []
      };
    }

    try {
      const data = await apiClient.request<ContentScanDetail>(
        `/api/v1/content-security/scans/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve content scan details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackContentScanFindings = (): ContentScanFindingListItem[] => {
    return [
      {
        id: 1092,
        scan: 1092,
        content_type: 'Product',
        object_id: 101,
        field_name: 'description',
        detector: 'DOMAIN',
        category: 'PHISHING',
        severity: 'CRITICAL',
        rule_value: 'casino-example.com',
        matched_value: 'https://casino-example.com/bonus-claim?ref=9982',
        message: 'Blacklisted affiliate casino and promo redirect domain found embedded in description hyperlink.',
        review_status: 'PENDING',
        created_at: '2026-08-25T11:52:00Z'
      },
      {
        id: 1088,
        scan: 1088,
        content_type: 'Product',
        object_id: 104,
        field_name: 'specifications',
        detector: 'HTML_TAG',
        category: 'DANGEROUS_TAGS',
        severity: 'CRITICAL',
        rule_value: '<iframe',
        matched_value: '<iframe src="https://tracker-telemetry.biz/embed.html" width="0" height="0"></iframe>',
        message: 'Dangerous inline iframe tag with cross-origin external tracking source detected in specification table.',
        review_status: 'PENDING',
        created_at: '2026-08-25T11:48:00Z'
      },
      {
        id: 1074,
        scan: 1084,
        content_type: 'Category',
        object_id: 15,
        field_name: 'description',
        detector: 'KEYWORD',
        category: 'SPAM',
        severity: 'HIGH',
        rule_value: 'cheap replica',
        matched_value: 'cheap replica guaranteed authentic quality',
        message: 'Spam keyword signature detected matching deceptive merchant phrases.',
        review_status: 'NEEDS_REVIEW',
        created_at: '2026-08-25T11:40:00Z'
      },
      {
        id: 1065,
        scan: 1084,
        content_type: 'Category',
        object_id: 15,
        field_name: 'description',
        detector: 'HTML_ATTRIBUTE',
        category: 'DOM_HIJACKING',
        severity: 'HIGH',
        rule_value: 'onload=',
        matched_value: '<img src="x" onload="eval(atob(\'ZG9jdW1lbnQ=\'))" />',
        message: 'Inline JavaScript event handler attribute detected executing obfuscated dynamic script payload.',
        review_status: 'NEEDS_REVIEW',
        created_at: '2026-08-25T11:40:00Z'
      },
      {
        id: 1052,
        scan: 1070,
        content_type: 'Product',
        object_id: 115,
        field_name: 'description',
        detector: 'OBFUSCATION',
        category: 'OBFUSCATION',
        severity: 'MEDIUM',
        rule_value: 'fromCharCode',
        matched_value: 'String.fromCharCode(83,99,114,105,112,116)',
        message: 'Character code dynamic string evaluation detected attempting filter bypass.',
        review_status: 'RESOLVED',
        created_at: '2026-08-25T10:15:00Z'
      }
    ];
  };

  const getContentScanFindings = async (
    params?: ContentScanFindingsQueryParams
  ): Promise<PaginatedContentScanFindings> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = getFallbackContentScanFindings();

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (r) =>
            r.field_name.toLowerCase().includes(q) ||
            String(r.id).toLowerCase().includes(q) ||
            String(r.scan).toLowerCase().includes(q) ||
            String(r.object_id).toLowerCase().includes(q) ||
            r.content_type.toLowerCase().includes(q) ||
            r.detector.toLowerCase().includes(q) ||
            r.matched_value.toLowerCase().includes(q) ||
            r.message.toLowerCase().includes(q)
        );
      }
      if (params?.scan) {
        results = results.filter((r) => String(r.scan) === String(params.scan));
      }
      if (params?.content_type && params.content_type !== 'all') {
        results = results.filter((r) => r.content_type === params.content_type);
      }
      if (params?.object_id) {
        results = results.filter((r) => String(r.object_id) === String(params.object_id));
      }
      if (params?.field_name) {
        results = results.filter((r) => r.field_name.toLowerCase().includes(String(params.field_name).toLowerCase()));
      }
      if (params?.detector && params.detector !== 'all') {
        results = results.filter((r) => r.detector.toUpperCase() === params.detector?.toUpperCase());
      }
      if (params?.category && params.category !== 'all') {
        results = results.filter((r) => r.category === params.category);
      }
      if (params?.severity && params.severity !== 'all') {
        results = results.filter((r) => r.severity.toUpperCase() === params.severity?.toUpperCase());
      }
      if (params?.review_status && params.review_status !== 'all') {
        results = results.filter((r) => r.review_status.toUpperCase() === params.review_status?.toUpperCase());
      }

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
      if (params?.scan) queryObj.scan = params.scan;
      if (params?.content_type && params.content_type !== 'all') queryObj.content_type = params.content_type;
      if (params?.object_id) queryObj.object_id = params.object_id;
      if (params?.field_name) queryObj.field_name = params.field_name;
      if (params?.detector && params.detector !== 'all') queryObj.detector = params.detector;
      if (params?.category && params.category !== 'all') queryObj.category = params.category;
      if (params?.severity && params.severity !== 'all') queryObj.severity = params.severity;
      if (params?.review_status && params.review_status !== 'all') queryObj.review_status = params.review_status;
      if (params?.ordering) queryObj.ordering = params.ordering;

      const data = await apiClient.request<any>('/api/v1/content-security/findings/', {
        method: 'GET',
        params: queryObj
      });

      let results: ContentScanFindingListItem[] = [];
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

      isLoading.value = false;
      return {
        results,
        count,
        page: pageNum,
        pages: totalPagesNum,
        next: data.next || null,
        previous: data.previous || null
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve content scan findings.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getContentScanFindingDetails = async (id: number | string): Promise<ContentScanFindingDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const fallbackList = getFallbackContentScanFindings();
      const found = fallbackList.find((f) => String(f.id) === String(id));
      isLoading.value = false;
      if (found) {
        return {
          id: found.id,
          scan: found.scan,
          content_type: found.content_type,
          object_id: found.object_id,
          field_name: found.field_name,
          detector: found.detector,
          rule_id_value: `RULE-${found.detector}-${found.id}`,
          rule_value: found.rule_value,
          category: found.category,
          severity: found.severity,
          matched_value: found.matched_value,
          message: found.message,
          metadata: {
            confidence: 0.98,
            offset: 42,
            length: found.matched_value.length,
            context_tag: 'rich_text_editor'
          },
          review_status: found.review_status,
          reviewed_by: found.review_status !== 'PENDING' ? 'Security Operations Team' : null,
          reviewed_at: found.review_status !== 'PENDING' ? '2026-08-25T14:30:00Z' : null,
          review_note: found.review_status !== 'PENDING' ? 'Confirmed finding during automated triage.' : null,
          created_at: found.created_at,
          updated_at: found.created_at
        };
      }
      return {
        id: Number(id) || 1,
        scan: 1092,
        content_type: 'Product',
        object_id: 101,
        field_name: 'description',
        detector: 'KEYWORD',
        rule_id_value: 'RULE-KW-101',
        rule_value: 'phishing-signature',
        category: 'SPAM',
        severity: 'HIGH',
        matched_value: 'example phishing link text',
        message: 'Security policy violation detected in content payload.',
        metadata: {
          confidence: 0.95,
          offset: 12
        },
        review_status: 'PENDING',
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    try {
      const data = await apiClient.request<ContentScanFindingDetail>(
        `/api/v1/content-security/findings/${id}/`,
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve finding details.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const reviewContentScanFinding = async (
    id: number | string,
    payload: ContentScanFindingReviewRequest
  ): Promise<ContentScanFindingDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const fallbackList = getFallbackContentScanFindings();
      const found = fallbackList.find((f) => String(f.id) === String(id));
      isLoading.value = false;
      const now = new Date().toISOString();
      const updatedStatus = payload.review_status;
      const updatedNote = payload.review_note ?? null;
      if (found) {
        found.review_status = updatedStatus;
        return {
          id: found.id,
          scan: found.scan,
          content_type: found.content_type,
          object_id: found.object_id,
          field_name: found.field_name,
          detector: found.detector,
          rule_id_value: `RULE-${found.detector}-${found.id}`,
          rule_value: found.rule_value,
          category: found.category,
          severity: found.severity,
          matched_value: found.matched_value,
          message: found.message,
          metadata: {
            confidence: 0.98,
            offset: 42,
            length: found.matched_value.length,
            context_tag: 'rich_text_editor'
          },
          review_status: updatedStatus,
          reviewed_by: 'Security Operations Team',
          reviewed_at: now,
          review_note: updatedNote,
          created_at: found.created_at,
          updated_at: now
        };
      }
      return {
        id: Number(id) || 1,
        scan: 1092,
        content_type: 'Product',
        object_id: 101,
        field_name: 'description',
        detector: 'KEYWORD',
        rule_id_value: 'RULE-KW-101',
        rule_value: 'phishing-signature',
        category: 'SPAM',
        severity: 'HIGH',
        matched_value: 'example phishing link text',
        message: 'Security policy violation detected in content payload.',
        metadata: {
          confidence: 0.95,
          offset: 12
        },
        review_status: updatedStatus,
        reviewed_by: 'Security Operations Team',
        reviewed_at: now,
        review_note: updatedNote,
        created_at: new Date().toISOString(),
        updated_at: now
      };
    }

    try {
      const body: Record<string, any> = {
        review_status: payload.review_status
      };
      if (payload.review_note !== undefined && payload.review_note !== null) {
        body.review_note = payload.review_note;
      }

      const data = await apiClient.request<ContentScanFindingDetail>(
        `/api/v1/content-security/findings/${id}/review/`,
        {
          method: 'POST',
          body
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to submit finding review.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const resolveContentScanFinding = async (
    id: number | string,
    payload?: ContentScanFindingResolveRequest
  ): Promise<ContentScanFindingDetail> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const fallbackList = getFallbackContentScanFindings();
      const found = fallbackList.find((f) => String(f.id) === String(id));
      isLoading.value = false;
      const now = new Date().toISOString();
      const updatedNote = payload?.review_note ?? 'Resolved by administrator.';
      if (found) {
        found.review_status = 'RESOLVED';
        return {
          id: found.id,
          scan: found.scan,
          content_type: found.content_type,
          object_id: found.object_id,
          field_name: found.field_name,
          detector: found.detector,
          rule_id_value: `RULE-${found.detector}-${found.id}`,
          rule_value: found.rule_value,
          category: found.category,
          severity: found.severity,
          matched_value: found.matched_value,
          message: found.message,
          metadata: {
            confidence: 0.98,
            offset: 42,
            length: found.matched_value.length,
            context_tag: 'rich_text_editor'
          },
          review_status: 'RESOLVED',
          reviewed_by: 'Security Operations Team',
          reviewed_at: now,
          review_note: updatedNote,
          created_at: found.created_at,
          updated_at: now
        };
      }
      return {
        id: Number(id) || 1,
        scan: 1092,
        content_type: 'Product',
        object_id: 101,
        field_name: 'description',
        detector: 'KEYWORD',
        rule_id_value: 'RULE-KW-101',
        rule_value: 'phishing-signature',
        category: 'SPAM',
        severity: 'HIGH',
        matched_value: 'example phishing link text',
        message: 'Security policy violation detected in content payload.',
        metadata: {
          confidence: 0.95,
          offset: 12
        },
        review_status: 'RESOLVED',
        reviewed_by: 'Security Operations Team',
        reviewed_at: now,
        review_note: updatedNote,
        created_at: new Date().toISOString(),
        updated_at: now
      };
    }

    try {
      const body: Record<string, any> = {};
      if (payload?.review_note !== undefined && payload?.review_note !== null) {
        body.review_note = payload.review_note;
      }

      const data = await apiClient.request<ContentScanFindingDetail>(
        `/api/v1/content-security/findings/${id}/resolve/`,
        {
          method: 'POST',
          body
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to resolve content scan finding.');
      errorMsg.value = msg;
      isLoading.value = false;
      throw new Error(msg);
    }
  };

  const getFallbackDetectionRulesSummary = (): DetectionRulesSummary => {
    return {
      keyword_rules: 4,
      domain_rules: 4,
      hidden_content_rules: 3,
      obfuscation_rules: 2,
      redirect_rules: 3,
      html_attribute_rules: 5,
      html_tag_rules: 5,
      total: 26
    };
  };

  const getDetectionRulesSummary = async (): Promise<DetectionRulesSummary> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      isLoading.value = false;
      return getFallbackDetectionRulesSummary();
    }

    try {
      const data = await apiClient.request<DetectionRulesSummary>(
        '/api/v1/content-security/detection-rules/summary/',
        {
          method: 'GET'
        }
      );
      isLoading.value = false;
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to fetch detection rules summary.');
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
    createDomainRule,
    getDomainRuleDetails,
    updateDomainRule,
    deleteDomainRule,
    getHiddenContentRules,
    createHiddenContentRule,
    getHiddenContentRuleDetails,
    updateHiddenContentRule,
    deleteHiddenContentRule,
    getObfuscationRules,
    createObfuscationRule,
    getObfuscationRuleDetails,
    updateObfuscationRule,
    deleteObfuscationRule,
    getRedirectRules,
    createRedirectRule,
    getRedirectRuleDetails,
    updateRedirectRule,
    deleteRedirectRule,
    getHtmlAttributeRules,
    createHtmlAttributeRule,
    getHtmlAttributeRuleDetails,
    updateHtmlAttributeRule,
    deleteHtmlAttributeRule,
    getHtmlTagRules,
    createHtmlTagRule,
    getHtmlTagRuleDetails,
    updateHtmlTagRule,
    deleteHtmlTagRule,
    getContentScans,
    runContentScan,
    getContentScanDetails,
    getContentScanFindings,
    getContentScanFindingDetails,
    reviewContentScanFinding,
    resolveContentScanFinding,
    getDetectionRulesSummary
  };
};

// File: /types/content-security.ts

export type KeywordCategory =
  | 'ADULT'
  | 'DRUG'
  | 'GAMBLING'
  | 'HIDDEN_CONTENT'
  | 'INJECTION'
  | 'MALWARE'
  | 'OBFUSCATION'
  | 'PHISHING'
  | 'REDIRECT'
  | 'SCAM'
  | 'SPAM';

export type KeywordSeverity = 'CRITICAL' | 'HIGH' | 'INFO' | 'LOW' | 'MEDIUM';

export type KeywordMatchType = 'SUBSTRING' | 'WORD';

export interface KeywordRule {
  id: number;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
  keyword: string;
  match_type: KeywordMatchType;
}

export interface KeywordRuleDetail {
  id: number;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  updated_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  keyword: string;
  match_type: KeywordMatchType;
}

export interface CreateKeywordRulePayload {
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string;
  keyword: string;
  match_type: KeywordMatchType;
}

export interface UpdateKeywordRulePayload {
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
  keyword?: string;
  match_type?: KeywordMatchType;
}

export interface KeywordRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  match_type?: KeywordMatchType;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedKeywordRules {
  results: KeywordRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export type DomainMatchType = 'EXACT' | 'SUBDOMAIN';

export interface DomainRule {
  id: number;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
  domain: string;
  match_type: DomainMatchType;
}

export interface DomainRuleDetail {
  id: number;
  domain: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: DomainMatchType;
  is_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  updated_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
}

export interface CreateDomainRulePayload {
  domain: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: DomainMatchType;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateDomainRulePayload {
  domain?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  match_type?: DomainMatchType;
  is_enabled?: boolean;
  description?: string;
}

export interface DomainRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  match_type?: DomainMatchType;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedDomainRules {
  results: DomainRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface HiddenContentRule {
  id: number;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
  pattern: string;
}

export interface HiddenContentRuleDetail {
  id: number;
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  updated_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
}

export interface CreateHiddenContentRulePayload {
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateHiddenContentRulePayload {
  pattern?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface HiddenContentRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedHiddenContentRules {
  results: HiddenContentRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface ObfuscationRule {
  id: number;
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ObfuscationRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedObfuscationRules {
  results: ObfuscationRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface ObfuscationRuleDetail {
  id: number;
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  updated_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
}

export interface CreateObfuscationRulePayload {
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateObfuscationRulePayload {
  pattern?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface RedirectRule {
  id: number;
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface RedirectRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedRedirectRules {
  results: RedirectRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface CreateRedirectRulePayload {
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateRedirectRulePayload {
  pattern?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface RedirectRuleDetail {
  id: number;
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
  updated_by?: {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | string | number | null;
}

export interface HtmlAttributeRule {
  id: number;
  attribute?: string;
  pattern?: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface HtmlAttributeRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedHtmlAttributeRules {
  results: HtmlAttributeRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}



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
  | 'SPAM'
  | 'DANGEROUS_TAGS'
  | 'EMBEDDED_CONTENT'
  | 'PLUGIN_OBJECTS'
  | 'DOM_HIJACKING';

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

export interface HtmlAttributeRuleDetail {
  id: number;
  attribute?: string;
  pattern?: string;
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

export interface CreateHtmlAttributeRulePayload {
  attribute: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateHtmlAttributeRulePayload {
  attribute?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
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

export interface HtmlTagRule {
  id: number;
  tag?: string;
  pattern?: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface HtmlTagRuleDetail {
  id: number;
  tag?: string;
  pattern?: string;
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

export interface CreateHtmlTagRulePayload {
  tag: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface UpdateHtmlTagRulePayload {
  tag?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_enabled?: boolean;
  description?: string;
}

export interface HtmlTagRulesQueryParams {
  search?: string;
  category?: KeywordCategory;
  severity?: KeywordSeverity;
  is_active?: boolean;
  is_enabled?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedHtmlTagRules {
  results: HtmlTagRule[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface ContentScan {
  id: number | string;
  content_type: string;
  object_id: number | string;
  field_name: string;
  status: string;
  risk_score: number;
  finding_count: number;
  scanner_version: string;
  scanned_at: string;
}

export interface ContentScansQueryParams {
  search?: string;
  content_type?: string;
  status?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedContentScans {
  results: ContentScan[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface ContentScanFindingListItem {
  id: number;
  scan: number;
  content_type: string;
  object_id: number;
  field_name: string;
  detector: string;
  category: KeywordCategory | string;
  severity: KeywordSeverity | string;
  rule_value: string;
  matched_value: string;
  message: string;
  review_status: string;
  created_at: string;
}

export interface ContentScanFindingsQueryParams {
  search?: string;
  scan?: number | string;
  content_type?: string;
  object_id?: number | string;
  field_name?: string;
  detector?: string;
  category?: string;
  severity?: string;
  review_status?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedContentScanFindings {
  results: ContentScanFindingListItem[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface Finding {
  id: number;
  scan: number;
  content_type: string;
  object_id: number;
  field_name: string;
  detector: string;
  rule_id_value: string;
  rule_value: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  matched_value: string;
  message: string;
  metadata: any;
  review_status: string;
  reviewed_by?: string | number | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentScanDetail {
  id: number;
  content_type: string;
  object_id: number;
  object_label: string;
  field_name: string;
  status: string;
  risk_score: number;
  scanner_version: string;
  content_hash: string;
  scanned_at: string;
  created_at: string;
  updated_at: string;
  findings: Finding[];
}

export interface ContentScanRunRequest {
  content_type: string;
  object_id: number;
  field_names?: string[];
}

export interface ContentScanRunResult {
  scanned_objects: any;
  scanned_fields: any;
  flagged_fields: any;
  total_findings: number;
  status_counts: any;
  scans: ContentScan[];
}




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

export interface CreateKeywordRulePayload {
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description?: string;
  keyword: string;
  match_type: KeywordMatchType;
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

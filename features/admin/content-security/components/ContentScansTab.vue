<!-- File: /features/admin/content-security/components/ContentScansTab.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Search, 
  X, 
  Eye, 
  Play, 
  RefreshCw, 
  Loader2, 
  Info,
  Layers,
  FileText,
  Globe2
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastSuccess, toastError, toastInfo } from '@/composables/useToast';
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

import type { 
  ContentScan, 
  ContentScansQueryParams, 
  ContentScanRunRequest, 
  ContentScanDetail 
} from '@/types';

const emit = defineEmits<{
  (e: 'scan-completed'): void;
  (e: 'update-scans-count', count: number): void;
}>();

const { hasPermission } = useAdminPermissions();
const canViewContentScans = computed(() => hasPermission('content_security.run_content_scan') || hasPermission('content_security.view_contentscan'));
const canRunContentScan = computed(() => hasPermission('content_security.run_content_scan'));
const canViewFindings = computed(() => hasPermission('content_security.view_contentscanfinding'));

const contentSecurityService = useContentSecurityService();

// ==========================================
// Filter State for Scan Results
// ==========================================
const searchQuery = ref('');
const debouncedSearch = refDebounced(searchQuery, 300);
const filterContentType = ref('all');
const filterStatus = ref('all');

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
    emit('update-scans-count', response.count);
  } catch (err: any) {
    const msg = err?.message || 'Failed to retrieve content scans.';
    contentScansError.value = msg;
    toastError(msg);
  } finally {
    isContentScansLoading.value = false;
  }
};

watch([debouncedSearch, filterContentType, filterStatus, itemsPerPage], () => {
  currentPage.value = 1;
  fetchContentScans();
});

watch(currentPage, () => {
  fetchContentScans();
});

const resetFilters = () => {
  searchQuery.value = '';
  filterContentType.value = 'all';
  filterStatus.value = 'all';
  toastInfo('Filters have been reset.');
};

// ==========================================
// Modal State: Scan Details
// ==========================================
const isScanDetailModalOpen = ref(false);
const selectedContentScan = ref<ContentScanDetail | null>(null);

const openScanDetail = async (scan: ContentScan) => {
  try {
    const details = await contentSecurityService.getContentScanDetails(scan.id);
    selectedContentScan.value = details;
    isScanDetailModalOpen.value = true;
  } catch (err: any) {
    const msg = err?.message || 'Failed to load scan details.';
    toastError(msg);
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

const isRunScanModalOpen = ref(false);
const isSubmittingScanRun = ref(false);

const runFullScan = () => {
  scanMode.value = 'specific';
  selectedScanContentType.value = 'Product';
  selectedScanObjectId.value = '';
  scanObjectSearchQuery.value = '';
  scanFieldsInput.value = '';
  isRunScanModalOpen.value = true;
  fetchAvailableScanObjects();
};

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
    emit('scan-completed');
  } catch (err: any) {
    toastError(err?.message || 'Failed to run content scan.');
  } finally {
    isSubmittingScanRun.value = false;
  }
};

const scanResultColumns: UiTableColumn<ContentScan>[] = [
  { key: 'id', label: 'Scan ID', width: '80px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs font-bold text-foreground' },
  { key: 'content_type', label: 'Target / Entity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs' },
  { key: 'status', label: 'Status', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'risk_score', label: 'Risk Score', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'scanned_at', label: 'Scanned At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

// Expose openScanModal and refresh for parent coordination
defineExpose({
  openScanModal: runFullScan,
  refresh: fetchContentScans
});

onMounted(() => {
  fetchContentScans();
});
</script>

<template>
  <div class="space-y-4">
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

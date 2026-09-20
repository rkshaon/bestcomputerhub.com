<!-- File: /features/admin/content-security/components/ContentScansTab.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Search, 
  X, 
  Eye
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastError, toastInfo } from '@/composables/useToast';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import { refDebounced } from '@vueuse/core';
import { useContentSecurityService } from '@/composables/useContentSecurityService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';

import type { 
  ContentScan, 
  ContentScansQueryParams, 
  ContentScanDetail 
} from '@/types';

const emit = defineEmits<{
  (e: 'scan-completed'): void;
  (e: 'update-scans-count', count: number): void;
}>();

const { hasPermission } = useAdminPermissions();
const canViewContentScans = computed(() => hasPermission('content_security.run_content_scan') || hasPermission('content_security.view_contentscan'));

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

const scanResultColumns: UiTableColumn<ContentScan>[] = [
  { key: 'id', label: 'Scan ID', width: '80px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs font-bold text-foreground' },
  { key: 'content_type', label: 'Target / Entity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs' },
  { key: 'status', label: 'Status', width: '120px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'risk_score', label: 'Risk Score', width: '140px', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'scanned_at', label: 'Scanned At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
];

// Expose refresh for parent coordination
defineExpose({
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
  </div>
</template>


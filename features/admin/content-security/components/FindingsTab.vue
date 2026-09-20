<!-- File: /features/admin/content-security/components/FindingsTab.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import { 
  Search, 
  X, 
  Eye, 
  ShieldCheck, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Calendar,
  AlertTriangle,
  AlertOctagon
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastSuccess, toastError, toastInfo } from '@/composables/useToast';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import { refDebounced } from '@vueuse/core';
import { useContentSecurityService } from '@/composables/useContentSecurityService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';

import type { 
  ContentScanFindingListItem,
  ContentScanFindingDetail,
  ContentScanFindingReviewRequest,
  ContentScanFindingResolveRequest,
  ContentScanFindingsQueryParams
} from '@/types';

const route = useRoute();
const router = useRouter();

const { hasPermission } = useAdminPermissions();
const canViewFindings = computed(() => hasPermission('content_security.view_contentscanfinding'));
const canReviewFinding = computed(() => hasPermission('content_security.review_content_scan_finding'));
const canResolveFinding = computed(() => hasPermission('content_security.resolve_content_scan_finding'));

const contentSecurityService = useContentSecurityService();

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
    findingsError.value = err?.message || 'Failed to retrieve content scan findings.';
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

const getSeverityBadge = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'LOW':
    case 'INFO':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

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

// ==========================================
// Modal State: Finding Details
// ==========================================
const isFindingDetailsLoading = ref(false);
const selectedFindingDetail = ref<ContentScanFindingDetail | null>(null);

const findingModalState = useAdminModalState<ContentScanFindingDetail>({
  getItems: async (id) => {
    if (!canViewFindings.value) return null;
    isFindingDetailsLoading.value = true;
    try {
      const details = await contentSecurityService.getContentScanFindingDetails(id);
      return details;
    } catch (err: any) {
      toastError(err?.message || 'Failed to retrieve finding details.');
      return null;
    } finally {
      isFindingDetailsLoading.value = false;
    }
  },
  onResolveError: (id) => {
    toastError(`Finding #${id} could not be resolved.`);
    findingModalState.closeModal({ replace: true });
  }
});

watch(() => findingModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedFindingDetail.value = newEntity;
  }
}, { immediate: true });

watch(() => findingModalState.isView.value, (isView) => {
  if (!isView) {
    selectedFindingDetail.value = null;
  }
}, { immediate: true });

const openFindingDetail = (id: number | string) => {
  if (!canViewFindings.value) {
    toastError('You do not have permission to view finding details.');
    return;
  }
  findingModalState.openView(id);
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

const openFindingReview = (finding: any) => {
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

    if (findingModalState.isView.value && selectedFindingDetail.value && String(selectedFindingDetail.value.id) === String(findingId)) {
      try {
        const refreshed = await contentSecurityService.getContentScanFindingDetails(findingId);
        selectedFindingDetail.value = refreshed;
      } catch {
        selectedFindingDetail.value = updated as any;
      }
    }

    await fetchFindings();
  } catch (err: any) {
    const msg = err?.message || 'Failed to submit finding review.';
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

const openFindingResolve = (finding: any) => {
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

    if (findingModalState.isView.value && selectedFindingDetail.value && String(selectedFindingDetail.value.id) === String(findingId)) {
      try {
        const refreshed = await contentSecurityService.getContentScanFindingDetails(findingId);
        selectedFindingDetail.value = refreshed;
      } catch {
        selectedFindingDetail.value = updated as any;
      }
    }

    await fetchFindings();
  } catch (err: any) {
    const msg = err?.message || 'Failed to resolve content scan finding.';
    resolveFormError.value = msg;
    toastError(msg);
  } finally {
    isResolveSubmitting.value = false;
  }
};

const syncFromRoute = () => {
  if (route.query.search) findingSearchQuery.value = String(route.query.search);
  if (route.query.content_type) findingContentType.value = String(route.query.content_type);
  if (route.query.severity) findingSeverity.value = String(route.query.severity);
  if (route.query.detector) findingDetector.value = String(route.query.detector);
  if (route.query.category) findingCategory.value = String(route.query.category);
  if (route.query.review_status) findingReviewStatus.value = String(route.query.review_status);
  if (route.query.ordering) findingOrdering.value = String(route.query.ordering);
  if (route.query.page) findingPage.value = parseInt(String(route.query.page)) || 1;
  if (route.query.page_size) findingPageSize.value = parseInt(String(route.query.page_size)) || 10;
};

const updateRouteQuery = () => {
  const query = { ...route.query };
  query.search = findingSearchQuery.value || undefined;
  query.content_type = findingContentType.value !== 'all' ? findingContentType.value : undefined;
  query.severity = findingSeverity.value !== 'all' ? findingSeverity.value : undefined;
  query.detector = findingDetector.value !== 'all' ? findingDetector.value : undefined;
  query.category = findingCategory.value !== 'all' ? findingCategory.value : undefined;
  query.review_status = findingReviewStatus.value !== 'all' ? findingReviewStatus.value : undefined;
  query.ordering = findingOrdering.value !== '-created_at' ? findingOrdering.value : undefined;
  query.page = findingPage.value !== 1 ? String(findingPage.value) : undefined;
  query.page_size = findingPageSize.value !== 10 ? String(findingPageSize.value) : undefined;
  router.replace({ query });
};

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
    fetchFindings();
  }
);

watch(findingPage, () => {
  updateRouteQuery();
  fetchFindings();
});

// Expose methods for parent coordination
defineExpose({
  openFindingDetail,
  refresh: fetchFindings
});

onMounted(() => {
  syncFromRoute();
  fetchFindings();
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
          </select>

          <!-- Status Filter -->
          <select 
            v-model="findingReviewStatus"
            class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="CONFIRMED">Confirmed Risk</option>
            <option value="FALSE_POSITIVE">Safe / Whitelisted</option>
            <option value="RESOLVED">Resolved</option>
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
              @click.stop="openFindingDetail(item.id)"
              class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="View finding details"
              aria-label="View finding details"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button 
              v-if="canReviewFinding"
              @click.stop="openFindingReview(item)"
              class="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              title="Review finding"
              aria-label="Review finding"
            >
              <ShieldCheck class="w-4 h-4" />
            </button>
            <button 
              v-if="canResolveFinding"
              @click.stop="openFindingResolve(item)"
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
      subtitle="Mark this security finding as resolved/remediated."
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
  </div>
</template>

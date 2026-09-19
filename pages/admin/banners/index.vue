<!-- File: /pages/admin/banners/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Image as ImageIcon,
  Layers, 
  Calendar, 
  ExternalLink, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowUpDown,
  Tag
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBannerService } from '@/composables/useBannerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { Banner, BannerPlacement } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: false
});

const route = useRoute();
const router = useRouter();
const bannerService = useBannerService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

// Access permissions
const canView = computed(() => canViewModule('/admin/banners'));
const canCreate = computed(() => canCreateInModule('/admin/banners'));
const canEdit = computed(() => canEditInModule('/admin/banners'));
const canDelete = computed(() => canDeleteInModule('/admin/banners'));

// Reactive State
const bannersList = ref<Banner[]>([]);
const placementsList = ref<BannerPlacement[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const isPlacementsLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

// Query & Filter Parameters initialized from URL
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const selectedPlacement = ref<string>(route.query.placement ? String(route.query.placement) : '');
const statusFilter = ref<'all' | 'active' | 'inactive'>((route.query.status as 'all' | 'active' | 'inactive') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

// URL-Driven Modal State Manager
const modalState = useAdminModalState<Banner>({
  getItems: async (id) => {
    return await bannerService.getBanner(id);
  },
  onResolveError: (id) => {
    toastError(`Banner #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedBanner = computed(() => modalState.activeEntity.value);

// Image preview error map
const imageErrorMap = ref<Record<string | number, boolean>>({});
const handleImageError = (id: string | number) => {
  imageErrorMap.value[id] = true;
};

// Map placement IDs to Placement entities for fast lookup
const placementsMap = computed<Record<number, BannerPlacement>>(() => {
  const map: Record<number, BannerPlacement> = {};
  for (const p of placementsList.value) {
    map[p.id] = p;
  }
  return map;
});

// Helper: resolve placement display name
const getPlacementDisplayName = (banner: Banner): string => {
  if (banner.placement_name) return banner.placement_name;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.name;
  }
  return `Placement #${banner.placement}`;
};

// Helper: resolve placement code
const getPlacementCode = (banner: Banner): string => {
  if (banner.placement_code) return banner.placement_code;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.code;
  }
  return '';
};

// Helper: check if banner schedule is currently active
const isCurrentlyScheduled = (banner: Banner): { active: boolean; statusText: string } => {
  if (!banner.is_active) {
    return { active: false, statusText: 'Disabled' };
  }
  const now = new Date();
  if (banner.start_at && new Date(banner.start_at) > now) {
    return { active: false, statusText: 'Scheduled (Future)' };
  }
  if (banner.end_at && new Date(banner.end_at) < now) {
    return { active: false, statusText: 'Expired' };
  }
  return { active: true, statusText: 'Active' };
};

// Helper: format date strings cleanly
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// Fetch placements options for the dropdown filter
const fetchPlacements = async () => {
  isPlacementsLoading.value = true;
  try {
    const res = await bannerService.getPlacementsList({ page_size: 100 });
    placementsList.value = res.results || [];
  } catch (err: any) {
    console.error('Failed to load placements list:', err);
  } finally {
    isPlacementsLoading.value = false;
  }
};

// Main Data Fetcher
const fetchBanners = async () => {
  isLoading.value = true;
  fetchError.value = null;

  try {
    const is_active_param = statusFilter.value === 'active' ? 'true' : statusFilter.value === 'inactive' ? 'false' : undefined;

    const res = await bannerService.getBannersList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      placement: selectedPlacement.value || undefined,
      is_active: is_active_param,
      ordering: 'placement,display_order'
    });

    bannersList.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve banners list.');
  } finally {
    isLoading.value = false;
  }
};

// Sync URL query state on filter changes
const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined,
    placement: selectedPlacement.value || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined
  };

  // Remove undefined parameters
  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) {
      delete query[key];
    }
  });

  router.push({ query });
  fetchBanners();
};

// Watchers for filters and pagination
watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch([selectedPlacement, statusFilter], () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

// Delete Banner Confirmation Handler
const handleDeleteBanner = async () => {
  const banner = selectedBanner.value;
  if (!banner) return;

  if (!canDelete.value) {
    toastError('You do not have permission to delete banners.');
    return;
  }

  isDeleting.value = true;
  try {
    await bannerService.deleteBanner(banner.id);
    toastSuccess(`Banner "${banner.title || '#' + banner.id}" has been deleted.`);
    await modalState.closeModal();
    if (bannersList.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    await fetchBanners();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete banner.');
    toastError(msg);
  } finally {
    isDeleting.value = false;
  }
};

// Computed statistics for top cards
const activeBannersCount = computed(() => {
  return bannersList.value.filter(b => b.is_active).length;
});

const placementsCount = computed(() => {
  return placementsList.value.length;
});

// Table Column Definitions for UiTable
const tableColumns: UiTableColumn<Banner>[] = [
  { key: 'preview', label: 'Preview', width: '100px', align: 'center' },
  { key: 'details', label: 'Banner Details', width: '280px' },
  { key: 'placement', label: 'Placement', width: '160px' },
  { key: 'display_order', label: 'Order', width: '90px', align: 'center' },
  { key: 'schedule', label: 'Schedule', width: '170px' },
  { key: 'status', label: 'Status', width: '110px', align: 'center' },
  { key: 'actions', label: 'Actions', width: '110px', align: 'right' }
];

// Initial mount lifecycle
onMounted(async () => {
  if (canView.value) {
    await fetchPlacements();
    await fetchBanners();
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Banner Management
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchBanners"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          v-if="canCreate"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Banner</span>
        </UiButton>
      </div>
    </template>

    <!-- Permission Guard for Unprivileged Users -->
    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view the Banner Management module.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Summary Analytics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <ImageIcon class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Banners</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Banners</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ activeBannersCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Placements</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ placementsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <!-- Search Box -->
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search banner title, subtitle, CTA..." 
            class="w-full sm:w-80"
          />

          <!-- Placement Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Placement:</label>
            <select
              v-model="selectedPlacement"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full sm:w-48"
            >
              <option value="">All Placements</option>
              <option v-for="p in placementsList" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.code }})
              </option>
            </select>
          </div>

          <!-- Active Status Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Status:</label>
            <select
              v-model="statusFilter"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full sm:w-36"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error State Banner -->
      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30 hover:bg-destructive/10" @click="fetchBanners">
          Retry
        </UiButton>
      </div>

      <!-- Main Data Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="bannersList"
          :loading="isLoading"
          key-field="id"
          empty-text="No banners found"
          empty-description="Adjust your search criteria or create a new banner to populate this placement."
        >
          <!-- Custom Column: Image Preview -->
          <template #cell-preview="{ item }">
            <div class="w-16 h-10 rounded-lg bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center relative group">
              <img
                v-if="item.image && !imageErrorMap[item.id]"
                :src="item.image"
                :alt="item.title || 'Banner Preview'"
                class="w-full h-full object-cover transition-transform group-hover:scale-105"
                @error="handleImageError(item.id)"
              />
              <div v-else class="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon class="w-4 h-4" />
              </div>
            </div>
          </template>

          <!-- Custom Column: Details -->
          <template #cell-details="{ item }">
            <div class="space-y-1 py-1">
              <p class="font-bold text-xs text-foreground line-clamp-1">
                {{ item.title || 'Untitled Banner' }}
              </p>
              <p v-if="item.subtitle" class="text-[11px] text-muted-foreground line-clamp-1">
                {{ item.subtitle }}
              </p>
              <div v-if="item.cta_text || item.cta_url" class="flex items-center gap-1.5 pt-0.5">
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <ExternalLink class="w-2.5 h-2.5" />
                  {{ item.cta_text || 'Link' }}
                </span>
                <span v-if="item.cta_url" class="text-[10px] font-mono text-muted-foreground/80 truncate max-w-[140px]">
                  {{ item.cta_url }}
                </span>
              </div>
            </div>
          </template>

          <!-- Custom Column: Placement -->
          <template #cell-placement="{ item }">
            <div class="space-y-0.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                {{ getPlacementDisplayName(item) }}
              </span>
              <p v-if="getPlacementCode(item)" class="text-[10px] font-mono text-muted-foreground pl-0.5">
                {{ getPlacementCode(item) }}
              </p>
            </div>
          </template>

          <!-- Custom Column: Display Order -->
          <template #cell-display_order="{ item }">
            <span class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono font-extrabold text-foreground bg-muted rounded-md border border-border">
              {{ item.display_order }}
            </span>
          </template>

          <!-- Custom Column: Schedule -->
          <template #cell-schedule="{ item }">
            <div class="space-y-0.5 text-[11px]">
              <div v-if="item.start_at" class="flex items-center gap-1 text-muted-foreground">
                <span class="text-[9px] uppercase font-bold text-muted-foreground/70">From:</span>
                <span class="font-mono text-[10px]">{{ formatDate(item.start_at) }}</span>
              </div>
              <div v-if="item.end_at" class="flex items-center gap-1 text-muted-foreground">
                <span class="text-[9px] uppercase font-bold text-muted-foreground/70">To:</span>
                <span class="font-mono text-[10px]">{{ formatDate(item.end_at) }}</span>
              </div>
              <div v-if="!item.start_at && !item.end_at" class="text-muted-foreground/80 italic text-[11px]">
                Always active
              </div>
            </div>
          </template>

          <!-- Custom Column: Status -->
          <template #cell-status="{ item }">
            <div class="flex items-center justify-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                  isCurrentlyScheduled(item).active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', isCurrentlyScheduled(item).active ? 'bg-emerald-500' : 'bg-rose-500']"></span>
                {{ isCurrentlyScheduled(item).statusText }}
              </span>
            </div>
          </template>

          <!-- Custom Column: Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Edit Banner"
                @click="modalState.openEdit(item.id)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>

              <UiButton
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Delete Banner"
                @click="modalState.openDelete(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>

        <!-- Pagination Controls -->
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="banners"
          />
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal
      :is-open="modalState.isDelete.value"
      title="Delete Banner"
      subtitle="Are you sure you want to permanently remove this banner?"
      @close="modalState.closeModal()"
    >
      <div v-if="selectedBanner" class="space-y-4">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
            <img 
              v-if="selectedBanner.image" 
              :src="selectedBanner.image" 
              class="w-full h-full object-cover" 
              :alt="selectedBanner.title || 'Banner'"
            />
            <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedBanner.title || 'Untitled Banner #' + selectedBanner.id }}</p>
            <p class="text-xs text-muted-foreground">{{ getPlacementDisplayName(selectedBanner) }} (Order: {{ selectedBanner.display_order }})</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          This action cannot be undone. Removing this banner will immediately unpublish it from the storefront layout.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton 
            variant="outline" 
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="modalState.closeModal()"
            :disabled="isDeleting"
          >
            Cancel
          </UiButton>
          <UiButton 
            variant="destructive" 
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="handleDeleteBanner"
            :disabled="isDeleting"
          >
            <RefreshCw v-if="isDeleting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>

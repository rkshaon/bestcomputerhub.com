<!-- File: /pages/admin/banners/index.vue -->
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
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
  Upload,
  UploadCloud,
  FileText,
  Link,
  GripVertical,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBannerService } from '@/composables/useBannerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import { isNonSquareAspect, isAspectRatioMismatch } from '@/utils/imageValidation';
import type { Banner, BannerPlacement } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import UiCard from '@/components/ui/UiCard.vue';
import BannerFormModal from '@/features/admin/banners/components/BannerFormModal.vue';

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

// Image preview error map for table
const imageErrorMap = ref<Record<string | number, boolean>>({});
const handleImageError = (id: string | number) => {
  imageErrorMap.value[id] = true;
};

// Map placement IDs to Placement entities
const placementsMap = computed<Record<number, BannerPlacement>>(() => {
  const map: Record<number, BannerPlacement> = {};
  for (const p of placementsList.value) {
    map[p.id] = p;
  }
  return map;
});

const getPlacementDisplayName = (banner: Banner): string => {
  if (banner.placement_name) return banner.placement_name;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.name;
  }
  return `Placement #${banner.placement}`;
};

const getPlacementCode = (banner: Banner): string => {
  if (banner.placement_code) return banner.placement_code;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.code;
  }
  return '';
};

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

// Fetch placements options
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

// Drag & drop / Reordering state
const draggedBannerId = ref<number | string | null>(null);
const dragOverBannerId = ref<number | string | null>(null);
const initialBannerIds = ref<Array<number | string>>([]);
const isSavingOrder = ref(false);

const currentBannerIds = computed(() => bannersList.value.map(b => b.id));

const hasUnsavedOrderChanges = computed(() => {
  if (!selectedPlacement.value) return false;
  if (initialBannerIds.value.length === 0 || currentBannerIds.value.length !== initialBannerIds.value.length) {
    return false;
  }
  return currentBannerIds.value.some((id, index) => String(id) !== String(initialBannerIds.value[index]));
});

// HTML5 Drag and Drop Event Handlers
const handleDragStart = (event: DragEvent, banner: Banner) => {
  if (!selectedPlacement.value || !canEdit.value) return;
  draggedBannerId.value = banner.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(banner.id));
  }
};

const handleDragOver = (event: DragEvent, targetBanner: Banner) => {
  event.preventDefault();
  if (!selectedPlacement.value || !canEdit.value) return;
  if (draggedBannerId.value !== null && String(draggedBannerId.value) !== String(targetBanner.id)) {
    dragOverBannerId.value = targetBanner.id;
  }
};

const handleDragLeave = (event: DragEvent, targetBanner: Banner) => {
  if (String(dragOverBannerId.value) === String(targetBanner.id)) {
    dragOverBannerId.value = null;
  }
};

const handleDrop = (event: DragEvent, targetBanner: Banner) => {
  event.preventDefault();
  if (!selectedPlacement.value || !canEdit.value) return;
  if (draggedBannerId.value === null || String(draggedBannerId.value) === String(targetBanner.id)) {
    draggedBannerId.value = null;
    dragOverBannerId.value = null;
    return;
  }

  const srcIndex = bannersList.value.findIndex(b => String(b.id) === String(draggedBannerId.value));
  const tgtIndex = bannersList.value.findIndex(b => String(b.id) === String(targetBanner.id));

  if (srcIndex !== -1 && tgtIndex !== -1) {
    const list = [...bannersList.value];
    const [moved] = list.splice(srcIndex, 1);
    if (moved) {
      list.splice(tgtIndex, 0, moved);
      list.forEach((item, index) => {
        item.display_order = index;
      });
      bannersList.value = list;
    }
  }

  draggedBannerId.value = null;
  dragOverBannerId.value = null;
};

const handleDragEnd = () => {
  draggedBannerId.value = null;
  dragOverBannerId.value = null;
};

// Keyboard & Button-based Reordering
const moveBannerUp = (index: number) => {
  if (index <= 0 || index >= bannersList.value.length || !selectedPlacement.value) return;
  const list = [...bannersList.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index - 1, 0, moved);
    list.forEach((item, idx) => {
      item.display_order = idx;
    });
    bannersList.value = list;
  }
};

const moveBannerDown = (index: number) => {
  if (index < 0 || index >= bannersList.value.length - 1 || !selectedPlacement.value) return;
  const list = [...bannersList.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index + 1, 0, moved);
    list.forEach((item, idx) => {
      item.display_order = idx;
    });
    bannersList.value = list;
  }
};

// Discard local order changes
const handleDiscardOrder = () => {
  if (!initialBannerIds.value.length) return;
  const map = new Map(bannersList.value.map(b => [String(b.id), b]));
  const restored: Banner[] = [];
  initialBannerIds.value.forEach((id, idx) => {
    const b = map.get(String(id));
    if (b) {
      b.display_order = idx;
      restored.push(b);
    }
  });
  bannersList.value.forEach(b => {
    if (!initialBannerIds.value.map(String).includes(String(b.id))) {
      restored.push(b);
    }
  });
  bannersList.value = restored;
  toastSuccess('Banner display order changes discarded.');
};

// Save Order API call
const handleSaveOrder = async () => {
  if (!hasUnsavedOrderChanges.value || isSavingOrder.value || !selectedPlacement.value) return;

  if (!canEdit.value) {
    toastError('You do not have permission to reorder banners.');
    return;
  }

  isSavingOrder.value = true;
  try {
    const placementId = Number(selectedPlacement.value);
    const payload = {
      placement: placementId,
      banners: bannersList.value.map((b, idx) => ({
        id: Number(b.id),
        display_order: idx
      }))
    };

    await bannerService.reorderBanners(payload);
    toastSuccess('Banner display order saved successfully.');
    initialBannerIds.value = bannersList.value.map(b => b.id);
    await fetchBanners();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to save banner display order.');
    toastError(msg);
  } finally {
    isSavingOrder.value = false;
  }
};

const getRowAttrs = (item: Banner) => {
  if (!selectedPlacement.value || !canEdit.value) {
    return {};
  }
  return {
    draggable: true,
    onDragstart: (e: DragEvent) => handleDragStart(e, item),
    onDragover: (e: DragEvent) => handleDragOver(e, item),
    onDragleave: (e: DragEvent) => handleDragLeave(e, item),
    onDrop: (e: DragEvent) => handleDrop(e, item),
    onDragend: handleDragEnd
  };
};

const getRowClass = (item: Banner) => {
  if (draggedBannerId.value !== null && String(draggedBannerId.value) === String(item.id)) {
    return 'opacity-40 bg-muted/60 dark:bg-muted/40';
  }
  if (dragOverBannerId.value !== null && String(dragOverBannerId.value) === String(item.id)) {
    return 'border-t-2 border-primary bg-primary/5 dark:bg-primary/10';
  }
  return '';
};

// Fetch Banners List
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
    initialBannerIds.value = bannersList.value.map(b => b.id);
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

  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) {
      delete query[key];
    }
  });

  router.push({ query });
  fetchBanners();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(selectedPlacement, (newVal, oldVal) => {
  if (oldVal !== undefined && oldVal !== newVal && hasUnsavedOrderChanges.value) {
    const confirmDiscard = window.confirm(
      'You have unsaved banner display order changes. Switching placement will discard these changes. Do you want to proceed?'
    );
    if (!confirmDiscard) {
      selectedPlacement.value = oldVal;
      return;
    }
  }
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(statusFilter, () => {
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

const activeBannersCount = computed(() => {
  return bannersList.value.filter(b => b.is_active).length;
});

const placementsCount = computed(() => {
  return placementsList.value.length;
});

// Image Metadata Cache for aspect ratio detection (3:2 expected)
const imageMetadataCache = reactive<
  Record<string, { width?: number; height?: number; size?: number; loaded?: boolean; loading?: boolean }>
>({});

const fetchImageMetadata = async (url: string) => {
  if (import.meta.server || !url || imageMetadataCache[url]?.loaded || imageMetadataCache[url]?.loading) return;
  imageMetadataCache[url] = { ...imageMetadataCache[url], loading: true };

  try {
    const img = new Image();
    const dimensionsPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });

    const sizePromise = fetch(url, { method: 'HEAD' })
      .then((res) => {
        const length = res.headers.get('content-length');
        const parsedLength = length ? parseInt(length, 10) : NaN;
        return !isNaN(parsedLength) && parsedLength > 0 ? parsedLength : undefined;
      })
      .catch(() => undefined);

    const [dims, size] = await Promise.all([
      dimensionsPromise.catch(() => ({ width: 0, height: 0 })),
      sizePromise
    ]);

    imageMetadataCache[url] = {
      width: dims.width,
      height: dims.height,
      size,
      loaded: true,
      loading: false
    };
  } catch {
    imageMetadataCache[url] = { loaded: true, loading: false };
  }
};

const handleImageLoad = (imageUrl: string, event: Event) => {
  const target = event.target as HTMLImageElement | null;
  if (target && target.naturalWidth && target.naturalHeight) {
    if (!imageMetadataCache[imageUrl] || !imageMetadataCache[imageUrl]?.loaded) {
      imageMetadataCache[imageUrl] = {
        ...imageMetadataCache[imageUrl],
        width: target.naturalWidth,
        height: target.naturalHeight,
        loaded: true,
        loading: false
      };
    }
  }
};

const isBannerRatioMismatch = (imageUrl?: string | null): boolean => {
  if (!imageUrl) return false;
  const meta = imageMetadataCache[imageUrl];
  if (!meta?.loaded || !meta?.width || !meta?.height) return false;
  return isAspectRatioMismatch(meta.width, meta.height, 3, 2);
};

const isBannerRatioMatch = (imageUrl?: string | null): boolean => {
  if (!imageUrl) return false;
  const meta = imageMetadataCache[imageUrl];
  if (!meta?.loaded || !meta?.width || !meta?.height) return false;
  return !isAspectRatioMismatch(meta.width, meta.height, 3, 2);
};

watch(
  () => bannersList.value,
  (newBanners) => {
    if (!newBanners) return;
    newBanners.forEach((banner) => {
      if (banner.image) {
        fetchImageMetadata(banner.image);
      }
    });
  },
  { immediate: true, deep: true }
);

const tableColumns = computed<UiTableColumn<Banner>[]>(() => {
  const cols: UiTableColumn<Banner>[] = [];
  if (selectedPlacement.value && canEdit.value) {
    cols.push({ key: 'reorder', label: 'Order', width: '90px', align: 'center' });
  }
  cols.push(
    { key: 'preview', label: 'Preview', width: '110px', align: 'center' },
    { key: 'details', label: 'Banner Details', width: '280px' },
    { key: 'placement', label: 'Placement', width: '160px' },
    { key: 'display_order', label: 'Position', width: '90px', align: 'center' },
    { key: 'schedule', label: 'Schedule', width: '170px' },
    { key: 'status', label: 'Status', width: '110px', align: 'center' },
    { key: 'actions', label: 'Actions', width: '110px', align: 'right' }
  );
  return cols;
});

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
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          to="/admin/placements/"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Manage Placements</span>
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

      <!-- Unsaved Reorder Changes Banner -->
      <div v-if="hasUnsavedOrderChanges" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-amber-800 dark:text-amber-300 shadow-xs">
        <div class="flex items-center gap-2.5">
          <AlertCircle class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span class="text-xs font-bold">
            You have unsaved display order changes for this placement zone.
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UiButton 
            variant="outline" 
            size="sm" 
            class="h-8 px-3 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-bold" 
            @click="handleDiscardOrder"
            :disabled="isSavingOrder"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-1" />
            <span>Discard</span>
          </UiButton>
          <UiButton 
            size="sm" 
            class="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs" 
            @click="handleSaveOrder"
            :disabled="isSavingOrder"
          >
            <Loader2 v-if="isSavingOrder" class="w-3.5 h-3.5 mr-1 animate-spin" />
            <Save v-else class="w-3.5 h-3.5 mr-1" />
            <span>Save Order</span>
          </UiButton>
        </div>
      </div>

      <!-- Main Data Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="bannersList"
          :loading="isLoading"
          key-field="id"
          :row-attrs="getRowAttrs"
          :row-class="getRowClass"
          empty-text="No banners found"
          empty-description="Adjust your search criteria or create a new banner to populate this placement."
        >
          <!-- Custom Column: Reorder Drag Handle & Controls -->
          <template #cell-reorder="{ item, index }">
            <div class="flex items-center justify-center gap-1">
              <button
                type="button"
                class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to reorder banner"
                :disabled="!selectedPlacement || !canEdit"
              >
                <GripVertical class="w-4 h-4" />
              </button>
              <div class="flex flex-col gap-0.5">
                <button
                  type="button"
                  class="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  :disabled="index === 0 || !canEdit"
                  title="Move up"
                  @click.stop="moveBannerUp(index)"
                >
                  <ArrowUp class="w-3 h-3" />
                </button>
                <button
                  type="button"
                  class="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  :disabled="index === bannersList.length - 1 || !canEdit"
                  title="Move down"
                  @click.stop="moveBannerDown(index)"
                >
                  <ArrowDown class="w-3 h-3" />
                </button>
              </div>
            </div>
          </template>
          <!-- Custom Column: Image Preview with 3:2 Ratio Indicator -->
          <template #cell-preview="{ item }">
            <div class="flex flex-col items-center justify-center gap-1.5 py-1">
              <div
                :class="[
                  'w-16 h-10 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center relative group transition-all',
                  item.image && isBannerRatioMismatch(item.image)
                    ? 'border-amber-500/70 dark:border-amber-500/60 ring-1 ring-amber-500/30 shadow-2xs'
                    : 'border-border/80'
                ]"
              >
                <img
                  v-if="item.image && !imageErrorMap[item.id]"
                  :src="item.image"
                  :alt="item.title || 'Banner Preview'"
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  @load="handleImageLoad(item.image, $event)"
                  @error="handleImageError(item.id)"
                />
                <div v-else class="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon class="w-4 h-4" />
                </div>
              </div>

              <!-- Ratio Indicator for Desktop Image -->
              <div v-if="item.image && !imageErrorMap[item.id]" class="flex items-center justify-center">
                <!-- Loading State -->
                <span
                  v-if="imageMetadataCache[item.image]?.loading"
                  class="inline-flex items-center gap-1 text-[9px] text-muted-foreground font-mono"
                  title="Inspecting image aspect ratio..."
                >
                  <Loader2 class="w-2.5 h-2.5 animate-spin text-muted-foreground" />
                  <span class="text-[8.5px]">Checking</span>
                </span>

                <!-- Mismatch State -->
                <span
                  v-else-if="isBannerRatioMismatch(item.image)"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs leading-none"
                  :title="`Aspect ratio mismatch: Expected 3:2 ratio (${imageMetadataCache[item.image]?.width || 0}×${imageMetadataCache[item.image]?.height || 0}px detected).`"
                >
                  <AlertCircle class="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                  <span>Non-3:2</span>
                </span>

                <!-- Matching State -->
                <span
                  v-else-if="isBannerRatioMatch(item.image)"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs leading-none"
                  :title="`3:2 aspect ratio matching (${imageMetadataCache[item.image]?.width || 0}×${imageMetadataCache[item.image]?.height || 0}px).`"
                >
                  <Check class="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span>3:2 Match</span>
                </span>
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

    <!-- Create & Edit Banner Modal -->
    <BannerFormModal
      :is-open="modalState.isCreate.value || modalState.isEdit.value"
      :mode="modalState.isCreate.value ? 'create' : 'edit'"
      :banner="selectedBanner"
      :placements="placementsList"
      :is-resolving="modalState.isResolving.value"
      @close="modalState.closeModal()"
      @saved="fetchBanners"
    />

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

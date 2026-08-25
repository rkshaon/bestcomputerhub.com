<!-- File: /pages/admin/brands/index.vue -->
<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  ChevronRight,
  ChevronLeft,
  Globe,
  Award,
  ShieldCheck,
  Zap,
  Tag,
  X,
  Check,
  AlertCircle,
  Clock,
  RotateCcw,
  Flag,
  RefreshCw,
  LayoutGrid,
  List,
  Upload,
  GripVertical
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBrandService } from '@/composables/useBrandService';
import { cn, decodeHtmlEntities } from '@/utils';
import type { Brand } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import { toastSuccess, toastError, toastInfo, extractErrorMessage } from '@/composables/useToast';
import Button from '@/components/ui/Button.vue';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useInfinitePagination, type PaginatedResponse } from '@/composables/useInfinitePagination';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';

definePageMeta({
  layout: false
});

const brandService = useBrandService();

const route = useRoute();
const router = useRouter();

// State vectors initialized from URL query parameters
const brandsList = ref<Brand[]>([]);
const isLoading = ref(false);
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref<'all' | 'active' | 'inactive'>((route.query.status as 'all' | 'active' | 'inactive') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);
const viewMode = ref<'grid' | 'list'>('list');
const isSubmitPending = ref(false);

// Reusable URL-driven modal state infrastructure
const modalState = useAdminModalState<Brand>({
  getItems: async (id) => {
    return await brandService.getBrandDetails(id);
  },
  onResolveError: (id) => {
    toastError(`Brand #${id} could not be resolved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedBrand = computed(() => modalState.activeEntity.value);

// Focus input references
const partnerNameInput = ref<HTMLInputElement | null>(null);
const editPartnerNameInput = ref<HTMLInputElement | null>(null);

watch(() => modalState.isCreate.value, (newValue) => {
  if (newValue) {
    nextTick(() => {
      partnerNameInput.value?.focus();
    });
  }
});

watch(() => modalState.isEdit.value, (newValue) => {
  if (newValue) {
    nextTick(() => {
      editPartnerNameInput.value?.focus();
    });
  }
});

// Form payload states
const formError = ref<string | null>(null);
const formPayload = ref({
  id: '',
  name: '',
  slug: '',
  description: '',
  is_active: true,
  display_order: 1
});

watch(() => modalState.activeEntity.value, (newBrand) => {
  if (newBrand && modalState.isEdit.value) {
    formPayload.value = {
      id: String(newBrand.id),
      name: newBrand.name,
      slug: newBrand.slug,
      description: newBrand.description || '',
      is_active: newBrand.is_active !== false,
      display_order: newBrand.display_order !== undefined ? newBrand.display_order : 1
    };
    formError.value = null;
    selectedLogoFile.value = null;
    logoPreviewUrl.value = newBrand.logo || null;
  }
}, { immediate: true });

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    formPayload.value = { id: '', name: '', slug: '', description: '', is_active: true, display_order: 1 };
    formError.value = null;
    removeSelectedLogo();
  }
});

// Logo file state for creation
const selectedLogoFile = ref<File | null>(null);
const logoPreviewUrl = ref<string | null>(null);
const isLogoDragActive = ref(false);
const logoFileInput = ref<HTMLInputElement | null>(null);
const editLogoFileInput = ref<HTMLInputElement | null>(null);

const setLogoFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    formError.value = 'Selected file must be an image (PNG, JPG, WEBP, SVG, etc.).';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    formError.value = 'Logo image file size must not exceed 5MB.';
    return;
  }
  formError.value = null;
  selectedLogoFile.value = file;
  if (logoPreviewUrl.value && logoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoPreviewUrl.value);
  }
  logoPreviewUrl.value = URL.createObjectURL(file);
};

const handleLogoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    setLogoFile(target.files[0]);
  }
};

const handleLogoDrop = (event: DragEvent) => {
  isLogoDragActive.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    setLogoFile(event.dataTransfer.files[0]);
  }
};

const removeSelectedLogo = () => {
  selectedLogoFile.value = null;
  if (logoPreviewUrl.value && logoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(logoPreviewUrl.value);
  }
  logoPreviewUrl.value = null;
  if (logoFileInput.value) {
    logoFileInput.value.value = '';
  }
};

// Toast notification broker using global vue-sonner
const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (type === 'success') {
    toastSuccess(message);
  } else if (type === 'error') {
    toastError(message);
  } else {
    toastInfo(message);
  }
};

// Infinite scroll pagination composable for Grid View
const {
  items: gridBrands,
  totalCount: gridTotalCount,
  isLoading: isGridLoading,
  isFetchingNextPage: isGridFetchingNext,
  hasMore: gridHasMore,
  error: gridError,
  fetchFirstPage: fetchGridFirstPage,
  loadNextPage: loadGridNextPage,
  refresh: refreshGridPagination,
  reset: resetGridPagination
} = useInfinitePagination<Brand>({
  fetcher: async (params): Promise<PaginatedResponse<Brand>> => {
    if (viewMode.value !== 'grid') {
      return { results: [], count: 0, next: null, previous: null };
    }
    const res = await brandService.getBrandsPaginatedList({
      page: params.page,
      page_size: 12,
      search: searchQuery.value
    });
    let results: Brand[] = res.results.map(b => ({
      ...b,
      is_active: b.is_active !== undefined ? b.is_active : true
    }));
    if (statusFilter.value !== 'all') {
      results = results.filter(b => 
        (statusFilter.value === 'active' && b.is_active) ||
        (statusFilter.value === 'inactive' && !b.is_active)
      );
    }
    const pageNum = res.page ?? params.page;
    const totalPagesNum = res.pages ?? (Math.ceil(res.count / 12) || 1);
    return {
      results,
      count: res.count,
      next: pageNum < totalPagesNum ? `?page=${pageNum + 1}` : null,
      previous: pageNum > 1 ? `?page=${pageNum - 1}` : null
    };
  },
  search: searchQuery,
  extraParams: computed(() => ({ status: statusFilter.value })),
  autoFetch: false
});

// Data integration lifecycles
const fetchRegistry = async () => {
  isLoading.value = true;
  try {
    const list = await brandService.getBrandsList({ search: debouncedSearchQuery.value });
    // Default the is_active if undefined
    brandsList.value = list.map(b => ({
      ...b,
      is_active: b.is_active !== undefined ? b.is_active : true
    }));
  } catch (error: any) {
    triggerToast(error.message || 'System error on catalog polling.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const refreshActiveView = async () => {
  if (viewMode.value === 'grid') {
    await refreshGridPagination();
  } else {
    await fetchRegistry();
  }
};

onMounted(async () => {
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else {
    await fetchRegistry();
  }
});

// Watch view mode changes to execute isolated pagination strategy switches
watch(viewMode, async (newMode) => {
  if (newMode === 'grid') {
    resetGridPagination();
    await fetchGridFirstPage();
  } else if (newMode === 'list') {
    currentPage.value = 1;
    await fetchRegistry();
  }
});

// Refetch when debounced search query or status filter changes in List View
watch([debouncedSearchQuery, statusFilter], async () => {
  if (viewMode.value === 'list') {
    currentPage.value = 1;
    await fetchRegistry();
  }
});

// Reactivity filters for List View
const filteredBrands = computed(() => {
  return brandsList.value.filter(b => {
    const matchesStatus = statusFilter.value === 'all' || 
                          (statusFilter.value === 'active' && b.is_active) ||
                          (statusFilter.value === 'inactive' && !b.is_active);
    
    return matchesStatus;
  });
});

// Pagination computed bounds for List View
const totalPages = computed(() => {
  return Math.ceil(filteredBrands.value.length / itemsPerPage.value) || 1;
});

const paginatedBrands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredBrands.value.slice(start, end);
});

// Auto-reset page on itemsPerPage trigger
watch(itemsPerPage, () => {
  currentPage.value = 1;
});

// Update URL parameters when state changes
watch([searchQuery, statusFilter, currentPage, itemsPerPage, viewMode], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (viewMode.value === 'list' && currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (viewMode.value === 'list' && itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
});

// Sync state from URL changes (such as browser Back / Forward navigation)
watch(() => route.query, (newQuery) => {
  const newSearch = newQuery.search ? String(newQuery.search) : '';
  if (searchQuery.value !== newSearch) searchQuery.value = newSearch;

  const newStatus = (newQuery.status as any) || 'all';
  if (statusFilter.value !== newStatus) statusFilter.value = newStatus;

  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) currentPage.value = newPage;

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 10 : 10;
  if (itemsPerPage.value !== newPageSize) itemsPerPage.value = newPageSize;
});

// Form Helpers: Auto slug generator
const autoSlugify = () => {
  if (modalState.isCreate.value) {
    formPayload.value.slug = formPayload.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word/non-space
      .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphen
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  }
};

// Save operations
const handleCreateBrand = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Brand Designation Name is required.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Technical identity Slug is required.';
    return;
  }

  const parsedOrder = Number(formPayload.value.display_order);
  if (isNaN(parsedOrder) || parsedOrder <= 0 || !Number.isInteger(parsedOrder)) {
    formError.value = 'Display Order must be a positive integer.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await brandService.createBrand({
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      display_order: parsedOrder,
      logo: selectedLogoFile.value
    });
    
    removeSelectedLogo();
    modalState.closeModal();
    triggerToast(`Partner [${formPayload.value.name}] initialized successfully.`);
    await refreshActiveView();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on brand registration.');
    formError.value = msg;
    triggerToast(msg, 'error');
  } finally {
    isSubmitPending.value = false;
  }
};

const handleUpdateBrand = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Brand Name is required.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Brand Slug is required.';
    return;
  }

  const parsedOrder = Number(formPayload.value.display_order);
  if (isNaN(parsedOrder) || parsedOrder <= 0 || !Number.isInteger(parsedOrder)) {
    formError.value = 'Display Order must be a positive integer.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await brandService.updateBrand(formPayload.value.id, {
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      display_order: parsedOrder,
      logo: selectedLogoFile.value === null && logoPreviewUrl.value === null ? null : selectedLogoFile.value
    });

    modalState.closeModal();
    removeSelectedLogo();
    triggerToast(`Brand [${formPayload.value.name}] updated successfully.`);
    await refreshActiveView();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on brand modification.');
    formError.value = msg;
    triggerToast(msg, 'error');
  } finally {
    isSubmitPending.value = false;
  }
};

const executeDeleteBrand = async () => {
  const brand = modalState.activeEntity.value;
  if (!brand) return;
  isSubmitPending.value = true;
  try {
    await brandService.deleteBrand(brand.id);
    triggerToast(`Brand [${brand.name}] has been successfully deleted.`, 'info');
    await refreshActiveView();
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
    modalState.closeModal();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Delete action failed.');
    triggerToast(msg, 'error');
  } finally {
    isSubmitPending.value = false;
  }
};

// --- DRAG-AND-DROP REORDERING LOGIC ---
const draggedBrandId = ref<string | number | null>(null);
const dragOverBrandId = ref<string | number | null>(null);

const onDragStart = (event: DragEvent, id: string | number) => {
  draggedBrandId.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
  }
};

const onDragOver = (event: DragEvent, id: string | number) => {
  if (draggedBrandId.value !== id) {
    dragOverBrandId.value = id;
  }
};

const onDragLeave = (event: DragEvent, id: string | number) => {
  if (dragOverBrandId.value === id) {
    dragOverBrandId.value = null;
  }
};

const onDragEnd = (event: DragEvent) => {
  draggedBrandId.value = null;
  dragOverBrandId.value = null;
};

const onDrop = async (event: DragEvent, id: string | number) => {
  dragOverBrandId.value = null;
  const draggedId = draggedBrandId.value;
  draggedBrandId.value = null;
  if (draggedId !== null && draggedId !== id) {
    await handleReorder(draggedId, id);
  }
};

const handleReorder = async (draggedId: string | number, targetId: string | number) => {
  if (draggedId === targetId) return;

  const currentList = viewMode.value === 'grid' ? [...gridBrands.value] : [...brandsList.value];

  const draggedIdx = currentList.findIndex(b => b.id === draggedId);
  const targetIdx = currentList.findIndex(b => b.id === targetId);

  if (draggedIdx === -1 || targetIdx === -1) return;

  // Permute array locally first for zero-latency UI response
  const movedItems = currentList.splice(draggedIdx, 1);
  const movedItem = movedItems[0];
  if (!movedItem) return;
  currentList.splice(targetIdx, 0, movedItem);

  // Extract and sort current display_order values
  const sortedOrders = currentList
    .map((b, idx) => b.display_order !== undefined ? b.display_order : idx + 1)
    .sort((a, b) => a - b);

  // Match the new visual layout with the display order list
  const updates: { id: string | number; display_order: number; name: string; slug: string; description: string }[] = [];

  for (let i = 0; i < currentList.length; i++) {
    const newOrder = sortedOrders[i];
    const brand = currentList[i];
    if (!brand || newOrder === undefined) continue;
    if (brand.display_order !== newOrder) {
      brand.display_order = newOrder;
      updates.push({
        id: brand.id,
        display_order: newOrder,
        name: brand.name,
        slug: brand.slug,
        description: brand.description || ''
      });
    }
  }

  // Update local reactive list immediately
  if (viewMode.value === 'grid') {
    gridBrands.value = currentList;
  } else {
    brandsList.value = currentList;
  }

  // Persist modifications to backend service
  if (updates.length > 0) {
    isLoading.value = true;
    try {
      await Promise.all(updates.map(item => 
        brandService.updateBrand(item.id, {
          name: item.name,
          slug: item.slug,
          description: item.description,
          display_order: item.display_order
        })
      ));
      triggerToast('Brand hierarchy reordered successfully.');
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save updated brand order.');
      triggerToast(msg, 'error');
      await refreshActiveView(); // Revert to database truth on failure
    } finally {
      isLoading.value = false;
    }
  }
};

// --- STATS COMPUTED AGGREGATES ---
const totalBrandsCount = computed(() => {
  if (viewMode.value === 'grid') {
    return gridTotalCount.value;
  }
  return brandsList.value.length;
});

const activeBrandsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridBrands.value : brandsList.value;
  return source.filter(b => b.is_active !== false).length;
});

const inactiveBrandsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridBrands.value : brandsList.value;
  return source.filter(b => b.is_active === false).length;
});

// --- REUSABLE TABLE CONFIGURATION ---
const tableColumns: UiTableColumn<Brand>[] = [
  { key: 'name', label: 'Brand', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'slug', label: 'Slug', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'is_active', label: 'Status', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'display_order', label: 'Display Order', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'productCount', label: 'Products', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
];

const getTableRowClass = (brand: Brand) => {
  return cn(
    'cursor-grab active:cursor-grabbing',
    draggedBrandId.value === brand.id ? 'opacity-40' : '',
    dragOverBrandId.value === brand.id ? 'bg-primary/5 border-y-2 border-dashed border-primary/40' : ''
  );
};

const getTableRowAttrs = (brand: Brand) => ({
  draggable: true,
  onDragstart: (e: DragEvent) => onDragStart(e, brand.id),
  onDragover: (e: DragEvent) => onDragOver(e, brand.id),
  onDragleave: (e: DragEvent) => onDragLeave(e, brand.id),
  onDrop: (e: DragEvent) => onDrop(e, brand.id),
  onDragend: (e: DragEvent) => onDragEnd(e),
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Brands
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="refreshActiveView"
          :disabled="isLoading || isGridLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', (isLoading || isGridLoading) && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Brand</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Active Analytics row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Tag class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Brands</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalBrandsCount }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Brands</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ activeBrandsCount }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Inactive Brands</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ inactiveBrandsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Filters framework -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search brands..." 
            class="w-full sm:w-80"
          />
          
          <!-- View Toggle Buttons -->
          <div class="flex items-center self-start sm:self-auto bg-muted/60 p-1 rounded-lg border border-border/80">
            <button
              type="button"
              @click="viewMode = 'grid'"
              :class="[
                'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-background text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="viewMode = 'list'"
              :class="[
                'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                viewMode === 'list'
                  ? 'bg-background text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              title="List View"
              aria-label="List view"
            >
              <List class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status:</span>
            <select 
              v-model="statusFilter"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <!-- Items per page selector (List view only) -->
          <div v-if="viewMode === 'list'" class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select 
              v-model="itemsPerPage"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
              <option :value="1000">1000 / page</option>
            </select>
          </div>
        </div>
      </div>

    <!-- Loading, Empty, Error status layout handlers -->
    <div v-if="(viewMode === 'list' && isLoading) || (viewMode === 'grid' && isGridLoading && gridBrands.length === 0)" class="h-64 flex flex-col items-center justify-center gap-3 bg-card border border-border rounded-2xl">
      <span class="animate-spin border-4 border-primary/20 border-t-primary rounded-full w-10 h-10"></span>
      <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Querying Database Registry...</p>
    </div>

    <div v-else-if="brandService.errorMsg.value || (viewMode === 'grid' && gridError && gridBrands.length === 0)" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-card border border-border rounded-2xl">
      <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle class="w-6 h-6" />
      </div>
      <div>
        <p class="text-lg font-bold text-foreground">Network Integration Malfunction</p>
        <p class="text-xs text-muted-foreground max-w-md mx-auto mt-1">{{ brandService.errorMsg.value || gridError }}</p>
      </div>
      <button @click="refreshActiveView" class="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-xl font-bold hover:opacity-90">
        Re-verify Connection
      </button>
    </div>

    <!-- Grid View Mode -->
    <div v-else-if="viewMode === 'grid'" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="brand in gridBrands" 
          :key="brand.id"
          draggable="true"
          @dragstart="onDragStart($event, brand.id)"
          @dragover.prevent="onDragOver($event, brand.id)"
          @dragleave="onDragLeave($event, brand.id)"
          @drop="onDrop($event, brand.id)"
          @dragend="onDragEnd($event)"
          :class="[
            'bg-card text-card-foreground border rounded-2xl p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-grab active:cursor-grabbing',
            draggedBrandId === brand.id ? 'opacity-40 scale-[0.98]' : '',
            dragOverBrandId === brand.id ? 'border-primary/60 border-dashed bg-primary/5' : 'border-border'
          ]"
        >
          <div class="space-y-4">
            <!-- Brand Logo & Status -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-2 shrink-0">
                <GripVertical class="w-4 h-4 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing hover:text-slate-400 dark:hover:text-slate-500 transition-colors" />
                <div class="w-14 h-14 bg-background border border-border rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img 
                    :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" 
                    :alt="brand.name" 
                    class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border/60">
                <span :class="cn(
                  'w-2 h-2 rounded-full ring-4',
                  brand.is_active !== false 
                    ? 'bg-emerald-500 ring-emerald-500/10' 
                    : 'bg-muted-foreground/30 ring-muted-foreground/10'
                )"></span>
                <span class="text-[10px] uppercase font-bold tracking-widest" :class="brand.is_active !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
                  {{ brand.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <!-- Name and Slug -->
            <div>
              <h3 class="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                {{ decodeHtmlEntities(brand.name) }}
              </h3>
              <div class="mt-1 flex items-center gap-2">
                <span class="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60 uppercase tracking-wider font-semibold">
                  {{ brand.slug }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {{ brand.description || 'No description recorded.' }}
            </p>

            <!-- Order & Item count stats -->
            <div class="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Tag class="w-3.5 h-3.5 text-muted-foreground/60" />
                <span class="font-bold text-foreground">{{ brand.productCount || 0 }} Items</span>
              </div>
              <span class="font-mono text-[11px] font-bold text-muted-foreground">
                Order: #{{ brand.display_order || 'Unassigned' }}
              </span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
            <span class="text-[10px] font-semibold text-muted-foreground">
              ID: #{{ brand.id }}
            </span>

            <div class="flex items-center gap-1">
              <button 
                @click="modalState.openView(brand.id)" 
                class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="View Brand Details"
                aria-label="View brand details"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button 
                @click="modalState.openEdit(brand.id)" 
                class="p-2 text-muted-foreground hover:text-amber-500 hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Edit Brand"
                aria-label="Edit brand record"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                @click="modalState.openDelete(brand.id)" 
                class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Delete Brand"
                aria-label="Delete brand"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state in grid mode -->
        <div v-if="gridBrands.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-card border border-border rounded-2xl">
          <div class="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div class="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Search class="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p class="font-display font-medium text-lg text-foreground">No Brands Found</p>
              <p class="text-xs max-w-sm mx-auto mt-1">No brands matched the filter criteria.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Infinite Scroll Pagination Footer for Grid Mode -->
      <UiInfiniteScroll
        :has-more="gridHasMore"
        :is-loading="isGridFetchingNext"
        :error="gridError"
        @load-more="loadGridNextPage"
        @retry="loadGridNextPage"
      />
    </div>

    <!-- Paginated brand table (List View Mode) -->
    <UiTable
      v-else
      :columns="tableColumns"
      :data="paginatedBrands"
      :loading="isLoading"
      key-field="id"
      :row-class="getTableRowClass"
      :row-attrs="getTableRowAttrs"
    >
      <!-- Brand Identity Column -->
      <template #cell-name="{ item: brand }">
        <div class="flex items-center gap-3">
          <GripVertical class="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors shrink-0" />
          <div class="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center p-1 shadow-2xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
            <img :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" :alt="decodeHtmlEntities(brand.name)" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
          </div>
          <div class="min-w-0">
            <h4 class="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">{{ decodeHtmlEntities(brand.name) }}</h4>
            <p class="text-[10px] text-muted-foreground line-clamp-1 max-w-[280px] mt-0.5 leading-relaxed">{{ brand.description || 'No description recorded.' }}</p>
          </div>
        </div>
      </template>

      <!-- Slug Column -->
      <template #cell-slug="{ item: brand }">
        <span class="font-mono text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
          {{ brand.slug }}
        </span>
      </template>

      <!-- Status Lights Column -->
      <template #cell-is_active="{ item: brand }">
        <div class="flex items-center gap-2">
          <span :class="cn(
            'w-2 h-2 rounded-full ring-4',
            brand.is_active !== false 
              ? 'bg-emerald-500 ring-emerald-500/10' 
              : 'bg-slate-300 dark:bg-slate-700 ring-slate-300/10 dark:ring-slate-700/10'
          )"></span>
          <span class="text-[10px] uppercase font-bold tracking-widest" :class="brand.is_active !== false ? 'text-emerald-500' : 'text-slate-400'">
            {{ brand.is_active !== false ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </template>

      <!-- Display Order Column -->
      <template #cell-display_order="{ item: brand }">
        <span class="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
          #{{ brand.display_order || 'Unassigned' }}
        </span>
      </template>

      <!-- Products Column -->
      <template #cell-productCount="{ item: brand }">
        <div class="flex items-center gap-2">
          <Tag class="w-3.5 h-3.5 text-slate-300" />
          <span class="text-xs font-black text-slate-900 dark:text-slate-100">{{ brand.productCount || 0 }} Items</span>
        </div>
      </template>

      <!-- Action triggers Column -->
      <template #cell-actions="{ item: brand }">
        <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            @click="modalState.openView(brand.id)" 
            class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all cursor-pointer"
            title="View Brand Details"
            aria-label="View brand details"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            @click="modalState.openEdit(brand.id)" 
            class="p-1.5 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-md transition-all cursor-pointer"
            title="Edit Brand"
            aria-label="Edit brand record"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            @click="modalState.openDelete(brand.id)" 
            class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-all cursor-pointer"
            title="Delete Brand"
            aria-label="Delete brand"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>

      <!-- Empty list layout -->
      <template #empty>
        <div class="flex flex-col items-center justify-center gap-4 text-slate-400 py-6">
          <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <Search class="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">No Brands Found</p>
            <p class="text-xs max-w-sm mx-auto mt-1">No brands matched the filter criteria.</p>
          </div>
        </div>
      </template>

      <!-- Pagination Footer System -->
      <template #footer>
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="filteredBrands.length"
          :items-per-page="itemsPerPage"
          item-label="brands"
          prefix-label="Showing"
          variant="footer"
        />
      </template>
    </UiTable>

    <!-- MODAL 1: Create New Partner -->
    <UiAdminModal :is-open="modalState.isCreate.value" max-width="max-w-xl" :show-close-button="false" @close="modalState.closeModal">
      <form @submit.prevent="handleCreateBrand" class="w-full relative overflow-hidden flex flex-col cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">New Brand Partnership</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Add New Brand</h3>
          </div>
          <button type="button" @click="modalState.closeModal()" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <!-- Fields -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Name</label>
              <input 
                ref="partnerNameInput"
                v-model="formPayload.name" 
                @input="autoSlugify"
                type="text" 
                placeholder="e.g. Corsair" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Slug</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                placeholder="e.g. corsair" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
              />
              <p class="text-[10px] text-slate-400 ml-1">Unique identifier. Alphanumeric characters and hyphens allowed.</p>
            </div>

            <!-- Logo Upload Field -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Logo (Optional Image)</label>
              <div 
                @dragover.prevent="isLogoDragActive = true"
                @dragleave.prevent="isLogoDragActive = false"
                @drop.prevent="handleLogoDrop"
                :class="cn(
                  'border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer text-center space-y-2 min-h-[120px]',
                  isLogoDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                )"
                @click="logoFileInput?.click()"
              >
                <input 
                  ref="logoFileInput"
                  type="file" 
                  accept="image/*"
                  class="hidden" 
                  @change="handleLogoFileSelect" 
                />

                <div v-if="selectedLogoFile && logoPreviewUrl" class="flex items-center gap-4 w-full p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div class="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
                    <img :src="logoPreviewUrl" alt="Logo Preview" class="w-full h-full object-contain p-1" />
                  </div>
                  <div class="flex-1 text-left min-w-0">
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{{ selectedLogoFile.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">{{ (selectedLogoFile.size / 1024).toFixed(1) }} KB</p>
                  </div>
                  <button 
                    type="button" 
                    @click.stop="removeSelectedLogo" 
                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <template v-else>
                  <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Upload class="w-5 h-5" />
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drag & drop logo image, or <span class="text-primary hover:underline">browse files</span>
                    </p>
                    <p class="text-[10px] text-slate-400 font-mono">PNG, JPG, WEBP, SVG up to 5MB</p>
                  </div>
                </template>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Description</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                placeholder="e.g. High-performance gaming gear, PC components, and enthusiast equipment..." 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Order</label>
              <input 
                v-model="formPayload.display_order" 
                type="number" 
                min="1"
                step="1"
                placeholder="e.g. 1" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1">A positive integer determining the visual sequencing order of brands.</p>
            </div>
          </div>
        </div>

        <!-- Control Action bar -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="modalState.closeModal()" 
            class="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitPending"
            class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span v-if="isSubmitPending" class="animate-spin border-2 border-white/35 border-t-white rounded-full w-4 h-4 mr-1"></span>
            {{ isSubmitPending ? 'Saving Record...' : 'Create Brand' }}
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL 2: Edit Brand Details -->
    <UiAdminModal :is-open="modalState.isEdit.value" max-width="max-w-xl" :show-close-button="false" @close="modalState.closeModal">
      <form @submit.prevent="handleUpdateBrand" class="w-full relative overflow-hidden flex flex-col cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500">Admin Controls</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Edit Brand</h3>
          </div>
          <button type="button" @click="modalState.closeModal()" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <!-- Fields -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Name</label>
              <input 
                ref="editPartnerNameInput"
                v-model="formPayload.name" 
                type="text" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Slug (Read-only)</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                readonly
                class="w-full h-14 px-5 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm font-semibold text-slate-400 dark:text-slate-505 font-mono cursor-not-allowed"
              />
            </div>

            <!-- Logo Upload Field -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Logo (Optional Image)</label>
              <div 
                @dragover.prevent="isLogoDragActive = true"
                @dragleave.prevent="isLogoDragActive = false"
                @drop.prevent="handleLogoDrop"
                :class="cn(
                  'border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer text-center space-y-2 min-h-[120px]',
                  isLogoDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                )"
                @click="logoFileInput?.click()"
              >
                <input 
                  ref="logoFileInput"
                  type="file" 
                  accept="image/*"
                  class="hidden" 
                  @change="handleLogoFileSelect" 
                />

                <div v-if="logoPreviewUrl" class="flex items-center gap-4 w-full p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div class="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
                    <img :src="logoPreviewUrl" alt="Logo Preview" class="w-full h-full object-contain p-1" />
                  </div>
                  <div class="flex-1 text-left min-w-0">
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {{ selectedLogoFile ? selectedLogoFile.name : 'Current Brand Logo' }}
                    </p>
                    <p v-if="selectedLogoFile" class="text-[10px] text-slate-400 font-mono">{{ (selectedLogoFile.size / 1024).toFixed(1) }} KB</p>
                    <p v-else class="text-[10px] text-slate-400 font-mono">Active Logo URL</p>
                  </div>
                  <button 
                    type="button" 
                    @click.stop="removeSelectedLogo" 
                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <template v-else>
                  <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Upload class="w-5 h-5" />
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drag & drop logo image, or <span class="text-primary hover:underline">browse files</span>
                    </p>
                    <p class="text-[10px] text-slate-400 font-mono">PNG, JPG, WEBP, SVG up to 5MB</p>
                  </div>
                </template>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Description</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Order</label>
              <input 
                v-model="formPayload.display_order" 
                type="number" 
                min="1"
                step="1"
                placeholder="e.g. 1" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1 font-medium">A positive integer determining the visual sequencing order of brands.</p>
            </div>
          </div>
        </div>

        <!-- Control Action bar -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="modalState.closeModal()" 
            class="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitPending"
            class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span v-if="isSubmitPending" class="animate-spin border-2 border-white/35 border-t-white rounded-full w-4 h-4 mr-1"></span>
            {{ isSubmitPending ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL 3: Read-Only Audit Profile (Details View) -->
    <UiAdminModal :is-open="modalState.isView.value && !!selectedBrand" max-width="max-w-lg" :show-close-button="false" @close="modalState.closeModal">
      <div v-if="selectedBrand" class="w-full relative overflow-hidden flex flex-col cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Brand Details</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">View Brand</h3>
          </div>
          <button @click="modalState.closeModal()" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Profile Metadata Container -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div class="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/85">
            <div class="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center p-3 shadow-md overflow-hidden shrink-0">
              <img :src="selectedBrand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" :alt="selectedBrand.name" class="w-full h-full object-contain" />
            </div>
            <div>
              <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ selectedBrand.name }}</h4>
              <p class="text-xs font-mono text-primary font-bold mt-1 uppercase tracking-wider">{{ selectedBrand.slug }}</p>
              <div class="flex items-center gap-1.5 mt-2">
                <span :class="cn(
                  'w-1.5 h-1.5 rounded-full',
                  selectedBrand.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                )"></span>
                <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {{ selectedBrand.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Technical Specs -->
          <div class="space-y-4">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Description</p>
            <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 italic">
              {{ selectedBrand.description || 'No description available.' }}
            </p>

            <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Brand ID</span>
                <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{{ selectedBrand.id }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mapped Products</span>
                <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ selectedBrand.productCount || 0 }} products</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Order</span>
                <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">{{ selectedBrand.display_order || 'Unassigned' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Control -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            @click="modalState.closeModal()" 
            class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-6 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="modalState.isDelete.value && !!modalState.activeEntity.value"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Brand Deletion</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the brand <span class="font-bold text-foreground">"{{ modalState.activeEntity.value?.name }}"</span>? All mapped products will remain, but their brand link will be removed.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button 
            type="button"
            class="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            @click="modalState.closeModal()"
            :disabled="isSubmitPending"
          >
            Cancel
          </button>

          <button 
            type="button"
            class="px-6 py-3 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 hover:bg-rose-600/90 gap-2 transition-all cursor-pointer flex items-center"
            @click="executeDeleteBrand"
            :disabled="isSubmitPending"
          >
            <span v-if="isSubmitPending" class="animate-spin border-2 border-white/35 border-t-white rounded-full w-4 h-4 mr-1"></span>
            <span>Delete Brand</span>
          </button>
        </div>
      </div>
    </UiAdminModal>

    </div>
  </NuxtLayout>
</template>

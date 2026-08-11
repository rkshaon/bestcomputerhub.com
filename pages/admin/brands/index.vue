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
  Upload
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBrandService } from '@/composables/useBrandService';
import { cn } from '@/utils';
import type { Brand } from '@/types';
import { toastSuccess, toastError, toastInfo, extractErrorMessage } from '@/composables/useToast';
import Button from '@/components/ui/Button.vue';
import { useAdminModalState } from '@/composables/useAdminModalState';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';

definePageMeta({
  layout: 'admin'
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
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 5 : 5);
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

onMounted(async () => {
  await fetchRegistry();
});

// Refetch when debounced search query changes
watch(debouncedSearchQuery, async () => {
  currentPage.value = 1;
  await fetchRegistry();
});

// Reactivity filters
const filteredBrands = computed(() => {
  return brandsList.value.filter(b => {
    const matchesStatus = statusFilter.value === 'all' || 
                          (statusFilter.value === 'active' && b.is_active) ||
                          (statusFilter.value === 'inactive' && !b.is_active);
    
    return matchesStatus;
  });
});

// Pagination computed bounds
const totalPages = computed(() => {
  return Math.ceil(filteredBrands.value.length / itemsPerPage.value) || 1;
});

const paginatedBrands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredBrands.value.slice(start, end);
});

// Auto-reset page on search filter/page size trigger
watch([searchQuery, statusFilter, itemsPerPage], () => {
  currentPage.value = 1;
});

// Update URL parameters when state changes
watch([searchQuery, statusFilter, currentPage, itemsPerPage], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 5) query.pageSize = String(itemsPerPage.value);
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

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 5 : 5;
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
    await fetchRegistry();
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
    await fetchRegistry();
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
    await fetchRegistry();
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
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <!-- Top Action bar block -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-display font-extrabold tracking-tight">Brands</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage product brands and their catalog display details.</p>
      </div>
      <div class="flex items-center gap-3">
        <Button 
          variant="outline" 
          class="rounded-2xl h-11 px-5 gap-2 border-border font-bold text-xs"
          @click="fetchRegistry"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </Button>

        <button 
          @click="modalState.openCreate()"
          class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" /> Add Brand
        </button>
      </div>
    </div>

    <!-- Filters framework -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Search brands..." 
          class="w-full sm:w-80"
        />
        
        <!-- View Toggle Buttons -->
        <div class="flex items-center self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border/80">
          <button
            type="button"
            @click="viewMode = 'grid'"
            :class="[
              'p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer',
              viewMode === 'grid'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            title="Grid View"
            aria-label="Grid view"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="viewMode = 'list'"
            :class="[
              'p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer',
              viewMode === 'list'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            title="List View"
            aria-label="List view"
          >
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center border-l border-border pl-4">
        <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Status:</span>
        <select 
          v-model="statusFilter"
          class="h-10 px-3 bg-background border border-input rounded-xl outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <!-- Loading, Empty, Error status layout handlers -->
    <div v-if="brandService.isLoading.value" class="h-64 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <span class="animate-spin border-4 border-primary/20 border-t-primary rounded-full w-10 h-10"></span>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Querying Database Registry...</p>
    </div>

    <div v-else-if="brandService.errorMsg.value" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <div class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
        <AlertCircle class="w-6 h-6" />
      </div>
      <div>
        <p class="text-lg font-bold">Network Integration Malfunction</p>
        <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">{{ brandService.errorMsg.value }}</p>
      </div>
      <button @click="fetchRegistry" class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs px-4 py-2 rounded-xl font-bold hover:opacity-90">
        Re-verify Connection
      </button>
    </div>

    <!-- Grid View Mode -->
    <div v-else-if="viewMode === 'grid'" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="brand in paginatedBrands" 
          :key="brand.id"
          class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
        >
          <div class="space-y-4">
            <!-- Brand Logo & Status -->
            <div class="flex items-start justify-between gap-4">
              <div class="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                <img 
                  :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" 
                  :alt="brand.name" 
                  class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
                />
              </div>

              <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
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
            </div>

            <!-- Name and Slug -->
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                {{ brand.name }}
              </h3>
              <div class="mt-1 flex items-center gap-2">
                <span class="font-mono text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  {{ brand.slug }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {{ brand.description || 'No description recorded.' }}
            </p>

            <!-- Order & Item count stats -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-900/50 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Tag class="w-3.5 h-3.5 text-slate-300" />
                <span class="font-bold text-slate-900 dark:text-slate-100">{{ brand.productCount || 0 }} Items</span>
              </div>
              <span class="font-mono text-[11px] font-bold text-slate-400">
                Order: #{{ brand.display_order || 'Unassigned' }}
              </span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-900/50 flex items-center justify-between">
            <span class="text-[10px] font-semibold text-slate-400">
              ID: #{{ brand.id }}
            </span>

            <div class="flex items-center gap-1">
              <button 
                @click="modalState.openView(brand.id)" 
                class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                title="View Brand Details"
                aria-label="View brand details"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button 
                @click="modalState.openEdit(brand.id)" 
                class="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                title="Edit Brand"
                aria-label="Edit brand record"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                @click="modalState.openDelete(brand.id)" 
                class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                title="Delete Brand"
                aria-label="Delete brand"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state in grid mode -->
        <div v-if="filteredBrands.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
          <div class="flex flex-col items-center justify-center gap-4 text-slate-400">
            <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Search class="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">No Brands Found</p>
              <p class="text-xs max-w-sm mx-auto mt-1">No brands matched the filter criteria.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Shared Pagination Footer for Grid Mode -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing <span class="text-slate-800 dark:text-slate-200 font-black">{{ Math.min(filteredBrands.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredBrands.length, currentPage * itemsPerPage) }}</span> 
            of <span class="text-slate-800 dark:text-slate-200 font-black">{{ filteredBrands.length }}</span> brands.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          
          <div class="flex items-center gap-1 font-mono text-xs font-bold">
            <button 
              v-for="p in totalPages" 
              :key="p" 
              @click="currentPage = p"
              :class="cn(
                'w-10 h-10 rounded-xl font-bold transition-all cursor-pointer text-xs',
                currentPage === p 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
              )"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Paginated brand table (List View Mode) -->
    <div v-else class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">Brand</th>
              <th class="px-6 py-5">Slug</th>
              <th class="px-6 py-5">Status</th>
              <th class="px-6 py-5">Display Order</th>
              <th class="px-6 py-5">Products</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900/50">
            <tr v-for="brand in paginatedBrands" :key="brand.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              
              <!-- Brand Identity Column -->
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <img :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" :alt="brand.name" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">{{ brand.name }}</h4>
                    <p class="text-xs text-slate-400 line-clamp-1 max-w-[280px] mt-0.5 leading-relaxed">{{ brand.description || 'No description recorded.' }}</p>
                  </div>
                </div>
              </td>

              <!-- Slug Column -->
              <td class="px-6 py-5">
                <span class="font-mono text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  {{ brand.slug }}
                </span>
              </td>

              <!-- Status Lights Column -->
              <td class="px-6 py-5">
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
              </td>

              <!-- Display Order Column -->
              <td class="px-6 py-5">
                <span class="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                  #{{ brand.display_order || 'Unassigned' }}
                </span>
              </td>

              <!-- Products Column -->
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <Tag class="w-3.5 h-3.5 text-slate-300" />
                  <span class="text-xs font-black text-slate-900 dark:text-slate-100">{{ brand.productCount || 0 }} Items</span>
                </div>
              </td>

              <!-- Action triggers Column -->
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="modalState.openView(brand.id)" 
                    class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="View Brand Details"
                    aria-label="View brand details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    @click="modalState.openEdit(brand.id)" 
                    class="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Edit Brand"
                    aria-label="Edit brand record"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="modalState.openDelete(brand.id)" 
                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Delete Brand"
                    aria-label="Delete brand"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty list layout -->
            <tr v-if="filteredBrands.length === 0">
              <td colspan="6" class="px-8 py-16 text-center h-64">
                <div class="flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Search class="w-7 h-7 text-slate-300" />
                  </div>
                  <div>
                    <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">No Brands Found</p>
                    <p class="text-xs max-w-sm mx-auto mt-1">No brands matched the filter criteria.</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer System -->
      <div class="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing <span class="text-slate-800 dark:text-slate-200 font-black">{{ Math.min(filteredBrands.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredBrands.length, currentPage * itemsPerPage) }}</span> 
            of <span class="text-slate-800 dark:text-slate-200 font-black">{{ filteredBrands.length }}</span> brands.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          
          <div class="flex items-center gap-1 font-mono text-xs font-bold">
            <button 
              v-for="p in totalPages" 
              :key="p" 
              @click="currentPage = p"
              :class="cn(
                'w-10 h-10 rounded-xl font-bold transition-all cursor-pointer text-xs',
                currentPage === p 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
              )"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

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
</template>

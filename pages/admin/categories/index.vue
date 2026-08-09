<!-- File: /pages/admin/categories/index.vue -->
<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Layers, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Box,
  Image as ImageIcon,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  X,
  FolderOpen,
  Info,
  Upload
} from 'lucide-vue-next';
import { useCategoryService } from '@/composables/useCategoryService';
import { useProductService } from '@/composables/useProductService';
import { cn } from '@/utils';
import { refDebounced } from '@vueuse/core';
import type { Category } from '@/types';
import { toastSuccess, toastError, toastInfo, handleApiError, extractErrorMessage } from '@/composables/useToast';

definePageMeta({
  layout: 'admin'
});

const categoryService = useCategoryService();
const productService = useProductService();

const route = useRoute();
const router = useRouter();

// State managers initialized from URL query parameters
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const parentFilter = ref(route.query.parent ? String(route.query.parent) : 'all'); // 'all', 'none' (main level only), or specific category ID
const ordering = ref(route.query.ordering ? String(route.query.ordering) : 'order'); // 'order', '-order', 'name', '-name', 'slug', '-slug'
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

// Multi-select or dropdown values for raw root categories
const allCategoriesList = ref<Category[]>([]); // Broad list copy for parent lookup / select dropdowns

// Server-side paginated states
const categoriesList = ref<Category[]>([]);
const totalCount = ref(0);
const systemTotalCount = ref(0);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Overlay control triggers
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isViewModalOpen = ref(false);
const isImportModalOpen = ref(false);
const isSubmitPending = ref(false);
const selectedCategory = ref<Category | null>(null);

// Form element focus refs for keyboard accessibility
const categoryNameInput = ref<HTMLInputElement | null>(null);
const editCategoryNameInput = ref<HTMLInputElement | null>(null);
const formatSelectElement = ref<HTMLSelectElement | null>(null);

watch(isCreateModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      categoryNameInput.value?.focus();
    });
  }
});

watch(isEditModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      editCategoryNameInput.value?.focus();
    });
  }
});

watch(isImportModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      formatSelectElement.value?.focus();
    });
  }
});

// Category Bulk Import states
const importFormat = ref<'csv' | 'json' | 'xlsx'>('csv');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const importIsLoading = ref(false);
const importSuccessCount = ref<number | null>(null);
const importErrors = ref<string[]>([]);
const isDragActive = ref(false);

const triggerImportModal = () => {
  isImportModalOpen.value = true;
  selectedFile.value = null;
  importSuccessCount.value = null;
  importErrors.value = [];
  importFormat.value = 'csv';
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }
};

const validateAndSetFile = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (importFormat.value === 'csv' && extension !== 'csv') {
    toastError('Selected file format must be .csv');
    return;
  }
  if (importFormat.value === 'json' && extension !== 'json') {
    toastError('Selected file format must be .json');
    return;
  }
  if (importFormat.value === 'xlsx' && (extension !== 'xlsx' && extension !== 'xls')) {
    toastError('Selected file format must be .xlsx or .xls');
    return;
  }

  selectedFile.value = file;
  importSuccessCount.value = null;
  importErrors.value = [];
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragActive.value = true;
};

const onDragLeave = () => {
  isDragActive.value = false;
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragActive.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }
};

const submitImport = async () => {
  if (!selectedFile.value) {
    toastError('Please select a file to import first.');
    return;
  }

  importIsLoading.value = true;
  importErrors.value = [];
  importSuccessCount.value = null;

  try {
    let response;
    if (importFormat.value === 'csv') {
      response = await categoryService.importCategoriesFromCSV(selectedFile.value);
    } else if (importFormat.value === 'json') {
      response = await categoryService.importCategoriesFromJSON(selectedFile.value);
    } else {
      response = await categoryService.importCategoriesFromXLSX(selectedFile.value);
    }

    if (response.success) {
      importSuccessCount.value = response.created;
      toastSuccess(`Import completed. ${response.created} categories successfully registered.`);
      await fetchAllCategoriesRawList();
      
      if (response.errors && response.errors.length > 0) {
        importErrors.value = response.errors;
        toastInfo(`Import executed with ${response.errors.length} operational warnings.`);
      } else {
        setTimeout(() => {
          isImportModalOpen.value = false;
        }, 1500);
      }
    } else {
      importErrors.value = response.errors && response.errors.length > 0 ? response.errors : ['API execution successfully completed but returned failure.'];
      toastError('Import could not be fully executed.');
    }
  } catch (err: any) {
    const errorMsgText = err.data?.message || err.message || 'Validation failed on category bulk import.';
    importErrors.value = [errorMsgText];
    toastError('Category taxonomy import failed.');
  } finally {
    importIsLoading.value = false;
  }
};

// Form state payloads
const formError = ref<string | null>(null);
const formPayload = ref({
  id: '',
  name: '',
  slug: '',
  description: '',
  parentCategoryId: '',
  icon: '',
  image: '',
  order: 0
});

// Retrieve parent category name by ID (Local state resolution)
const getParentName = (parentId?: string): string => {
  if (!parentId) return 'None (Primary Group)';
  const matched = allCategoriesList.value.find(c => c.id === parentId);
  return matched ? matched.name : parentId;
};

// Fetch categories with server-side pagination, filters and queries
const fetchCategoriesPage = async () => {
  try {
    const filters: any = {
      page: currentPage.value,
      page_size: itemsPerPage.value
    };
    if (searchQuery.value) {
      filters.search = searchQuery.value;
    }
    if (parentFilter.value !== 'all') {
      filters.parent = parentFilter.value;
    }
    if (ordering.value && ordering.value !== 'order') {
      filters.ordering = ordering.value;
    }

    const response = await categoryService.getCategoriesList(filters);
    categoriesList.value = response.results;
    totalCount.value = response.count;
  } catch (error: any) {
    console.warn('Categories retrieval pagination error:', error.message);
  }
};

// Fetch broader category hierarchy list for dropdowns
const fetchAllCategoriesRawList = async () => {
  try {
    // Queries root categories for dropdown selectors/hierarchical lookup
    const rootRes = await categoryService.getCategoriesList({ is_parent: true, page_size: 10 });
    allCategoriesList.value = rootRes.results;

    // Retrieve system total count when no search/parent filter is applied (for stat cards overview)
    const systemRes = await categoryService.getCategoriesList({ page_size: 1 });
    systemTotalCount.value = systemRes.count;

    // Load active paginated grid content
    await fetchCategoriesPage();
  } catch (error: any) {
    console.warn('Parent categories indexing latency:', error.message);
  }
};

// Trigger synchronous reload of page database parameters
const loadCategoriesGrid = async () => {
  await fetchAllCategoriesRawList();
};

// Lifecycles
onMounted(async () => {
  await fetchAllCategoriesRawList();
});

// If searching or filtering, reset page index to 1
watch([debouncedSearchQuery, parentFilter, ordering, itemsPerPage], () => {
  currentPage.value = 1;
});

// Update URL parameters and fetch active page when parameters change
watch([debouncedSearchQuery, parentFilter, ordering, currentPage, itemsPerPage], async () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (parentFilter.value !== 'all') query.parent = parentFilter.value;
  else delete query.parent;

  if (ordering.value !== 'order') query.ordering = ordering.value;
  else delete query.ordering;

  if (currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });

  await fetchCategoriesPage();
});

// Sync state from URL changes (such as browser Back / Forward navigation)
watch(() => route.query, async (newQuery) => {
  let needsFetch = false;

  const newSearch = newQuery.search ? String(newQuery.search) : '';
  if (searchQuery.value !== newSearch) {
    searchQuery.value = newSearch;
    needsFetch = true;
  }

  const newParent = newQuery.parent ? String(newQuery.parent) : 'all';
  if (parentFilter.value !== newParent) {
    parentFilter.value = newParent;
    needsFetch = true;
  }

  const newOrdering = newQuery.ordering ? String(newQuery.ordering) : 'order';
  if (ordering.value !== newOrdering) {
    ordering.value = newOrdering;
    needsFetch = true;
  }

  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) {
    currentPage.value = newPage;
    needsFetch = true;
  }

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 10 : 10;
  if (itemsPerPage.value !== newPageSize) {
    itemsPerPage.value = newPageSize;
    needsFetch = true;
  }

  if (needsFetch) {
    await fetchCategoriesPage();
  }
});

// Slug generator
const generateCustomSlug = () => {
  if (isCreateModalOpen.value) {
    formPayload.value.slug = formPayload.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

// Modal toggles
const triggerCreateModal = () => {
  formPayload.value = {
    id: '',
    name: '',
    slug: '',
    description: '',
    parentCategoryId: '',
    icon: '📁',
    image: '',
    order: 0
  };
  formError.value = null;
  isCreateModalOpen.value = true;
};

const triggerEditModal = (cat: Category) => {
  formPayload.value = {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    parentCategoryId: cat.parentCategoryId || '',
    icon: cat.icon || '📁',
    image: cat.image || '',
    order: cat.order ?? 0
  };
  formError.value = null;
  isEditModalOpen.value = true;
};

const triggerViewModal = (cat: Category) => {
  selectedCategory.value = cat;
  isViewModalOpen.value = true;
};

// CREATE CATEGORY
const submitCreateCategory = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Category Name is a required designation.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Category Identifier Code (Slug) is required.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await categoryService.createCategory({
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      parentCategoryId: formPayload.value.parentCategoryId || undefined,
      icon: formPayload.value.icon || undefined,
      image: formPayload.value.image || undefined,
      order: Number(formPayload.value.order) || 0
    });

    isCreateModalOpen.value = false;
    toastSuccess(`Category [${formPayload.value.name}] generated successfully.`);
    await fetchAllCategoriesRawList();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on category create.');
    formError.value = msg;
    toastError(msg);
  } finally {
    isSubmitPending.value = false;
  }
};

// UPDATE CATEGORY
const submitUpdateCategory = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Category Name is a required designation.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Category Identifier Code (Slug) is required.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await categoryService.updateCategory(formPayload.value.id, {
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      parentCategoryId: formPayload.value.parentCategoryId || undefined,
      icon: formPayload.value.icon || undefined,
      image: formPayload.value.image || undefined,
      order: Number(formPayload.value.order) || 0
    });

    isEditModalOpen.value = false;
    toastSuccess(`Category [${formPayload.value.name}] updated successfully.`);
    await fetchAllCategoriesRawList();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on category edit.');
    formError.value = msg;
    toastError(msg);
  } finally {
    isSubmitPending.value = false;
  }
};

// DELETE CATEGORY
const deleteCategoryNode = async (cat: Category) => {
  const confirmMsg = `Verify Decommissoning: Are you sure you want to delete Category [${cat.name}]? Unlinking from nested classes might occur automatically.`;
  if (confirm(confirmMsg)) {
    try {
      await categoryService.deleteCategory(cat.id);
      toastInfo(`Category [${cat.name}] deleted successfully.`);
      await fetchAllCategoriesRawList();
      if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value);
      }
    } catch (err: any) {
      handleApiError(err, 'Deregister action aborted.');
    }
  }
};

// Stats computed aggregates
const mainCategoriesCount = computed(() => allCategoriesList.value.length);
const nestedCategoriesCount = computed(() => Math.max(0, systemTotalCount.value - mainCategoriesCount.value));
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <!-- Header Block -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Category Taxonomy</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium">Organize hardware components, computing nodes and server equipment classes.</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="triggerImportModal"
          class="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
        >
          <Upload class="w-4 h-4" /> Import Taxonomies
        </button>
        <button 
          @click="triggerCreateModal"
          class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" /> Define New Class
        </button>
      </div>
    </div>

    <!-- Active Analytics row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard class="flex items-center gap-6 p-8">
        <div class="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
          <Layers class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">Total Classes</p>
          <p class="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-slate-100">{{ systemTotalCount }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-6 p-8">
        <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
          <FolderOpen class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">Main Categories</p>
          <p class="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-slate-100">{{ mainCategoriesCount }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-6 p-8">
        <div class="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
          <ChevronDown class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">Sub-Categories</p>
          <p class="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-slate-100">{{ nestedCategoriesCount }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Filter row -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div class="flex-1 min-w-[280px]">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Search taxonomies by name, slug or description..." 
          class="border-none bg-transparent"
        />
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Parent grouping filter dropdown -->
        <div class="flex items-center gap-2 pr-2 border-l border-slate-100 dark:border-slate-900 pl-4">
          <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Structural Level:</span>
          <select 
            v-model="parentFilter"
            class="h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="none">Main Categories Only</option>
            <option v-for="parentCat in allCategoriesList.filter(c => !c.parentCategoryId)" :key="parentCat.id" :value="parentCat.id">
              Sub of {{ parentCat.name }}
            </option>
          </select>
        </div>

         <div class="flex items-center gap-2 pr-2 border-l border-slate-100 dark:border-slate-900 pl-4">
          <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Order By:</span>
          <select 
            v-model="ordering"
            class="h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            <option value="order">Display Priority (Asc)</option>
            <option value="-order">Display Priority (Desc)</option>
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="slug">Slug (A-Z)</option>
            <option value="-slug">Slug (Z-A)</option>
          </select>
        </div>
        
        <button 
          @click="loadCategoriesGrid" 
          class="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors cursor-pointer"
          title="Force Sync Protocols"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Core Page States (Loading, Empty, Content) -->
    <div v-if="categoryService.isLoading.value" class="h-64 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <span class="animate-spin border-4 border-primary/20 border-t-primary rounded-full w-10 h-10"></span>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Querying Taxonomy Database...</p>
    </div>

    <div v-else-if="categoryService.errorMsg.value" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <div class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
        <AlertCircle class="w-6 h-6" />
      </div>
      <div>
        <p class="text-lg font-bold">Taxonomy Engine Down</p>
        <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">{{ categoryService.errorMsg.value }}</p>
      </div>
      <button @click="loadCategoriesGrid" class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs px-4 py-2 rounded-xl font-bold hover:opacity-90">
        Re-authenticate Sync
      </button>
    </div>

    <!-- Active Grid Table View -->
    <div v-else class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">Classification</th>
              <th class="px-6 py-5">System ID (Slug)</th>
              <th class="px-6 py-5">Priority (Order)</th>
              <th class="px-6 py-5">Structural Parent</th>
              <th class="px-6 py-5">Memo Overview</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900/50">
            <tr v-for="cat in categoriesList" :key="cat.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              
              <!-- Category Identifier -->
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <span>{{ cat.icon || '📁' }}</span>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">{{ cat.name }}</h4>
                    <p class="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">{{ cat.id }}</p>
                  </div>
                </div>
              </td>

              <!-- System Identification Code (Slug) -->
              <td class="px-6 py-5">
                <span class="font-mono text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  {{ cat.slug }}
                </span>
              </td>

              <!-- Priority (Order) -->
              <td class="px-6 py-5 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {{ cat.order !== undefined ? cat.order : 0 }}
              </td>

              <!-- Parent classification mapping -->
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <span :class="cn(
                    'w-2 h-2 rounded-full',
                    cat.parentCategoryId ? 'bg-indigo-500' : 'bg-emerald-500'
                  )"></span>
                  <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {{ getParentName(cat.parentCategoryId) }}
                  </span>
                </div>
              </td>

              <!-- Short Memo Description -->
              <td class="px-6 py-5 max-w-[320px]">
                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                  {{ cat.description || 'No formal engineering description defined.' }}
                </p>
              </td>

              <!-- Action button overrides -->
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="triggerViewModal(cat)" 
                    class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Inspect Node Properties"
                  >
                    <Info class="w-4 h-4" />
                  </button>
                  <button 
                    @click="triggerEditModal(cat)" 
                    class="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Modify Class Configurations"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteCategoryNode(cat)" 
                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Deregister Node"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Search fallback display when size is empty -->
            <tr v-if="categoriesList.length === 0">
              <td colspan="5" class="px-8 py-16 text-center h-64">
                <div class="flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Layers class="w-7 h-7 text-slate-300" />
                  </div>
                  <div>
                    <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">Zero Categories Found</p>
                    <p class="text-xs max-w-sm mx-auto mt-1">No classification domains matched search filters [{{ searchQuery || 'None' }}]. Extend the architecture index.</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Classic pagination panel -->
      <div class="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Displaying <span class="text-slate-800 dark:text-slate-200 font-black">{{ Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(totalCount, currentPage * itemsPerPage) }}</span> 
            of <span class="text-slate-800 dark:text-slate-200 font-black">{{ totalCount }}</span> classes.
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

    <!-- MODAL 1: Create New Category Class -->
    <div v-if="isCreateModalOpen" @click.self="isCreateModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <form @submit.prevent="submitCreateCategory" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Administration Node Generator</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Define New Category</h3>
          </div>
          <button type="button" @click="isCreateModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Classification Name</label>
              <input 
                ref="categoryNameInput"
                v-model="formPayload.name" 
                @input="generateCustomSlug"
                type="text" 
                placeholder="e.g. Deep Learning Nodes" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Identity Code label (Slug)</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                placeholder="e.g. deep-learning-nodes" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
              />
              <p class="text-[10px] text-slate-400 ml-1">Unique alphanumeric label for router paths.</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Parent Category</label>
              <select 
                v-model="formPayload.parentCategoryId"
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 cursor-pointer"
              >
                <option value="">None (Top-Level Category Grouping)</option>
                <option v-for="catOption in allCategoriesList.filter(c => !c.parentCategoryId)" :key="catOption.id" :value="catOption.id">
                  Nested under: {{ catOption.name }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Order Priority (Order)</label>
              <input 
                v-model="formPayload.order" 
                type="number" 
                placeholder="e.g. 10" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1">Sort order priority index (lower values sort higher/first).</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Visual Symbol (Icon Emoji)</label>
                <input 
                  v-model="formPayload.icon" 
                  type="text" 
                  placeholder="e.g. 📁, 💻, 🧠" 
                  class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50 text-center"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 font-sans">Image representation URL</label>
                <input 
                  v-model="formPayload.image" 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Operational Description / Memo</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                placeholder="Enterprise utility scope and catalog organization guidelines..." 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="isCreateModalOpen = false" 
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
            {{ isSubmitPending ? 'Compiling Record...' : 'Publish Taxonomy Node' }}
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL 2: Edit Custom Category Details -->
    <div v-if="isEditModalOpen" @click.self="isEditModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <form @submit.prevent="submitUpdateCategory" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500">Authorized Admin Override</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Modify Class Properties</h3>
          </div>
          <button type="button" @click="isEditModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Classification Name</label>
              <input 
                ref="editCategoryNameInput"
                v-model="formPayload.name" 
                type="text" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Identity Code label (Slug)</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
              />
              <p class="text-[10px] text-slate-400 ml-1 font-medium">Caution: Modifying identity paths can override mapped products categorization.</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Parent Category Mapping</label>
              <select 
                v-model="formPayload.parentCategoryId"
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 cursor-pointer"
              >
                <option value="">None (Top-Level Category Grouping)</option>
                <!-- Filter categories that are top level themselves, and prevent selecting self as parent -->
                <option v-for="catOption in allCategoriesList.filter(c => !c.parentCategoryId && c.id !== formPayload.id)" :key="catOption.id" :value="catOption.id">
                  Nested under: {{ catOption.name }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Order Priority (Order)</label>
              <input 
                v-model="formPayload.order" 
                type="number" 
                placeholder="e.g. 10" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1">Sort order priority index (lower values sort higher/first).</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Visual Symbol (Icon Emoji)</label>
                <input 
                  v-model="formPayload.icon" 
                  type="text" 
                  class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50 text-center"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Image Representation URL</label>
                <input 
                  v-model="formPayload.image" 
                  type="text" 
                  class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Operational Description / Memo</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="isEditModalOpen = false" 
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
            {{ isSubmitPending ? 'Applying Overrides...' : 'Apply Taxonomy Correction' }}
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL 3: Detailed Category Properties Read-Only View -->
    <div v-if="isViewModalOpen && selectedCategory" @click.self="isViewModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Taxonomy Inspector Viewer</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Classification Audit Node</h3>
          </div>
          <button @click="isViewModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          <div class="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/85">
            <div class="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0 text-3xl">
              <span>{{ selectedCategory.icon || '📁' }}</span>
            </div>
            <div>
              <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ selectedCategory.name }}</h4>
              <p class="text-xs font-mono text-primary font-bold mt-1 uppercase tracking-wider">{{ selectedCategory.slug }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Parent: {{ getParentName(selectedCategory.parentCategoryId) }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Taxonomy Registry Overview</p>
            <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 italic">
              "{{ selectedCategory.description || 'No database memo recorded for this hardware classification node.' }}"
            </p>

            <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Identifier UUID</span>
                <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{{ selectedCategory.id }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Order Priority</span>
                <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ selectedCategory.order !== undefined ? selectedCategory.order : 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sub-Categories Count</span>
                <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ selectedCategory.subCategories?.length || 0 }} nested nodes</span>
              </div>
              <div class="flex items-center justify-between" v-if="selectedCategory.subCategories?.length">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nested Identifiers</span>
                <span class="text-xs text-slate-600 dark:text-slate-400 font-mono">{{ selectedCategory.subCategories.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            @click="isViewModalOpen = false" 
            class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-6 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: Bulk Category File Import Modal -->
    <div v-if="isImportModalOpen" @click.self="isImportModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Bulk Load & Sync Engine</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Category Bulk Import</h3>
          </div>
          <button type="button" @click="isImportModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitImport">
          <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
            
            <!-- Format Selector -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Structured File Type Protocol</label>
              <select 
                ref="formatSelectElement"
                v-model="importFormat"
                @change="selectedFile = null; importErrors = []; importSuccessCount = null"
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 cursor-pointer"
              >
                <option value="csv">Comma-Separated Values (.csv)</option>
                <option value="json">JavaScript Object Notation (.json)</option>
                <option value="xlsx">Microsoft Excel Spreadsheet (.xlsx)</option>
              </select>
            </div>

            <!-- Drag & Drop Area / Click File Select -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">File Payload Selection</label>
              <div 
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
                :class="cn(
                  'border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer text-center space-y-3 min-h-[160px]',
                  isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                )"
                @click="fileInput?.click()"
              >
                <!-- Hidden original file input -->
                <input 
                  ref="fileInput"
                  type="file" 
                  class="hidden" 
                  :accept="importFormat === 'csv' ? '.csv' : importFormat === 'json' ? '.json' : '.xlsx, .xls'"
                  @change="handleFileChange" 
                />

                <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <Upload class="w-6 h-6" />
                </div>

                <div v-if="!selectedFile" class="space-y-1">
                  <p class="text-sm font-bold text-slate-800 dark:text-slate-250">
                    Drag & drop your file here, or <span class="text-primary hover:underline">browse files</span>
                  </p>
                  <p class="text-[10px] text-slate-400 font-mono">
                    Expected format: <span class="uppercase font-bold text-slate-500">{{ importFormat }}</span>
                  </p>
                </div>
                <div v-else class="space-y-1">
                  <p class="text-sm font-black text-primary font-mono max-w-[320px] truncate mx-auto">
                    {{ selectedFile.name }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-bold">
                    Size: {{ (selectedFile.size / 1024).toFixed(2) }} KB — Click to dispatch another file.
                  </p>
                </div>
              </div>
            </div>

            <!-- Loading overlay state in modal -->
            <div v-if="importIsLoading" class="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3">
              <span class="animate-spin border-3 border-primary/20 border-t-primary rounded-full w-5 h-5"></span>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Running parsing algorithms & database updates...</p>
            </div>

            <!-- Success Count Output -->
            <div v-if="importSuccessCount !== null" class="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/55 rounded-3xl flex items-start gap-4 animate-in fade-in duration-300">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Box class="w-5 h-5" />
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-emerald-900 dark:text-emerald-400 leading-none">Database Injection Succeeded</h4>
                <p class="text-xs text-emerald-700 dark:text-emerald-500 font-medium">
                  We successfully parsed the uploaded node file, registering <strong class="font-extrabold text-slate-950 dark:text-slate-50">{{ importSuccessCount }}</strong> new taxonomy category records.
                </p>
              </div>
            </div>

            <!-- Errors/Warnings breakdown -->
            <div v-if="importErrors.length > 0" class="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/55 rounded-3xl flex flex-col gap-3 animate-in fade-in duration-300">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertCircle class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-rose-950 dark:text-rose-400 leading-none">Operational Import Failures</h4>
                  <p class="text-xs text-rose-600 dark:text-rose-500 font-medium mt-1">
                    The taxonomy engine raised warnings while loading the records. See logs below:
                  </p>
                </div>
              </div>
              
              <ul class="max-h-36 overflow-y-auto divide-y divide-rose-100/40 dark:divide-rose-900/40 bg-white dark:bg-slate-950/40 border border-rose-100 dark:border-rose-900 rounded-xl p-3 space-y-1.5 font-mono text-[10px] text-rose-700 dark:text-rose-400 leading-relaxed font-bold">
                <li v-for="(err, idx) in importErrors" :key="idx" class="pt-1.5 first:pt-0 flex gap-2">
                  <span class="text-rose-400 select-none">[{{ idx + 1 }}]</span>
                  <span>{{ err }}</span>
                </li>
              </ul>
            </div>

          </div>

          <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <button 
              type="button"
              @click="isImportModalOpen = false" 
              class="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <button 
              type="submit" 
              :disabled="importIsLoading || !selectedFile"
              class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span v-if="importIsLoading" class="animate-spin border-2 border-white/35 border-t-white rounded-full w-4 h-4 mr-1"></span>
              {{ importIsLoading ? 'Parsing Bulk Payload...' : 'Submit Bulk Import' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

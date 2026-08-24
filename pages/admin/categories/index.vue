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
  Upload, 
  RefreshCw,
  Menu,
  ListTree,
  Loader2,
  LayoutGrid,
  List,
  FolderTree,
  GripVertical
} from 'lucide-vue-next';
import CategoryTreeAdmin from '@/components/admin/CategoryTreeAdmin.vue';
import { useCategoryService } from '@/composables/useCategoryService';
import { useProductService } from '@/composables/useProductService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import { cn } from '@/utils';
import { refDebounced } from '@vueuse/core';
import type { Category, CategorySummaryResponse, CategoryFilters } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import { toastSuccess, toastError, toastInfo, handleApiError, extractErrorMessage } from '@/composables/useToast';

definePageMeta({
  layout: false
});

const tableColumns: UiTableColumn<Category>[] = [
  { key: 'reorder', label: '', width: '36px', headerClass: 'w-9 px-2 py-3 text-center', cellClass: 'w-9 px-2 py-2.5 text-center' },
  { key: 'select', label: '', width: '48px', headerClass: 'w-12 px-4 py-3 text-center', cellClass: 'w-12 px-4 py-2.5 text-center' },
  { key: 'name', label: 'Classification', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'show_in_menu', label: 'Menu', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
];

const categoryService = useCategoryService();
const productService = useProductService();
const { hasPermission } = useAdminPermissions();

const canMarkCategoryAsMenu = computed(() => hasPermission('category_api.mark_category_as_menu'));
const canRemoveCategoryFromMenu = computed(() => hasPermission('category_api.remove_category_from_menu'));

const canToggleCategoryMenu = (cat: Category): boolean => {
  const isCurrentlyMenu = cat.show_in_menu === true || cat.is_menu === true;
  return isCurrentlyMenu ? canRemoveCategoryFromMenu.value : canMarkCategoryAsMenu.value;
};

const route = useRoute();
const router = useRouter();

// State managers initialized from URL query parameters
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const onlyParentsFilter = ref(route.query.is_parent === 'true');
const onlyMenusFilter = ref(route.query.is_menu === 'true');
const parentFilter = ref(route.query.parent ? String(route.query.parent) : 'all'); // 'all', 'none' (main level only), or specific category ID
const menuFilter = ref(route.query.menu ? String(route.query.menu) : (route.query.is_menu === 'true' ? 'menu_only' : 'all')); // 'all', 'menu_only', or specific menu category ID
const ordering = ref(route.query.ordering ? String(route.query.ordering) : 'order'); // 'order', '-order', 'name', '-name', 'slug', '-slug'
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);
const viewMode = ref<'grid' | 'list' | 'tree'>('list');

// Infinite scroll options for Root / Parent categories filter (GET /api/v1/categories/?is_parent=true)
const parentPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      is_parent: true
    });
  },
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: true
});

// Infinite scroll options for Menu categories filter (GET /api/v1/categories/?is_menu=true)
const menuPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      is_menu: true
    });
  },
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: true
});

// Filter dropdown visibility & popover refs
const isParentDropdownOpen = ref(false);
const isMenuDropdownOpen = ref(false);
const parentDropdownRef = ref<HTMLElement | null>(null);
const menuDropdownRef = ref<HTMLElement | null>(null);

const toggleParentDropdown = () => {
  isParentDropdownOpen.value = !isParentDropdownOpen.value;
  if (isParentDropdownOpen.value) isMenuDropdownOpen.value = false;
};

const toggleMenuDropdown = () => {
  isMenuDropdownOpen.value = !isMenuDropdownOpen.value;
  if (isMenuDropdownOpen.value) isParentDropdownOpen.value = false;
};

const selectParent = (val: string) => {
  parentFilter.value = val;
  isParentDropdownOpen.value = false;
};

const selectMenu = (val: string) => {
  menuFilter.value = val;
  isMenuDropdownOpen.value = false;
};

const activeParentLabel = computed(() => {
  if (parentFilter.value === 'all') return 'All Levels';
  if (parentFilter.value === 'none') return 'Main Categories Only';
  const found = parentPagination.items.value.find(c => String(c.id) === parentFilter.value) 
    || allCategoriesList.value.find(c => String(c.id) === parentFilter.value);
  return found ? `Sub of ${found.name}` : `Parent: ${parentFilter.value}`;
});

const activeMenuLabel = computed(() => {
  if (menuFilter.value === 'all') return 'All Categories';
  if (menuFilter.value === 'menu_only') return 'In Menu Only';
  const found = menuPagination.items.value.find(c => String(c.id) === menuFilter.value);
  return found ? `Menu: ${found.name}` : `Menu: ${menuFilter.value}`;
});

const handleGlobalClick = (e: MouseEvent) => {
  const target = e.target as Node;
  if (parentDropdownRef.value && !parentDropdownRef.value.contains(target)) {
    isParentDropdownOpen.value = false;
  }
  if (menuDropdownRef.value && !menuDropdownRef.value.contains(target)) {
    isMenuDropdownOpen.value = false;
  }
};

// Multi-select or dropdown values for raw root categories
const allCategoriesList = ref<Category[]>([]); // Broad list copy for parent lookup / select dropdowns

// Server-side paginated states
const categoriesList = ref<Category[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Category summary statistics
const categorySummary = ref<CategorySummaryResponse>({
  total_categories: 0,
  root_categories: 0,
  sub_categories: 0,
  menu_categories: 0,
  sub_menu_categories: 0
});

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

// Category Drag and Drop Reordering handlers
const draggedCatId = ref<string | null>(null);
const dragOverCatId = ref<string | null>(null);
const isReordering = ref(false);

const onCatDragStart = (e: DragEvent, cat: Category) => {
  draggedCatId.value = String(cat.id);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(cat.id));
  }
};

const onCatDragOver = (e: DragEvent, cat: Category) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  if (draggedCatId.value && draggedCatId.value !== String(cat.id)) {
    dragOverCatId.value = String(cat.id);
  }
};

const onCatDragLeave = (_e: DragEvent, cat: Category) => {
  if (dragOverCatId.value === String(cat.id)) {
    dragOverCatId.value = null;
  }
};

const onCatDragEnd = (_e: DragEvent) => {
  draggedCatId.value = null;
  dragOverCatId.value = null;
};

const onCatDrop = async (e: DragEvent, targetCat: Category) => {
  e.preventDefault();
  const sourceId = draggedCatId.value;
  draggedCatId.value = null;
  dragOverCatId.value = null;

  if (!sourceId || sourceId === String(targetCat.id) || isReordering.value) return;

  const currentList = [...categoriesList.value];
  const draggedIdx = currentList.findIndex(c => String(c.id) === sourceId);
  const targetIdx = currentList.findIndex(c => String(c.id) === String(targetCat.id));

  if (draggedIdx === -1 || targetIdx === -1) return;

  const draggedCat = currentList[draggedIdx];
  if (!draggedCat) return;

  if (draggedCat.parentCategoryId !== targetCat.parentCategoryId) {
    toastError('Categories can only be reordered within the same parent level.');
    return;
  }

  const [movedItem] = currentList.splice(draggedIdx, 1);
  if (!movedItem) return;
  currentList.splice(targetIdx, 0, movedItem);

  categoriesList.value = currentList;

  const newDisplayOrder = targetIdx + 1;

  isReordering.value = true;
  try {
    await categoryService.reorderCategory(movedItem.slug, newDisplayOrder);
    toastSuccess(`Category [${movedItem.name}] reordered successfully.`);
  } catch (err: any) {
    handleApiError(err, 'Failed to reorder category.');
    await fetchCategoriesPage();
  } finally {
    isReordering.value = false;
  }
};

const getTableRowAttrs = (cat: Category) => ({
  draggable: true,
  ondragstart: (e: DragEvent) => onCatDragStart(e, cat),
  ondragover: (e: DragEvent) => onCatDragOver(e, cat),
  ondragleave: (e: DragEvent) => onCatDragLeave(e, cat),
  ondrop: (e: DragEvent) => onCatDrop(e, cat),
  ondragend: (e: DragEvent) => onCatDragEnd(e),
  class: cn(
    'cursor-grab active:cursor-grabbing',
    draggedCatId.value === String(cat.id) && 'opacity-40 bg-muted/50',
    dragOverCatId.value === String(cat.id) && 'bg-primary/10 border-dashed border-primary'
  )
});

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
  const matched = parentPagination.items.value.find(c => String(c.id) === parentId)
    || allCategoriesList.value.find(c => String(c.id) === parentId);
  return matched ? matched.name : parentId;
};

// Fetch categories with server-side pagination, filters and queries
const fetchCategoriesPage = async () => {
  isLoading.value = true;
  try {
    const filters: CategoryFilters = {
      page: currentPage.value,
      page_size: itemsPerPage.value
    };
    if (searchQuery.value) {
      filters.search = searchQuery.value;
    }
    if (onlyParentsFilter.value) {
      filters.is_parent = true;
    }
    if (onlyMenusFilter.value) {
      filters.is_menu = true;
    }
    if (parentFilter.value !== 'all') {
      filters.parent = parentFilter.value;
    }
    if (menuFilter.value !== 'all') {
      if (menuFilter.value === 'menu_only') {
        filters.is_menu = true;
      } else {
        filters.menu = menuFilter.value;
        filters.is_menu = true;
      }
    }
    if (ordering.value && ordering.value !== 'order') {
      filters.ordering = ordering.value;
    }

    const response = await categoryService.getCategoriesList(filters);
    categoriesList.value = response.results;
    totalCount.value = response.count;
  } catch (error: any) {
    console.warn('Categories retrieval pagination error:', error.message);
  } finally {
    isLoading.value = false;
  }
};

// Fetch global category summary statistics
const fetchCategorySummary = async () => {
  try {
    const summary = await categoryService.getCategorySummary();
    if (summary) {
      categorySummary.value = summary;
    }
  } catch (error: any) {
    console.warn('Category summary indexing latency:', error.message);
  }
};

// Fetch broader category hierarchy list for dropdowns and initialize page data
const fetchAllCategoriesRawList = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchCategorySummary(),
      (async () => {
        const rootRes = await categoryService.getCategoriesList({ is_parent: true, page_size: 10 });
        allCategoriesList.value = rootRes.results;
      })(),
      fetchCategoriesPage()
    ]);
  } catch (error: any) {
    console.warn('Parent categories indexing latency:', error.message);
  } finally {
    isLoading.value = false;
  }
};

// Trigger synchronous reload of page database parameters
const loadCategoriesGrid = async () => {
  await fetchAllCategoriesRawList();
};

// Lifecycles
onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleGlobalClick);
  }
  await fetchAllCategoriesRawList();
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleGlobalClick);
  }
});

// If searching or filtering, reset page index to 1
watch([debouncedSearchQuery, onlyParentsFilter, onlyMenusFilter, parentFilter, menuFilter, ordering, itemsPerPage], () => {
  currentPage.value = 1;
});

// Update URL parameters and fetch active page when parameters change
watch([debouncedSearchQuery, onlyParentsFilter, onlyMenusFilter, parentFilter, menuFilter, ordering, currentPage, itemsPerPage], async () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (onlyParentsFilter.value) {
    query.is_parent = 'true';
  } else {
    delete query.is_parent;
  }

  if (onlyMenusFilter.value) {
    query.is_menu = 'true';
  } else if (menuFilter.value === 'menu_only') {
    query.is_menu = 'true';
  } else {
    delete query.is_menu;
  }

  if (parentFilter.value !== 'all') query.parent = parentFilter.value;
  else delete query.parent;

  if (menuFilter.value !== 'all') {
    if (menuFilter.value === 'menu_only') {
      delete query.menu;
    } else {
      query.menu = menuFilter.value;
    }
  } else {
    delete query.menu;
  }

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

  const newOnlyParents = newQuery.is_parent === 'true';
  if (onlyParentsFilter.value !== newOnlyParents) {
    onlyParentsFilter.value = newOnlyParents;
    needsFetch = true;
  }

  const newOnlyMenus = newQuery.is_menu === 'true';
  if (onlyMenusFilter.value !== newOnlyMenus) {
    onlyMenusFilter.value = newOnlyMenus;
    needsFetch = true;
  }

  const newParent = newQuery.parent ? String(newQuery.parent) : 'all';
  if (parentFilter.value !== newParent) {
    parentFilter.value = newParent;
    needsFetch = true;
  }

  const newMenu = newQuery.menu 
    ? String(newQuery.menu) 
    : (newQuery.is_menu === 'true' && !newOnlyMenus ? 'menu_only' : 'all');
  if (menuFilter.value !== newMenu) {
    menuFilter.value = newMenu;
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

// TOGGLE CATEGORY MENU (Mark as Menu / Remove from Menu)
const togglingMenuSlug = ref<string | null>(null);
const treeRef = ref<any>(null);

const toggleCategoryMenu = async (cat: Category) => {
  if (!cat.slug || togglingMenuSlug.value === cat.slug) return;

  const isCurrentlyMenu = cat.show_in_menu === true || cat.is_menu === true;
  if (isCurrentlyMenu && !canRemoveCategoryFromMenu.value) return;
  if (!isCurrentlyMenu && !canMarkCategoryAsMenu.value) return;

  togglingMenuSlug.value = cat.slug;
  const parentId = cat.parentCategoryId ? String(cat.parentCategoryId) : undefined;
  const isRoot = !parentId;

  try {
    let updatedCategory: Category;
    if (isCurrentlyMenu) {
      updatedCategory = await categoryService.removeFromMenu(cat.slug);
      toastSuccess(`Category [${cat.name}] removed from menu.`);
    } else {
      updatedCategory = await categoryService.markAsMenu(cat.slug);
      toastSuccess(`Category [${cat.name}] marked as menu.`);
    }

    // Update affected row in the current list (for Grid & List views)
    const index = categoriesList.value.findIndex(c => c.id === cat.id || c.slug === cat.slug);
    if (index !== -1 && updatedCategory) {
      categoriesList.value[index] = {
        ...categoriesList.value[index],
        ...updatedCategory,
        show_in_menu: updatedCategory.show_in_menu,
        is_menu: updatedCategory.is_menu
      };
    }

    // Targeted Tree refresh:
    if (isRoot) {
      // Root category mutation: Refresh roots data using existing root-category API
      if (treeRef.value?.refreshRoots) {
        await treeRef.value.refreshRoots();
      }
    } else if (parentId) {
      // Sub-category mutation: Re-fetch ONLY that parent's children using the existing children API
      await categoryService.refreshChildrenForParent(parentId);
    }

    // Refresh category statistics in background
    await fetchCategorySummary();
  } catch (err: any) {
    handleApiError(err, `Failed to ${isCurrentlyMenu ? 'remove category from' : 'mark category as'} menu.`);
  } finally {
    togglingMenuSlug.value = null;
  }
};

// BULK SELECTION & MENU MANAGEMENT
const selectedCategoryIds = ref<string[]>([]);
const isBulkUpdatingMenu = ref(false);

const isAllSelected = computed(() => {
  if (!categoriesList.value.length) return false;
  return categoriesList.value.every(cat => selectedCategoryIds.value.includes(String(cat.id)));
});

const isSomeSelected = computed(() => {
  return selectedCategoryIds.value.length > 0 && !isAllSelected.value;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedCategoryIds.value = [];
  } else {
    const currentIds = categoriesList.value.map(cat => String(cat.id));
    selectedCategoryIds.value = Array.from(new Set([...selectedCategoryIds.value, ...currentIds]));
  }
};

const toggleSelectCategory = (id: string | number) => {
  const key = String(id);
  const index = selectedCategoryIds.value.indexOf(key);
  if (index > -1) {
    selectedCategoryIds.value.splice(index, 1);
  } else {
    selectedCategoryIds.value.push(key);
  }
};

const clearSelection = () => {
  selectedCategoryIds.value = [];
};

const handleBulkMenuUpdate = async (showInMenu: boolean) => {
  if (!selectedCategoryIds.value.length || isBulkUpdatingMenu.value) return;

  const targetIds = [...selectedCategoryIds.value];
  isBulkUpdatingMenu.value = true;

  try {
    const res = await categoryService.bulkUpdateMenu(targetIds, showInMenu);
    
    const count = res?.updated_count ?? targetIds.length;
    toastSuccess(
      showInMenu
        ? `Successfully marked ${count} ${count === 1 ? 'category' : 'categories'} as menu.`
        : `Successfully removed ${count} ${count === 1 ? 'category' : 'categories'} from menu.`
    );

    // Update affected categories in current list state
    const targetSet = new Set(targetIds.map(String));
    categoriesList.value = categoriesList.value.map(cat => {
      if (targetSet.has(String(cat.id)) || (cat.slug && targetSet.has(cat.slug))) {
        return {
          ...cat,
          show_in_menu: showInMenu,
          is_menu: showInMenu
        };
      }
      return cat;
    });

    // Update affected categories in tree child cache
    for (const parentId in categoryService.categoryChildrenCache.value) {
      const cachedList = categoryService.categoryChildrenCache.value[parentId];
      if (Array.isArray(cachedList)) {
        categoryService.categoryChildrenCache.value[parentId] = cachedList.map(child => {
          if (targetSet.has(String(child.id)) || (child.slug && targetSet.has(child.slug))) {
            return {
              ...child,
              show_in_menu: showInMenu,
              is_menu: showInMenu
            };
          }
          return child;
        });
      }
    }

    // Update root categories in Tree view if mounted
    if (treeRef.value?.rootCategories) {
      treeRef.value.rootCategories = treeRef.value.rootCategories.map((cat: Category) => {
        if (targetSet.has(String(cat.id)) || (cat.slug && targetSet.has(cat.slug))) {
          return {
            ...cat,
            show_in_menu: showInMenu,
            is_menu: showInMenu
          };
        }
        return cat;
      });
    }

    // Clear selection
    clearSelection();

    // Refresh category statistics in background
    await fetchCategorySummary();
  } catch (err: any) {
    handleApiError(
      err,
      showInMenu
        ? 'Failed to mark selected categories as menu.'
        : 'Failed to remove selected categories from menu.'
    );
  } finally {
    isBulkUpdatingMenu.value = false;
  }
};

watch(viewMode, () => {
  clearSelection();
});

</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Categories
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="loadCategoriesGrid"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="triggerImportModal"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>Import Taxonomies</span>
        </UiButton>

        <UiButton 
          class="rounded-xl h-9 px-4 gap-1.5 shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold text-xs"
          @click="triggerCreateModal"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Category</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      <!-- Active Analytics row -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <UiCard class="flex items-center gap-3 p-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
          <Layers class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Total Classes</p>
          <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ categorySummary.total_categories }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-3 p-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
          <FolderOpen class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Main Categories</p>
          <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ categorySummary.root_categories }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-3 p-3">
        <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
          <ChevronDown class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Sub-Categories</p>
          <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ categorySummary.sub_categories }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-3 p-3">
        <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
          <Menu class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Menu Categories</p>
          <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ categorySummary.menu_categories ?? 0 }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-3 p-3">
        <div class="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
          <ListTree class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Sub-Menu Categories</p>
          <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ categorySummary.sub_menu_categories ?? 0 }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Filter row -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Search taxonomies by name, slug or description..." 
          class="w-full sm:w-72"
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
          <button
            type="button"
            @click="viewMode = 'tree'"
            :class="[
              'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
              viewMode === 'tree'
                ? 'bg-background text-primary shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            title="Tree View"
            aria-label="Tree view"
          >
            <FolderTree class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
        <!-- Boolean Filters: Only Parents & Only Menus -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="onlyParentsFilter = !onlyParentsFilter"
            :class="[
              'h-9 px-3.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none',
              onlyParentsFilter
                ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-2xs'
                : 'bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted/50'
            ]"
            :aria-pressed="onlyParentsFilter"
            title="Filter to root/parent categories only"
          >
            <span class="w-1.5 h-1.5 rounded-full transition-colors" :class="onlyParentsFilter ? 'bg-primary' : 'bg-muted-foreground/40'"></span>
            <span>Only Parents</span>
          </button>

          <button
            type="button"
            @click="onlyMenusFilter = !onlyMenusFilter"
            :class="[
              'h-9 px-3.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none',
              onlyMenusFilter
                ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-2xs'
                : 'bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted/50'
            ]"
            :aria-pressed="onlyMenusFilter"
            title="Filter to menu categories only"
          >
            <span class="w-1.5 h-1.5 rounded-full transition-colors" :class="onlyMenusFilter ? 'bg-primary' : 'bg-muted-foreground/40'"></span>
            <span>Only Menus</span>
          </button>
        </div>

        <!-- Parent grouping filter dropdown (Structural Level) -->
        <div ref="parentDropdownRef" class="relative">
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground whitespace-nowrap">Level:</span>
            <button 
              type="button"
              @click.stop="toggleParentDropdown"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all flex items-center justify-between gap-1.5 min-w-[135px]"
            >
              <span class="truncate">{{ activeParentLabel }}</span>
              <ChevronDown :class="['w-3.5 h-3.5 shrink-0 transition-transform duration-200', isParentDropdownOpen && 'rotate-180']" />
            </button>
          </div>

          <!-- Parent Options Popover Menu -->
          <div 
            v-if="isParentDropdownOpen"
            @click.stop
            class="absolute right-0 sm:left-4 z-30 mt-2 w-60 bg-card border border-border rounded-xl shadow-lg p-1.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
          >
            <div class="max-h-52 overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
              <button
                type="button"
                @click="selectParent('all')"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between',
                  parentFilter === 'all' ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span>All Levels</span>
                <span v-if="parentFilter === 'all'" class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </button>

              <button
                type="button"
                @click="selectParent('none')"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between',
                  parentFilter === 'none' ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span>Main Categories Only</span>
                <span v-if="parentFilter === 'none'" class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </button>

              <div class="my-1 border-t border-border/60"></div>

              <!-- Root category options from GET /api/v1/categories/?is_parent=true -->
              <button
                v-for="parentCat in parentPagination.items.value"
                :key="parentCat.id"
                type="button"
                @click="selectParent(String(parentCat.id))"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between',
                  parentFilter === String(parentCat.id) ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                ]"
              >
                <span class="truncate">Sub of {{ parentCat.name }}</span>
                <span v-if="parentFilter === String(parentCat.id)" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
              </button>

              <!-- Infinite Scroll Sentinel for Root Filter -->
              <UiInfiniteScroll
                :has-more="parentPagination.hasMore.value"
                :is-loading="parentPagination.isFetchingNextPage.value"
                :error="parentPagination.error.value"
                @load-more="parentPagination.loadNextPage"
                @retry="parentPagination.loadNextPage"
              />
            </div>
          </div>
        </div>

        <!-- Menu Filter Dropdown (Menu Categories) -->
        <div ref="menuDropdownRef" class="relative">
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground whitespace-nowrap">Menu:</span>
            <button 
              type="button"
              @click.stop="toggleMenuDropdown"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all flex items-center justify-between gap-1.5 min-w-[135px]"
            >
              <span class="truncate">{{ activeMenuLabel }}</span>
              <ChevronDown :class="['w-3.5 h-3.5 shrink-0 transition-transform duration-200', isMenuDropdownOpen && 'rotate-180']" />
            </button>
          </div>

          <!-- Menu Options Popover Menu -->
          <div 
            v-if="isMenuDropdownOpen"
            @click.stop
            class="absolute right-0 sm:left-4 z-30 mt-2 w-60 bg-card border border-border rounded-xl shadow-lg p-1.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
          >
            <div class="max-h-52 overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
              <button
                type="button"
                @click="selectMenu('all')"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between',
                  menuFilter === 'all' ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span>All Categories</span>
                <span v-if="menuFilter === 'all'" class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </button>

              <button
                type="button"
                @click="selectMenu('menu_only')"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between',
                  menuFilter === 'menu_only' ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span>In Menu Only</span>
                <span v-if="menuFilter === 'menu_only'" class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </button>

              <div class="my-1 border-t border-border/60"></div>

              <!-- Menu category options from GET /api/v1/categories/?is_menu=true -->
              <button
                v-for="menuCat in menuPagination.items.value"
                :key="menuCat.id"
                type="button"
                @click="selectMenu(String(menuCat.id))"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between',
                  menuFilter === String(menuCat.id) ? 'bg-primary/10 text-primary font-extrabold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                ]"
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="truncate font-semibold">{{ menuCat.name }}</span>
                  <span class="text-[10px] text-muted-foreground font-mono truncate">/{{ menuCat.slug }}</span>
                </div>
                <span v-if="menuFilter === String(menuCat.id)" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
              </button>

              <!-- Infinite Scroll Sentinel for Menu Filter -->
              <UiInfiniteScroll
                :has-more="menuPagination.hasMore.value"
                :is-loading="menuPagination.isFetchingNextPage.value"
                :error="menuPagination.error.value"
                @load-more="menuPagination.loadNextPage"
                @retry="menuPagination.loadNextPage"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 border-l border-border pl-3">
          <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Order:</span>
          <select 
            v-model="ordering"
            class="h-9 px-2.5 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all"
          >
            <option value="order">Priority (Asc)</option>
            <option value="-order">Priority (Desc)</option>
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="slug">Slug (A-Z)</option>
            <option value="-slug">Slug (Z-A)</option>
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
        
        <button 
          @click="loadCategoriesGrid" 
          class="h-9 w-9 flex items-center justify-center bg-background hover:bg-muted border border-input rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
          title="Force Sync Protocols"
          aria-label="Refresh categories"
        >
          <RotateCcw class="w-3.5 h-3.5" />
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

    <!-- Grid View Mode -->
    <div v-else-if="viewMode === 'grid'" class="space-y-6">
      <!-- Bulk Action Bar when items are selected in Grid View -->
      <div 
        v-if="selectedCategoryIds.length > 0" 
        class="bg-card text-card-foreground border border-border rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-2 font-medium text-foreground">
          <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
            {{ selectedCategoryIds.length }}
          </span>
          <span>{{ selectedCategoryIds.length === 1 ? 'category' : 'categories' }} selected</span>
        </div>
        <div class="flex items-center gap-2">
          <UiButton
            size="sm"
            variant="outline"
            class="h-8 px-3 text-xs gap-1.5 font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
            :disabled="isBulkUpdatingMenu"
            @click="handleBulkMenuUpdate(true)"
          >
            <Loader2 v-if="isBulkUpdatingMenu" class="w-3.5 h-3.5 animate-spin" />
            <Menu v-else class="w-3.5 h-3.5" />
            <span>Mark as Menu</span>
          </UiButton>

          <UiButton
            size="sm"
            variant="outline"
            class="h-8 px-3 text-xs gap-1.5 font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
            :disabled="isBulkUpdatingMenu"
            @click="handleBulkMenuUpdate(false)"
          >
            <Loader2 v-if="isBulkUpdatingMenu" class="w-3.5 h-3.5 animate-spin" />
            <Menu v-else class="w-3.5 h-3.5" />
            <span>Remove from Menu</span>
          </UiButton>

          <button
            type="button"
            @click="clearSelection"
            class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Clear Selection"
            aria-label="Clear selection"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="cat in categoriesList" 
          :key="cat.id"
          draggable="true"
          @dragstart="onCatDragStart($event, cat)"
          @dragover.prevent="onCatDragOver($event, cat)"
          @dragleave="onCatDragLeave($event, cat)"
          @drop="onCatDrop($event, cat)"
          @dragend="onCatDragEnd($event)"
          :class="[
            'bg-card text-card-foreground border rounded-2xl p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-grab active:cursor-grabbing',
            draggedCatId === String(cat.id) ? 'opacity-40 scale-[0.98]' : '',
            dragOverCatId === String(cat.id) ? 'border-primary/60 border-dashed bg-primary/5' : 'border-border'
          ]"
        >
          <div class="space-y-4">
            <!-- Icon & Menu Status & Checkbox -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <GripVertical class="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing shrink-0" />
                <input
                  type="checkbox"
                  :checked="selectedCategoryIds.includes(String(cat.id))"
                  @change="toggleSelectCategory(cat.id)"
                  class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary shrink-0"
                  :aria-label="`Select ${cat.name}`"
                />
                <div class="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  <span>{{ cat.icon || '📁' }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border/60">
                <span :class="cn(
                  'w-2 h-2 rounded-full ring-4',
                  cat.show_in_menu === true 
                    ? 'bg-emerald-500 ring-emerald-500/10' 
                    : 'bg-muted-foreground/30 ring-muted-foreground/10'
                )"></span>
                <span class="text-[10px] uppercase font-bold tracking-widest" :class="cat.show_in_menu === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
                  {{ cat.show_in_menu === true ? 'In Menu' : 'Hidden' }}
                </span>
              </div>
            </div>

            <!-- Name and Slug -->
            <div>
              <h3 class="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                {{ cat.name }}
              </h3>
              <div class="mt-1 flex items-center gap-2 flex-wrap">
                <span class="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60 uppercase tracking-wider font-semibold">
                  /{{ cat.slug }}
                </span>
                <span v-if="cat.parentCategoryId" class="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  <span class="w-1 h-1 rounded-full bg-muted-foreground/60"></span>
                  {{ getParentName(cat.parentCategoryId) }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {{ cat.description || 'No database memo recorded for this classification node.' }}
            </p>

            <!-- Order & Hierarchy Metadata -->
            <div class="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <span class="text-[11px] font-bold text-foreground font-mono">
                  Order: #{{ cat.order !== undefined ? cat.order : 0 }}
                </span>
              </div>
              <span v-if="cat.subCategories?.length" class="text-[11px] font-semibold text-muted-foreground">
                {{ cat.subCategories.length }} sub-nodes
              </span>
              <span v-else class="text-[11px] text-muted-foreground">
                {{ cat.parentCategoryId ? 'Sub-category' : 'Main category' }}
              </span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
            <span class="text-[10px] font-mono font-semibold text-muted-foreground truncate max-w-[120px]">
              {{ cat.id }}
            </span>

            <div class="flex items-center gap-1">
              <button 
                v-if="canToggleCategoryMenu(cat)"
                type="button"
                @click="toggleCategoryMenu(cat)" 
                :disabled="togglingMenuSlug === cat.slug"
                :class="[
                  'p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                  cat.show_in_menu === true
                    ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                ]"
                :title="cat.show_in_menu === true ? 'Remove from Menu' : 'Mark as Menu'"
                :aria-label="cat.show_in_menu === true ? 'Remove from Menu' : 'Mark as Menu'"
              >
                <Loader2 v-if="togglingMenuSlug === cat.slug" class="w-4 h-4 animate-spin text-primary" />
                <Menu v-else class="w-4 h-4" />
              </button>
              <button 
                @click="triggerViewModal(cat)" 
                class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Inspect Node Properties"
                aria-label="Inspect category properties"
              >
                <Info class="w-4 h-4" />
              </button>
              <button 
                @click="triggerEditModal(cat)" 
                class="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Modify Class Configurations"
                aria-label="Modify category configurations"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                @click="deleteCategoryNode(cat)" 
                class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Deregister Node"
                aria-label="Delete category node"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state in grid mode -->
        <div v-if="categoriesList.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-card border border-border rounded-2xl">
          <div class="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div class="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Layers class="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p class="font-display font-medium text-lg text-foreground">Zero Categories Found</p>
              <p class="text-xs max-w-sm mx-auto mt-1">No classification domains matched search filters [{{ searchQuery || 'None' }}]. Extend the architecture index.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination for Grid Mode -->
      <div v-if="categoriesList.length > 0" class="pt-2 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :items-per-page="itemsPerPage"
          item-label="classes"
          prefix-label="Displaying"
        />
      </div>
    </div>

    <!-- Tree View Mode -->
    <CategoryTreeAdmin
      v-else-if="viewMode === 'tree'"
      ref="treeRef"
      :toggling-menu-slug="togglingMenuSlug"
      :search-query="searchQuery"
      :selected-category-ids="selectedCategoryIds"
      :is-bulk-updating-menu="isBulkUpdatingMenu"
      @toggle-select="toggleSelectCategory"
      @bulk-menu-update="handleBulkMenuUpdate"
      @clear-selection="clearSelection"
      @toggle-menu="toggleCategoryMenu"
      @view="triggerViewModal"
      @edit="triggerEditModal"
      @delete="deleteCategoryNode"
    />

    <!-- Active List / Table View Mode -->
    <UiTable
      v-else-if="viewMode === 'list'"
      :columns="tableColumns"
      :data="categoriesList"
      :row-attrs="getTableRowAttrs"
      key-field="id"
    >
      <!-- Drag Reorder Handle Cell -->
      <template #cell-reorder="{ item: cat }">
        <div class="flex items-center justify-center text-muted-foreground/30 group-hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing">
          <GripVertical class="w-4 h-4" />
        </div>
      </template>
      <!-- Bulk Action Bar inside Table Header Slot -->
      <template #header>
        <div 
          v-if="selectedCategoryIds.length > 0" 
          class="px-4 py-2.5 bg-primary/5 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-2 font-medium text-foreground">
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
              {{ selectedCategoryIds.length }}
            </span>
            <span>{{ selectedCategoryIds.length === 1 ? 'category' : 'categories' }} selected</span>
          </div>
          <div class="flex items-center gap-2">
            <UiButton
              size="sm"
              variant="outline"
              class="h-8 px-3 text-xs gap-1.5 font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
              :disabled="isBulkUpdatingMenu"
              @click="handleBulkMenuUpdate(true)"
            >
              <Loader2 v-if="isBulkUpdatingMenu" class="w-3.5 h-3.5 animate-spin" />
              <Menu v-else class="w-3.5 h-3.5" />
              <span>Mark as Menu</span>
            </UiButton>

            <UiButton
              size="sm"
              variant="outline"
              class="h-8 px-3 text-xs gap-1.5 font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
              :disabled="isBulkUpdatingMenu"
              @click="handleBulkMenuUpdate(false)"
            >
              <Loader2 v-if="isBulkUpdatingMenu" class="w-3.5 h-3.5 animate-spin" />
              <Menu v-else class="w-3.5 h-3.5" />
              <span>Remove from Menu</span>
            </UiButton>

            <button
              type="button"
              @click="clearSelection"
              class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              title="Clear Selection"
              aria-label="Clear selection"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>

      <!-- Select All Header -->
      <template #header-select>
        <div class="flex items-center justify-center" @click.stop>
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            @change="toggleSelectAll"
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
            aria-label="Select all categories on this page"
          />
        </div>
      </template>

      <!-- Select Row Cell -->
      <template #cell-select="{ item: cat }">
        <div class="flex items-center justify-center" @click.stop>
          <input
            type="checkbox"
            :checked="selectedCategoryIds.includes(String(cat.id))"
            @change="toggleSelectCategory(cat.id)"
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
            :aria-label="`Select ${cat.name}`"
          />
        </div>
      </template>

      <!-- Category Identifier -->
      <template #cell-name="{ item: cat }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center text-sm shadow-2xs shrink-0 group-hover:scale-105 transition-transform duration-200">
            <span>{{ cat.icon || '📁' }}</span>
          </div>
          <div class="min-w-0">
            <h4 class="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">{{ cat.name }}</h4>
            <p class="text-[10px] text-muted-foreground font-mono tracking-wider mt-0.5 truncate">{{ cat.id }}</p>
          </div>
        </div>
      </template>

      <!-- Menu Status -->
      <template #cell-show_in_menu="{ item: cat }">
        <div class="flex items-center gap-1.5">
          <span :class="cn(
            'w-1.5 h-1.5 rounded-full ring-2',
            cat.show_in_menu === true
              ? 'bg-emerald-500 ring-emerald-500/10'
              : 'bg-muted-foreground/30 ring-muted-foreground/10'
          )"></span>
          <span class="text-xs font-semibold" :class="cat.show_in_menu === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
            {{ cat.show_in_menu === true ? 'In Menu' : 'Hidden' }}
          </span>
        </div>
      </template>

      <!-- Action button overrides -->
      <template #cell-actions="{ item: cat }">
        <div class="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button 
            v-if="canToggleCategoryMenu(cat)"
            type="button"
            @click="toggleCategoryMenu(cat)" 
            :disabled="togglingMenuSlug === cat.slug"
            :class="[
              'p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              cat.show_in_menu === true
                ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            ]"
            :title="cat.show_in_menu === true ? 'Remove from Menu' : 'Mark as Menu'"
            :aria-label="cat.show_in_menu === true ? 'Remove from Menu' : 'Mark as Menu'"
          >
            <Loader2 v-if="togglingMenuSlug === cat.slug" class="w-3.5 h-3.5 animate-spin text-primary" />
            <Menu v-else class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="triggerViewModal(cat)" 
            class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all cursor-pointer"
            title="Inspect Node Properties"
            aria-label="Inspect category properties"
          >
            <Info class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="triggerEditModal(cat)" 
            class="p-1.5 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-md transition-all cursor-pointer"
            title="Modify Class Configurations"
            aria-label="Modify category configurations"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="deleteCategoryNode(cat)" 
            class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-all cursor-pointer"
            title="Deregister Node"
            aria-label="Delete category node"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>

      <!-- Empty State Override -->
      <template #empty>
        <div class="flex flex-col items-center justify-center gap-4 text-slate-400 py-6">
          <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <Layers class="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">Zero Categories Found</p>
            <p class="text-xs max-w-sm mx-auto mt-1">No classification domains matched search filters [{{ searchQuery || 'None' }}]. Extend the architecture index.</p>
          </div>
        </div>
      </template>

      <!-- Reusable pagination panel in footer slot -->
      <template #footer>
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :items-per-page="itemsPerPage"
          item-label="classes"
          prefix-label="Displaying"
        />
      </template>
    </UiTable>

    <!-- MODAL 1: Create New Category Class -->
    <div v-if="isCreateModalOpen" @click.self="isCreateModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <form @submit.prevent="submitCreateCategory" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Administration Node Generator</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Define New Category</h3>
          </div>
          <button type="button" @click="isCreateModalOpen = false" aria-label="Close modal" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
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
          <button type="button" @click="isEditModalOpen = false" aria-label="Close modal" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
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
          <button @click="isViewModalOpen = false" aria-label="Close modal" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
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
          <button type="button" @click="isImportModalOpen = false" aria-label="Close modal" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
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
  </NuxtLayout>
</template>

<!-- File: /pages/admin/products/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  ExternalLink,
  Layers, 
  Star, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  ShoppingCart,
  ChevronDown,
  Check,
  X,
  Save,
  Package,
  LayoutGrid,
  List
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { formatCurrency, cn, decodeHtmlEntities } from '@/utils';
import type { Product, ProductImage, Category, ProductCategoryRef, CreateProductPayload, UpdateProductPayload, PaginatedResponse } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';
import ProductImageGallery from '@/components/admin/ProductImageGallery.vue';
import ProductDetailsModal from '@/components/admin/ProductDetailsModal.vue';
import ProductFormModal from '@/features/admin/products/components/ProductFormModal.vue';

definePageMeta({
  layout: false
});

const tableColumns: UiTableColumn<Product>[] = [
  { key: 'name', label: 'Product Details', wrap: true, width: '320px', headerClass: 'px-6 py-4 min-w-[260px] max-w-[400px]', cellClass: 'px-6 py-4 min-w-[260px] max-w-[400px]' },
  { key: 'sku', label: 'SKU', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'category', label: 'Category', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'price', label: 'Price', align: 'right', headerClass: 'px-6 py-4 text-right whitespace-nowrap', cellClass: 'px-6 py-4 text-right whitespace-nowrap' },
  { key: 'stock', label: 'Inventory', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'status', label: 'Status', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-6 py-4 text-right whitespace-nowrap', cellClass: 'px-6 py-4 text-right whitespace-nowrap' }
];

const productService = useProductService();
const categoryService = useCategoryService();
const { canCreateInModule, canEditInModule, canDeleteInModule, canViewModule, hasPermission } = useAdminPermissions();

const route = useRoute();
const router = useRouter();

const canViewProduct = computed(() => hasPermission('product_api.view_product') || canViewModule('/admin/products'));
const canCreateProduct = computed(() => hasPermission('product_api.add_product') || canCreateInModule('/admin/products'));
const canEditProduct = computed(() => hasPermission('product_api.change_product') || canEditInModule('/admin/products'));
const canDeleteProduct = computed(() => hasPermission('product_api.delete_product') || canDeleteInModule('/admin/products'));
const canAddProductImage = computed(() => hasPermission('product_api.add_productimage'));
const canDeleteProductImage = computed(() => hasPermission('product_api.add_productimage'));

// State managers initialized from URL query parameters
const viewMode = ref<'grid' | 'list'>((route.query.view === 'grid' ? 'grid' : 'list'));
const productsList = ref<Product[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref<string | null>(null);

// Parse initial category IDs from URL query (?categories=1,5,8 or ?category=1)
const parseCategoryIdsFromQuery = (queryVal: any): string[] => {
  if (!queryVal) return [];
  if (Array.isArray(queryVal)) {
    return queryVal
      .map(String)
      .flatMap(v => v.split(','))
      .map(s => s.trim())
      .filter(s => s && /^\d+$/.test(s));
  }
  return String(queryVal)
    .split(',')
    .map(s => s.trim())
    .filter(s => s && /^\d+$/.test(s));
};

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const selectedCategoryIds = ref<string[]>(parseCategoryIdsFromQuery(route.query.categories || route.query.category));

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Grid Mode Infinite Pagination State
const {
  items: gridProducts,
  totalCount: gridTotalCount,
  isLoading: isGridLoading,
  isFetchingNextPage: isGridFetchingNext,
  hasMore: gridHasMore,
  error: gridError,
  fetchFirstPage: fetchGridFirstPage,
  loadNextPage: loadGridNextPage,
  refresh: refreshGridPagination,
  reset: resetGridPagination
} = useInfinitePagination<Product>({
  fetcher: async (params): Promise<PaginatedResponse<Product>> => {
    if (viewMode.value !== 'grid') {
      return { results: [], count: 0, page: 1, pages: 1, next: null, previous: null };
    }
    const categoriesParam = selectedCategoryIds.value.length > 0 
      ? selectedCategoryIds.value.join(',') 
      : undefined;

    return await productService.getProductsList({
      page: params.page,
      page_size: 12,
      search: (params.search !== undefined ? params.search : debouncedSearchQuery.value).trim() || undefined,
      categories: categoriesParam
    });
  },
  search: searchQuery,
  extraParams: computed(() => ({
    categories: selectedCategoryIds.value.join(',')
  })),
  pageSize: 12,
  dedupeKey: (p) => String(p.id),
  autoFetch: false
});

// URL-driven modal state infrastructure
const modalState = useAdminModalState<Product>({
  getItems: async (id) => {
    return await productService.getProductDetails(String(id));
  },
  onResolveError: (id) => {
    toastError(`Product #${id} could not be resolved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedProduct = computed(() => modalState.activeEntity.value);

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

const getProductDetailCategories = computed<ProductCategoryRef[]>(() => {
  const p = selectedProduct.value;
  if (!p || !p.categories) return [];
  if (Array.isArray(p.categories)) {
    return p.categories.map((c: any) => {
      if (typeof c === 'object' && c !== null) {
        return {
          id: c.id ?? '',
          name: c.name ?? 'Unnamed Category',
          slug: c.slug ?? ''
        };
      }
      const cat = categoryPagination.items.value.find((ac: any) => String(ac.id) === String(c));
      return {
        id: c,
        name: cat?.name ?? `Category #${c}`,
        slug: cat?.slug ?? ''
      };
    });
  }
  return [];
});

const parsedSpecifications = computed<Array<{ key: string; value: any }>>(() => {
  const specs = selectedProduct.value?.specifications;
  if (!specs) return [];
  if (typeof specs === 'string') {
    try {
      const parsed = JSON.parse(specs);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));
      }
    } catch {
      return [{ key: 'Specifications', value: specs }];
    }
  } else if (typeof specs === 'object' && !Array.isArray(specs)) {
    return Object.entries(specs).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
  }
  return [];
});

// Watch permission enforcement for URL modal triggers
watch(
  [() => modalState.activeMode.value, canViewProduct, canDeleteProduct, canCreateProduct, canEditProduct],
  ([mode, viewAllowed, deleteAllowed, createAllowed, editAllowed]) => {
    if (mode === 'view' && !viewAllowed) {
      toastError('You do not have permission to view product details.');
      modalState.closeModal({ replace: true });
    } else if (mode === 'delete' && !deleteAllowed) {
      toastError('You do not have permission to delete products.');
      modalState.closeModal({ replace: true });
    } else if (mode === 'create' && !createAllowed) {
      toastError('You do not have permission to create products.');
      modalState.closeModal({ replace: true });
    } else if (mode === 'edit' && !editAllowed) {
      toastError('You do not have permission to edit products.');
      modalState.closeModal({ replace: true });
    }
  }
);

// Category search and infinite-scrolling picker options for List filter
const categorySearchQuery = ref('');
const isCategoryDropdownOpen = ref(false);
const categoryDropdownRef = ref<HTMLElement | null>(null);
const categoryDropdownTriggerRef = ref<HTMLButtonElement | null>(null);
const categorySearchInputRef = ref<HTMLInputElement | null>(null);

const categoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: categorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

const toggleCategoryDropdown = async () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value) {
    if (categoryPagination.items.value.length === 0) {
      categoryPagination.refresh();
    }
    await nextTick();
    categorySearchInputRef.value?.focus();
  } else {
    categoryDropdownTriggerRef.value?.focus();
  }
};

const closeCategoryDropdown = (restoreFocus = false) => {
  if (isCategoryDropdownOpen.value) {
    isCategoryDropdownOpen.value = false;
    if (restoreFocus) {
      nextTick(() => {
        categoryDropdownTriggerRef.value?.focus();
      });
    }
  }
};

const toggleCategorySelection = (categoryId: string | number) => {
  const idStr = String(categoryId);
  const index = selectedCategoryIds.value.indexOf(idStr);
  if (index > -1) {
    selectedCategoryIds.value.splice(index, 1);
  } else {
    selectedCategoryIds.value.push(idStr);
  }
};

const isCategorySelected = (categoryId: string | number) => {
  return selectedCategoryIds.value.includes(String(categoryId));
};

const clearCategorySelection = () => {
  selectedCategoryIds.value = [];
};

const clearAllFilters = () => {
  searchQuery.value = '';
  selectedCategoryIds.value = [];
};

const activeCategoriesButtonLabel = computed(() => {
  if (selectedCategoryIds.value.length === 0) {
    return 'All Categories';
  }
  if (selectedCategoryIds.value.length === 1) {
    const singleId = selectedCategoryIds.value[0];
    const found = categoryPagination.items.value.find(c => String(c.id) === singleId);
    return found ? found.name : `Category #${singleId}`;
  }
  return `${selectedCategoryIds.value.length} Categories`;
});



// Refresh active view based on current viewMode
const refreshActiveView = async () => {
  if (viewMode.value === 'grid') {
    await refreshGridPagination();
  } else {
    await fetchProductsPage();
  }
};

// Fetch products page from API (GET /api/v1/products/) for List Mode
const fetchProductsPage = async () => {
  isLoading.value = true;
  fetchError.value = null;

  try {
    const categoriesParam = selectedCategoryIds.value.length > 0 
      ? selectedCategoryIds.value.join(',') 
      : undefined;

    const response = await productService.getProductsList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value.trim() || undefined,
      categories: categoriesParam
    });

    productsList.value = response.results || [];
    totalCount.value = response.count || 0;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Unable to retrieve matching catalog products.');
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const categoriesParam = selectedCategoryIds.value.length > 0
    ? selectedCategoryIds.value.join(',')
    : undefined;

  router.replace({
    query: {
      ...route.query,
      view: viewMode.value === 'grid' ? 'grid' : undefined,
      page: (viewMode.value === 'list' && currentPage.value > 1) ? currentPage.value : undefined,
      pageSize: (viewMode.value === 'list' && itemsPerPage.value !== 10) ? itemsPerPage.value : undefined,
      search: debouncedSearchQuery.value.trim() || undefined,
      categories: categoriesParam,
      category: undefined
    }
  });
  if (viewMode.value === 'list') {
    fetchProductsPage();
  }
};

// View mode switcher listener with URL query sync and data reset
watch(viewMode, async (newMode) => {
  const query: Record<string, any> = { ...route.query };
  if (newMode === 'grid') {
    query.view = 'grid';
    delete query.page;
    delete query.pageSize;
  } else {
    delete query.view;
    if (currentPage.value > 1) query.page = currentPage.value;
    if (itemsPerPage.value !== 10) query.pageSize = itemsPerPage.value;
  }
  router.replace({ query });

  if (newMode === 'grid') {
    resetGridPagination();
    await fetchGridFirstPage();
  } else if (newMode === 'list') {
    currentPage.value = 1;
    await fetchProductsPage();
  }
});

// Reset pagination to page 1 whenever filters change in list mode
watch([debouncedSearchQuery, () => selectedCategoryIds.value.join(','), itemsPerPage], () => {
  if (viewMode.value === 'list') {
    if (currentPage.value !== 1) {
      currentPage.value = 1;
    } else {
      updateRouteAndFetch();
    }
  }
});

watch(currentPage, () => {
  if (viewMode.value === 'list') {
    updateRouteAndFetch();
  }
});

// Document click / keyboard listeners for category popover dismiss
const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (isCategoryDropdownOpen.value && categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isCategoryDropdownOpen.value) {
      closeCategoryDropdown(true);
      e.stopPropagation();
    }
  }
};

// Image fallback handler
const imageErrorMap = ref<Record<string, boolean>>({});

const handleImageError = (productId: string) => {
  imageErrorMap.value[productId] = true;
};

const getProductImageUrl = (product: Product): string => {
  if (imageErrorMap.value[product.id]) {
    return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
  }
  if (product.default_image) {
    if (typeof product.default_image === 'object' && product.default_image.image) {
      return product.default_image.image;
    }
    if (typeof product.default_image === 'string') {
      return product.default_image;
    }
  }
  if (product.images && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }
  return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
};

const getProductImageAlt = (product: Product): string => {
  if (product.default_image && typeof product.default_image === 'object' && product.default_image.alt_text) {
    return product.default_image.alt_text;
  }
  return decodeHtmlEntities(product.name) || 'Product Image';
};

// Product Details Modal Gallery State
const isModalImagesLoading = ref(false);
const selectedGalleryImage = ref<ProductImage | null>(null);
const modalImageErrorMap = ref<Record<string, boolean>>({});
const isGallerySubmodalOpen = ref(false);

const handleModalImageError = (imageKey?: string) => {
  if (imageKey) {
    modalImageErrorMap.value[imageKey] = true;
  }
};

// Reset gallery selection and submodal when modals close
watch(
  [() => modalState.isView.value, () => modalState.isEdit.value],
  ([isView, isEdit]) => {
    if (!isView && !isEdit) {
      selectedGalleryImage.value = null;
      modalImageErrorMap.value = {};
      isGallerySubmodalOpen.value = false;
    }
  }
);

// Main displayed image URL and Alt
const modalMainImageUrl = computed<string>(() => {
  if (selectedGalleryImage.value?.image) {
    if (modalImageErrorMap.value[selectedGalleryImage.value.image]) {
      return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
    }
    return selectedGalleryImage.value.image;
  }
  if (selectedProduct.value) {
    return getProductImageUrl(selectedProduct.value);
  }
  return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
});

const modalMainImageAlt = computed<string>(() => {
  if (selectedGalleryImage.value?.alt_text) {
    return selectedGalleryImage.value.alt_text;
  }
  if (selectedProduct.value) {
    return getProductImageAlt(selectedProduct.value);
  }
  return 'Product Image';
});

const getCategoryName = (product: Product): string => {
  if (product.origin && typeof product.origin === 'object' && product.origin.name) {
    return product.origin.name;
  }
  return product.category || 'General';
};

const getProductPrice = (product: Product): number => {
  if (product.current_selling_price !== undefined && product.current_selling_price !== null) {
    return Number(product.current_selling_price);
  }
  return Number(product.price ?? 0);
};

const getProductRating = (product: Product): number => {
  if (product.average_rating !== undefined && product.average_rating !== null) {
    return Number(product.average_rating);
  }
  return Number(product.rating ?? 0);
};

const getProductReviews = (product: Product): number => {
  if (product.total_reviews !== undefined && product.total_reviews !== null) {
    return Number(product.total_reviews);
  }
  return Number(product.reviewCount ?? 0);
};

const getStockStatus = (stock?: number) => {
  const qty = Number(stock ?? 0);
  if (qty <= 0) return { label: 'Out of Stock', class: 'bg-destructive/10 text-destructive border-destructive/20' };
  if (qty < 10) return { label: 'Low Stock', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  return { label: 'In Stock', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
};

const getStorefrontProductUrl = (product: Product): string => {
  const slug = product.slug || String(product.id);
  return `/product/${slug}/`;
};

const executeDeleteProduct = async () => {
  if (!modalState.activeEntity.value) return;
  const targetProduct = modalState.activeEntity.value;

  if (!canDeleteProduct.value) {
    toastError('You do not have permission to delete products.');
    await modalState.closeModal();
    return;
  }

  isDeleting.value = String(targetProduct.id);
  try {
    const targetIdentifier = targetProduct.id ?? targetProduct.slug;
    await productService.deleteProduct(targetIdentifier);
    toastSuccess(`Product "${targetProduct.name}" deleted successfully.`);
    await modalState.closeModal();
    await refreshActiveView();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete product.');
  } finally {
    isDeleting.value = null;
  }
};

onMounted(async () => {
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else {
    await fetchProductsPage();
  }
  if (selectedCategoryIds.value.length > 0) {
    categoryPagination.refresh();
  }
  if (typeof window !== 'undefined') {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Products
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
          v-if="canCreateProduct"
          class="rounded-xl h-9 px-4 gap-1.5 shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Product</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      <!-- Filter Row -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <UiSearchInput
            v-model="searchQuery"
            placeholder="Search products by name, SKU..."
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
          </div>

          <!-- Category Multi-Select Popover -->
          <div ref="categoryDropdownRef" class="relative">
            <button
              ref="categoryDropdownTriggerRef"
              type="button"
              @click.stop="toggleCategoryDropdown"
              :aria-expanded="isCategoryDropdownOpen"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs font-medium cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all flex items-center justify-between gap-2 min-w-[170px]"
              :class="selectedCategoryIds.length > 0 ? 'border-primary/50 text-foreground font-semibold' : 'text-muted-foreground'"
            >
              <div class="flex items-center gap-1.5 truncate">
                <Filter class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span class="truncate">{{ activeCategoriesButtonLabel }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span 
                  v-if="selectedCategoryIds.length > 0" 
                  class="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none"
                >
                  {{ selectedCategoryIds.length }}
                </span>
                <ChevronDown :class="['w-3.5 h-3.5 transition-transform duration-200', isCategoryDropdownOpen && 'rotate-180']" />
              </div>
            </button>

            <!-- Category Options Popover Menu -->
            <div 
              v-if="isCategoryDropdownOpen"
              @click.stop
              @keydown.esc.stop="closeCategoryDropdown(true)"
              class="absolute left-0 z-30 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg p-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
            >
              <!-- Category Search Input inside Popover -->
              <div class="relative mb-2">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref="categorySearchInputRef"
                  v-model="categorySearchQuery"
                  type="text"
                  placeholder="Search categories..."
                  class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <!-- Clear / Select All action -->
              <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
                <span class="text-muted-foreground font-semibold">Filter by Category</span>
                <button
                  v-if="selectedCategoryIds.length > 0"
                  type="button"
                  @click="clearCategorySelection"
                  class="text-primary hover:underline font-bold cursor-pointer"
                >
                  Clear all ({{ selectedCategoryIds.length }})
                </button>
              </div>

              <!-- Categories Infinite List -->
              <div class="max-h-60 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
                <button
                  type="button"
                  @click="clearCategorySelection"
                  :class="[
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer gap-2',
                    selectedCategoryIds.length === 0 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="selectedCategoryIds.length === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="selectedCategoryIds.length === 0" class="w-3 h-3 stroke-[3]" />
                    </div>
                    <span class="truncate">All Categories</span>
                  </div>
                </button>

                <button
                  v-for="cat in categoryPagination.items.value"
                  :key="cat.id"
                  type="button"
                  @click="toggleCategorySelection(cat.id)"
                  :class="[
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer gap-2',
                    isCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="isCategorySelected(cat.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="isCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                    </div>
                    <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                  </div>
                  <span v-if="cat.slug" class="text-[10px] text-muted-foreground font-mono shrink-0 ml-1">
                    /{{ cat.slug }}
                  </span>
                </button>

                <!-- Loading spinner when initial loading -->
                <div v-if="categoryPagination.isLoading.value && categoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                  <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Loading categories...</span>
                </div>

                <!-- Infinite Scroll Sentinel for Next Category Pages -->
                <UiInfiniteScroll
                  :has-more="categoryPagination.hasMore.value"
                  :is-loading="categoryPagination.isFetchingNextPage.value"
                  :error="categoryPagination.error.value"
                  @load-more="categoryPagination.loadNextPage"
                  @retry="categoryPagination.loadNextPage"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center">
          <!-- Clear Filters button when any filter active -->
          <button
            v-if="searchQuery || selectedCategoryIds.length > 0"
            type="button"
            @click="clearAllFilters"
            class="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear all filters"
          >
            <X class="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

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

      <!-- Error State Banner -->
      <div v-if="(viewMode === 'list' && fetchError) || (viewMode === 'grid' && gridError && gridProducts.length === 0)" class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4 text-xs font-medium text-destructive">
        <div class="flex items-center gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ viewMode === 'list' ? fetchError : gridError }}</span>
        </div>
        <button 
          type="button"
          @click="refreshActiveView"
          class="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          Retry
        </button>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="space-y-6">
        <!-- Initial loading state for Grid View -->
        <div v-if="isGridLoading && gridProducts.length === 0" class="h-64 flex flex-col items-center justify-center gap-3 bg-card border border-border rounded-2xl">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Products...</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="product in gridProducts"
            :key="product.id"
            class="bg-card text-card-foreground border border-border rounded-2xl p-4 sm:p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
          >
            <div class="space-y-3.5">
              <!-- Top row: Image & Status Badges -->
              <div class="flex items-start justify-between gap-3">
                <div class="w-14 h-14 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center relative">
                  <img 
                    :src="getProductImageUrl(product)" 
                    :alt="getProductImageAlt(product)"
                    @error="handleImageError(product.id)"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                </div>

                <div class="flex flex-col items-end gap-1.5">
                  <span :class="cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block',
                    getStockStatus(product.stock).class
                  )">
                    {{ getStockStatus(product.stock).label }}
                  </span>
                  <div v-if="product.in_cart" class="flex items-center gap-1">
                    <span class="p-1 rounded-md bg-primary/10 text-primary" title="In Cart">
                      <ShoppingCart class="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              <!-- Brand & Category -->
              <div class="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span class="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                  {{ decodeHtmlEntities(product.brand) }}
                </span>
                <span class="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[140px]">
                  <Layers class="w-3 h-3 shrink-0" />
                  <span class="truncate">{{ decodeHtmlEntities(getCategoryName(product)) }}</span>
                </span>
              </div>

              <!-- Name -->
              <h3 class="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                {{ decodeHtmlEntities(product.name) }}
              </h3>

              <!-- SKU & Rating -->
              <div class="flex items-center justify-between gap-2 text-xs pt-0.5">
                <span class="font-mono text-[11px] text-muted-foreground">
                  {{ product.sku }}
                </span>
                <div v-if="getProductRating(product) > 0" class="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star class="w-3 h-3 fill-amber-500" />
                  <span>{{ getProductRating(product).toFixed(1) }}</span>
                  <span class="text-muted-foreground font-normal text-[10px]">({{ getProductReviews(product) }})</span>
                </div>
              </div>

              <!-- Price & Inventory Indicator -->
              <div class="pt-3 border-t border-border/60 flex items-end justify-between gap-2">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Price</span>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-base font-extrabold text-foreground tracking-tight">
                      {{ formatCurrency(getProductPrice(product)) }}
                    </span>
                    <span v-if="product.originalPrice && product.originalPrice > getProductPrice(product)" class="text-[10px] text-rose-500 line-through font-bold">
                      {{ formatCurrency(product.originalPrice) }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[11px] font-semibold text-muted-foreground block">{{ product.stock ?? 0 }} units</span>
                  <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1 ml-auto">
                    <div 
                      :class="cn(
                        'h-full rounded-full transition-all duration-300', 
                        (product.stock ?? 0) <= 0 ? 'bg-destructive' : (product.stock ?? 0) < 10 ? 'bg-amber-500' : 'bg-emerald-500'
                      )"
                      :style="{ width: `${Math.min(product.stock ?? 0, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Actions Footer -->
            <div class="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <span class="text-[10px] font-mono font-semibold text-muted-foreground">
                ID: #{{ product.id }}
              </span>
              <div class="flex items-center gap-1">
                <NuxtLink
                  :to="getStorefrontProductUrl(product)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                  title="View on Storefront"
                  aria-label="View on Storefront"
                >
                  <ExternalLink class="w-4 h-4" />
                </NuxtLink>
                <button
                  v-if="canViewProduct"
                  type="button"
                  @click="modalState.openView(product.id)"
                  class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                  title="View Product Details"
                  aria-label="View product details"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button 
                  v-if="canEditProduct" 
                  type="button"
                  @click="modalState.openEdit(product.id)" 
                  class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Edit Product"
                  aria-label="Edit product"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button 
                  v-if="canDeleteProduct" 
                  type="button"
                  @click="modalState.openDelete(product.id)" 
                  class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Delete Product"
                  aria-label="Delete product"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State in Grid Mode -->
          <div v-if="gridProducts.length === 0" class="col-span-full py-16 text-center bg-card border border-border rounded-2xl">
            <div class="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div class="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
                <Search class="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p class="font-display font-medium text-lg text-foreground">No Products Found</p>
                <p class="text-xs max-w-sm mx-auto mt-1">No items match your query or filter criteria. Try clearing search filters.</p>
              </div>
              <button
                v-if="searchQuery || selectedCategoryIds.length > 0"
                type="button"
                @click="clearAllFilters"
                class="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Infinite Scroll Sentinel for Grid Mode -->
        <UiInfiniteScroll
          :has-more="gridHasMore"
          :is-loading="isGridFetchingNext"
          :error="gridError"
          @load-more="loadGridNextPage"
          @retry="loadGridNextPage"
        />
      </div>

      <!-- Products Table (List View) -->
      <UiTable
        v-else-if="viewMode === 'list'"
        :columns="tableColumns"
        :data="productsList"
        :loading="isLoading"
        key-field="id"
        empty-text="No Products Found"
        empty-description="No items match your query or filter criteria. Try clearing search filters."
      >
      <!-- Product Details Column -->
      <template #cell-name="{ item: product }">
        <div class="flex items-start gap-3.5">
          <button 
            v-if="canViewProduct"
            type="button"
            @click="modalState.openView(product.id)"
            class="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center relative mt-0.5 cursor-pointer hover:border-primary/50 transition-colors"
            title="View Product Details"
          >
            <img 
              :src="getProductImageUrl(product)" 
              :alt="getProductImageAlt(product)"
              @error="handleImageError(product.id)"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
          <div v-else class="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center relative mt-0.5">
            <img 
              :src="getProductImageUrl(product)" 
              :alt="getProductImageAlt(product)"
              @error="handleImageError(product.id)"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="flex items-start gap-2">
              <button
                v-if="canViewProduct"
                type="button"
                @click="modalState.openView(product.id)"
                class="text-sm font-bold text-foreground hover:text-primary transition-colors leading-snug text-left cursor-pointer"
                title="View Product Details"
              >
                {{ decodeHtmlEntities(product.name) }}
              </button>
              <span v-else class="text-sm font-bold text-foreground leading-snug">
                {{ decodeHtmlEntities(product.name) }}
              </span>
              <span v-if="product.in_cart" class="shrink-0 text-primary mt-0.5" title="In Cart">
                <ShoppingCart class="w-3.5 h-3.5" />
              </span>
            </div>
            <div class="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-0.5">
              <span class="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/80">
                {{ decodeHtmlEntities(product.brand) }}
              </span>
              <span v-if="getProductRating(product) > 0" class="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                <Star class="w-3 h-3 fill-amber-500" />
                <span>{{ getProductRating(product).toFixed(1) }}</span>
                <span class="text-muted-foreground font-normal text-[10px]">({{ getProductReviews(product) }})</span>
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- SKU Column -->
      <template #cell-sku="{ item: product }">
        <span class="font-mono text-xs font-semibold text-muted-foreground">
          {{ product.sku }}
        </span>
      </template>

      <!-- Category Column -->
      <template #cell-category="{ item: product }">
        <div class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Layers class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ decodeHtmlEntities(getCategoryName(product)) }}</span>
        </div>
      </template>

      <!-- Price Column -->
      <template #cell-price="{ item: product }">
        <div class="text-sm font-extrabold tracking-tight text-foreground">
          {{ formatCurrency(getProductPrice(product)) }}
        </div>
        <div v-if="product.originalPrice && product.originalPrice > getProductPrice(product)" class="text-[10px] text-rose-500 line-through font-bold">
          {{ formatCurrency(product.originalPrice) }}
        </div>
      </template>

      <!-- Inventory Column -->
      <template #cell-stock="{ item: product }">
        <div class="flex flex-col gap-1 min-w-[100px]">
          <div class="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>{{ product.stock ?? 0 }} units</span>
          </div>
          <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              :class="cn(
                'h-full rounded-full transition-all duration-300', 
                (product.stock ?? 0) <= 0 ? 'bg-destructive' : (product.stock ?? 0) < 10 ? 'bg-amber-500' : 'bg-emerald-500'
              )"
              :style="{ width: `${Math.min(product.stock ?? 0, 100)}%` }"
            ></div>
          </div>
        </div>
      </template>

      <!-- Status Column -->
      <template #cell-status="{ item: product }">
        <span :class="cn(
          'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block',
          getStockStatus(product.stock).class
        )">
          {{ getStockStatus(product.stock).label }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item: product }">
        <div class="flex items-center justify-end gap-1">
          <NuxtLink
            :to="getStorefrontProductUrl(product)"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
            title="View on Storefront"
            aria-label="View on Storefront"
          >
            <ExternalLink class="w-4 h-4" />
          </NuxtLink>
          <button
            v-if="canViewProduct"
            type="button"
            @click="modalState.openView(product.id)"
            class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
            title="View Product Details"
            aria-label="View product details"
          >
            <Eye class="w-4 h-4" />
          </button>
          <button 
            v-if="canEditProduct" 
            type="button"
            @click="modalState.openEdit(product.id)" 
            class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer" 
            title="Edit product" 
            aria-label="Edit product"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button 
            v-if="canDeleteProduct" 
            type="button"
            @click="modalState.openDelete(product.id)" 
            class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors cursor-pointer" 
            title="Delete product" 
            aria-label="Delete product"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- Pagination -->
      <template #footer>
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :items-per-page="itemsPerPage"
          item-label="products"
        />
      </template>
    </UiTable>

    <!-- Create / Edit Product Modal -->
    <ProductFormModal
      :is-open="modalState.isCreate.value || (modalState.isEdit.value && (!!modalState.activeEntity.value || modalState.isResolving.value))"
      :mode="modalState.isEdit.value ? 'edit' : 'create'"
      :product="selectedProduct"
      :is-resolving="modalState.isResolving.value"
      @close="modalState.closeModal"
      @saved="refreshActiveView"
    />

    <!-- MODAL: View Product Details -->
    <ProductDetailsModal
      :is-open="modalState.isView.value"
      :is-resolving="modalState.isResolving.value"
      :product="selectedProduct"
      :can-edit="canEditProduct"
      @close="modalState.closeModal"
      @edit="(id) => modalState.openEdit(id)"
    />

    <!-- Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="modalState.isDelete.value && (!!modalState.activeEntity.value || modalState.isResolving.value)"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Product Deletion</h3>
          <p v-if="modalState.isResolving.value" class="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            <span>Resolving product details...</span>
          </p>
          <p v-else class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the product <span class="font-bold text-foreground">"{{ modalState.activeEntity.value?.name }}"</span>? This product record will be permanently removed from the catalog.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold"
            @click="modalState.closeModal()"
            :disabled="!!isDeleting || modalState.isResolving.value"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            @click="executeDeleteProduct"
            :disabled="!!isDeleting || modalState.isResolving.value || !modalState.activeEntity.value"
          >
            <Loader2 v-if="!!isDeleting" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>Delete Product</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>


    </div>
  </NuxtLayout>
</template>
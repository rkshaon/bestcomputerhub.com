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
  Heart, 
  ShoppingCart,
  ChevronDown,
  Check,
  X,
  Save,
  Package,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon
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
      const cat = categoryPagination.items.value.find(ac => String(ac.id) === String(c))
        || modalCategoryPagination.items.value.find(ac => String(ac.id) === String(c));
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

const toggleCategoryDropdown = () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value && categoryPagination.items.value.length === 0) {
    categoryPagination.refresh();
  }
};

const closeCategoryDropdown = () => {
  isCategoryDropdownOpen.value = false;
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

// Product Create / Edit Modal State & Form Controls
const modalProductName = ref('');
const modalCurrentSellingPrice = ref<number | ''>('');
const modalSelectedCategoryIds = ref<number[]>([]);
const modalShortDescription = ref('');
const modalDescription = ref('');
const modalSpecifications = ref('');
const isModalSubmitting = ref(false);
const modalFormError = ref<string | null>(null);
const modalFieldErrors = ref<{
  name?: string;
  categories?: string;
  price?: string;
}>({});
const modalProductNameInputRef = ref<HTMLInputElement | null>(null);

// Modal Category Picker State
const isModalCategoryDropdownOpen = ref(false);
const modalCategoryDropdownRef = ref<HTMLElement | null>(null);
const modalCategorySearchQuery = ref('');

const modalCategoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: modalCategorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

const toggleModalCategoryDropdown = () => {
  isModalCategoryDropdownOpen.value = !isModalCategoryDropdownOpen.value;
  if (isModalCategoryDropdownOpen.value && modalCategoryPagination.items.value.length === 0) {
    modalCategoryPagination.refresh();
  }
};

const closeModalCategoryDropdown = () => {
  isModalCategoryDropdownOpen.value = false;
};

const toggleModalCategorySelection = (categoryId: number | string) => {
  const numId = Number(categoryId);
  const index = modalSelectedCategoryIds.value.indexOf(numId);
  if (index > -1) {
    modalSelectedCategoryIds.value.splice(index, 1);
  } else {
    modalSelectedCategoryIds.value.push(numId);
  }
  if (modalFieldErrors.value.categories && modalSelectedCategoryIds.value.length > 0) {
    modalFieldErrors.value.categories = undefined;
  }
};

const removeModalCategorySelection = (categoryId: number) => {
  const index = modalSelectedCategoryIds.value.indexOf(categoryId);
  if (index > -1) {
    modalSelectedCategoryIds.value.splice(index, 1);
  }
};

const isModalCategorySelected = (categoryId: number | string) => {
  return modalSelectedCategoryIds.value.includes(Number(categoryId));
};

const clearModalCategorySelection = () => {
  modalSelectedCategoryIds.value = [];
};

const getModalCategoryNameById = (id: number): string => {
  const found = modalCategoryPagination.items.value.find(c => Number(c.id) === id);
  return found ? found.name : `Category #${id}`;
};


const originalFormValues = ref<{
  name: string;
  categories: number[];
  current_selling_price: string | number;
  short_description: string;
  description: string;
  specifications: string;
} | null>(null);

const cleanHtmlForComparison = (html: string): string => {
  if (!html) return '';
  let cleaned = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const emptyParagraphPattern = /^(<p>\s*(<br\s*\/?>)?\s*<\/p>|<br\s*\/?>|\s*)+$/gi;
  if (emptyParagraphPattern.test(cleaned)) {
    return '';
  }

  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

  return cleaned;
};

const isHtmlEquivalent = (h1: string, h2: string): boolean => {
  return cleanHtmlForComparison(h1) === cleanHtmlForComparison(h2);
};

// Reset / initialize form when Create modal opens
watch(() => modalState.isCreate.value, (isCreateOpen) => {
  if (isCreateOpen) {
    modalProductName.value = '';
    modalCurrentSellingPrice.value = '';
    modalSelectedCategoryIds.value = [];
    modalShortDescription.value = '';
    modalDescription.value = '';
    modalSpecifications.value = '';
    modalFormError.value = null;
    modalFieldErrors.value = {};
    modalCategorySearchQuery.value = '';
    isModalCategoryDropdownOpen.value = false;
    originalFormValues.value = null;
    if (modalCategoryPagination.items.value.length === 0) {
      modalCategoryPagination.refresh();
    }
    nextTick(() => {
      modalProductNameInputRef.value?.focus();
    });
  }
});

// Pre-populate form when Edit modal opens with active entity
watch(
  [() => modalState.isEdit.value, () => modalState.activeEntity.value],
  ([isEditOpen, entity]) => {
    if (isEditOpen && entity) {
      modalProductName.value = entity.name || '';
      modalCurrentSellingPrice.value = entity.current_selling_price !== undefined && entity.current_selling_price !== null
        ? Number(entity.current_selling_price)
        : (entity.price !== undefined ? Number(entity.price) : '');

      modalShortDescription.value = entity.short_description || '';
      modalDescription.value = entity.description || '';

      if (typeof entity.specifications === 'string') {
        modalSpecifications.value = entity.specifications;
      } else if (typeof entity.specifications === 'object' && entity.specifications !== null) {
        const entries = Object.entries(entity.specifications);
        if (entries.length > 0) {
          const rows = entries
            .map(([k, v]) => `<tr><td class="font-bold border border-border p-2">${k}</td><td class="border border-border p-2">${v}</td></tr>`)
            .join('');
          modalSpecifications.value = `<table class="w-full border-collapse border border-border"><thead><tr class="bg-muted/50"><th class="border border-border p-2 text-left font-bold">Attribute</th><th class="border border-border p-2 text-left font-bold">Specification</th></tr></thead><tbody>${rows}</tbody></table>`;
        } else {
          modalSpecifications.value = '';
        }
      } else {
        modalSpecifications.value = '';
      }

      if (Array.isArray(entity.categories) && entity.categories.length > 0) {
        modalSelectedCategoryIds.value = entity.categories
          .map((c: any) => (typeof c === 'object' && c !== null && 'id' in c ? Number(c.id) : Number(c)))
          .filter((id: number) => !isNaN(id));
      } else if (entity.origin && typeof entity.origin === 'object' && entity.origin.id) {
        modalSelectedCategoryIds.value = [Number(entity.origin.id)];
      } else if (typeof (entity as any).category === 'number') {
        modalSelectedCategoryIds.value = [Number((entity as any).category)];
      } else {
        modalSelectedCategoryIds.value = [];
      }

      modalFormError.value = null;
      modalFieldErrors.value = {};
      modalCategorySearchQuery.value = '';
      isModalCategoryDropdownOpen.value = false;
      if (modalCategoryPagination.items.value.length === 0) {
        modalCategoryPagination.refresh();
      }

      // Capture original values of the form for PATCH comparison
      originalFormValues.value = {
        name: modalProductName.value,
        categories: [...modalSelectedCategoryIds.value],
        current_selling_price: modalCurrentSellingPrice.value,
        short_description: modalShortDescription.value,
        description: modalDescription.value,
        specifications: modalSpecifications.value
      };

      nextTick(() => {
        modalProductNameInputRef.value?.focus();
      });
    } else if (!isEditOpen) {
      originalFormValues.value = null;
    }
  },
  { immediate: true }
);

const validateModalForm = (): boolean => {
  modalFieldErrors.value = {};
  modalFormError.value = null;
  let isValid = true;

  if (!modalProductName.value || !modalProductName.value.trim()) {
    modalFieldErrors.value.name = 'Product name is required.';
    isValid = false;
  }

  if (modalSelectedCategoryIds.value.length === 0) {
    modalFieldErrors.value.categories = 'At least one category must be selected.';
    isValid = false;
  }

  if (modalCurrentSellingPrice.value === '' || isNaN(Number(modalCurrentSellingPrice.value)) || Number(modalCurrentSellingPrice.value) < 0) {
    modalFieldErrors.value.price = 'Please enter a valid non-negative selling price.';
    isValid = false;
  }

  return isValid;
};

const handleModalProductSubmit = async () => {
  if (!validateModalForm()) {
    modalFormError.value = 'Please fix the validation errors before submitting.';
    return;
  }

  if (modalState.isCreate.value) {
    if (!canCreateProduct.value) {
      modalFormError.value = 'You do not have permission to create products.';
      return;
    }

    isModalSubmitting.value = true;
    modalFormError.value = null;

    const payload: CreateProductPayload = {
      name: modalProductName.value.trim(),
      categories: modalSelectedCategoryIds.value.map(id => Number(id)),
      current_selling_price: Number(modalCurrentSellingPrice.value)
    };

    try {
      await productService.createProduct(payload);
      toastSuccess(`Product "${payload.name}" created successfully.`);
      await modalState.closeModal();
      await refreshActiveView();
    } catch (err: any) {
      modalFormError.value = extractErrorMessage(err, 'Failed to create product. Please check your inputs and try again.');
      handleApiError(err, 'Failed to create product.');
    } finally {
      isModalSubmitting.value = false;
    }
  } else if (modalState.isEdit.value) {
    if (!canEditProduct.value) {
      modalFormError.value = 'You do not have permission to edit products.';
      return;
    }

    const targetProduct = modalState.activeEntity.value;
    const targetIdentifier = targetProduct?.id ?? targetProduct?.slug ?? modalState.activeId.value;
    if (!targetIdentifier) {
      modalFormError.value = 'Product identifier missing.';
      return;
    }

    isModalSubmitting.value = true;
    modalFormError.value = null;

    const payload: Partial<UpdateProductPayload> = {};

    if (originalFormValues.value) {
      const orig = originalFormValues.value;

      // 1. name
      const currentName = modalProductName.value.trim();
      if (currentName !== orig.name.trim()) {
        payload.name = currentName;
      }

      // 2. categories
      const currentCats = modalSelectedCategoryIds.value.map(id => Number(id)).sort((a, b) => a - b);
      const originalCats = orig.categories.map(id => Number(id)).sort((a, b) => a - b);
      const isCategoriesModified = currentCats.length !== originalCats.length || currentCats.some((val, idx) => val !== originalCats[idx]);
      if (isCategoriesModified) {
        payload.categories = modalSelectedCategoryIds.value.map(id => Number(id));
      }

      // 3. current_selling_price
      const currentPrice = modalCurrentSellingPrice.value;
      const originalPrice = orig.current_selling_price;
      const isPriceModified = (!currentPrice && !originalPrice)
        ? false
        : Number(currentPrice) !== Number(originalPrice);
      if (isPriceModified) {
        payload.current_selling_price = currentPrice === '' ? 0 : Number(currentPrice);
      }

      // 4. short_description
      if (!isHtmlEquivalent(modalShortDescription.value, orig.short_description)) {
        payload.short_description = modalShortDescription.value;
      }

      // 5. description
      if (!isHtmlEquivalent(modalDescription.value, orig.description)) {
        payload.description = modalDescription.value;
      }

      // 6. specifications
      if (!isHtmlEquivalent(modalSpecifications.value, orig.specifications)) {
        payload.specifications = modalSpecifications.value;
      }
    } else {
      // Fallback
      payload.name = modalProductName.value.trim();
      payload.categories = modalSelectedCategoryIds.value.map(id => Number(id));
      payload.current_selling_price = Number(modalCurrentSellingPrice.value);
      payload.short_description = modalShortDescription.value;
      payload.description = modalDescription.value;
      payload.specifications = modalSpecifications.value;
    }

    if (Object.keys(payload).length === 0) {
      // If nothing was modified, do not send a PATCH request; follow the existing form behavior for an unchanged submission.
      toastSuccess(`Product "${modalProductName.value.trim()}" updated successfully.`);
      await modalState.closeModal();
      await refreshActiveView();
      isModalSubmitting.value = false;
      return;
    }

    try {
      await productService.updateProduct(targetIdentifier, payload);
      toastSuccess(`Product "${modalProductName.value.trim()}" updated successfully.`);
      await modalState.closeModal();
      await refreshActiveView();
    } catch (err: any) {
      modalFormError.value = extractErrorMessage(err, 'Failed to update product. Please check your inputs and try again.');
      handleApiError(err, 'Failed to update product.');
    } finally {
      isModalSubmitting.value = false;
    }
  }
};

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
  if (isModalCategoryDropdownOpen.value && modalCategoryDropdownRef.value && !modalCategoryDropdownRef.value.contains(target)) {
    closeModalCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isModalCategoryDropdownOpen.value) {
      closeModalCategoryDropdown();
    } else if (isCategoryDropdownOpen.value) {
      closeCategoryDropdown();
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
  return product.name || 'Product Image';
};

// Product Details Modal Gallery State
const isModalImagesLoading = ref(false);
const modalProductImages = ref<ProductImage[]>([]);
const selectedGalleryImage = ref<ProductImage | null>(null);
const modalImageErrorMap = ref<Record<string, boolean>>({});

const handleModalImageError = (imageKey?: string) => {
  if (imageKey) {
    modalImageErrorMap.value[imageKey] = true;
  }
};

// Demand-driven fetch for product image gallery when modal is opened in view mode
const fetchModalProductImages = async (targetIdOrSlug: string | number) => {
  if (!targetIdOrSlug) return;
  isModalImagesLoading.value = true;
  try {
    const images = await productService.getProductImages(targetIdOrSlug);
    modalProductImages.value = Array.isArray(images) ? images : [];
  } catch {
    // If ID fetch failed and product has a slug, try slug fallback
    if (selectedProduct.value?.slug && String(targetIdOrSlug) !== String(selectedProduct.value.slug)) {
      try {
        const images = await productService.getProductImages(selectedProduct.value.slug);
        modalProductImages.value = Array.isArray(images) ? images : [];
      } catch {
        modalProductImages.value = [];
      }
    } else {
      modalProductImages.value = [];
    }
  } finally {
    isModalImagesLoading.value = false;
  }
};

// Watch view and edit modal visibility and selected product ID
watch(
  [() => modalState.isView.value, () => modalState.isEdit.value, () => selectedProduct.value?.id],
  ([isView, isEdit, productId], [prevIsView, prevIsEdit, prevProductId]) => {
    const isOpen = isView || isEdit;
    const prevIsOpen = prevIsView || prevIsEdit;
    
    if (isOpen && productId) {
      if (!prevIsOpen || productId !== prevProductId) {
        fetchModalProductImages(productId);
      }
    } else if (!isOpen) {
      modalProductImages.value = [];
      selectedGalleryImage.value = null;
      modalImageErrorMap.value = {};
      cancelAddImage();
      cancelDeleteProductImage();
    }
  },
  { immediate: true }
);

// Resolved gallery images: sorted by display_order with fallback to product data
const modalGalleryImages = computed<ProductImage[]>(() => {
  if (modalProductImages.value && modalProductImages.value.length > 0) {
    const valid = modalProductImages.value.filter(img => Boolean(img && img.image));
    return [...valid].sort((a, b) => {
      const orderA = typeof a.display_order === 'number' ? a.display_order : 999999;
      const orderB = typeof b.display_order === 'number' ? b.display_order : 999999;
      return orderA - orderB;
    });
  }

  // Fallback to existing product images if endpoint returns none
  if (selectedProduct.value) {
    if (selectedProduct.value.images && selectedProduct.value.images.length > 0) {
      return selectedProduct.value.images
        .filter(Boolean)
        .map((img, idx) => ({
          id: idx,
          image: typeof img === 'string' ? img : (img as any)?.image || '',
          alt_text: selectedProduct.value?.name || '',
          is_default: idx === 0,
          display_order: idx
        }))
        .filter(img => Boolean(img.image));
    }
    if (selectedProduct.value.default_image) {
      const defImgUrl = typeof selectedProduct.value.default_image === 'string'
        ? selectedProduct.value.default_image
        : selectedProduct.value.default_image.image;
      const defAlt = typeof selectedProduct.value.default_image === 'object'
        ? selectedProduct.value.default_image.alt_text
        : selectedProduct.value?.name;
      if (defImgUrl) {
        return [{
          id: 0,
          image: defImgUrl,
          alt_text: defAlt || selectedProduct.value?.name || '',
          is_default: true,
          display_order: 0
        }];
      }
    }
  }

  return [];
});

// Image Upload State
const isAddingImage = ref(false);
const newImageFile = ref<File | null>(null);
const newImagePreview = ref<string | null>(null);
const newImageAltText = ref('');
const newImageIsDefault = ref(false);
const isUploadingImage = ref(false);
const imageFileInput = ref<HTMLInputElement | null>(null);

const triggerImageUpload = () => {
  imageFileInput.value?.click();
};

const onImageFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      newImageFile.value = file;
      newImagePreview.value = URL.createObjectURL(file);
      newImageAltText.value = '';
      newImageIsDefault.value = modalGalleryImages.value.length === 0;
      isAddingImage.value = true;
      if (imageFileInput.value) {
        imageFileInput.value.value = '';
      }
    }
  }
};

const cancelAddImage = () => {
  isAddingImage.value = false;
  newImageFile.value = null;
  if (newImagePreview.value) {
    URL.revokeObjectURL(newImagePreview.value);
    newImagePreview.value = null;
  }
  newImageAltText.value = '';
  newImageIsDefault.value = false;
};

const confirmAddImage = async () => {
  if (!newImageFile.value || !selectedProduct.value?.id) return;
  
  isUploadingImage.value = true;
  try {
    await productService.createProductImage({
      product: selectedProduct.value.id,
      image: newImageFile.value,
      alt_text: newImageAltText.value,
      display_order: modalGalleryImages.value.length,
      is_default: newImageIsDefault.value
    });
    
    toastSuccess('Product image added to gallery successfully');
    await fetchModalProductImages(selectedProduct.value.id);
    cancelAddImage();
  } catch (error: any) {
    handleApiError(error, 'Failed to upload product image');
  } finally {
    isUploadingImage.value = false;
  }
};

// Image Delete State & Handlers
const imageToDelete = ref<ProductImage | null>(null);
const isDeletingImage = ref(false);

const promptDeleteProductImage = (img: ProductImage) => {
  if (!canDeleteProductImage.value) {
    toastError('You do not have permission to delete product images.');
    return;
  }
  imageToDelete.value = img;
};

const cancelDeleteProductImage = () => {
  if (isDeletingImage.value) return;
  imageToDelete.value = null;
};

const confirmDeleteProductImage = async () => {
  if (!imageToDelete.value?.id) return;

  const targetId = imageToDelete.value.id;
  const productId = selectedProduct.value?.id || modalState.activeId.value;
  isDeletingImage.value = true;

  try {
    await productService.deleteProductImage(targetId);
    toastSuccess('Product image deleted successfully');
    imageToDelete.value = null;

    if (productId) {
      await fetchModalProductImages(productId);
    }
  } catch (error: any) {
    handleApiError(error, 'Failed to delete product image');
  } finally {
    isDeletingImage.value = false;
  }
};

// Synchronize selected gallery image: defaults to is_default image or first image
watch(
  modalGalleryImages,
  (images) => {
    if (images.length > 0) {
      const currentExists = selectedGalleryImage.value
        ? images.some(img => img.image === selectedGalleryImage.value?.image || (img.id !== undefined && img.id === selectedGalleryImage.value?.id))
        : false;
      if (!currentExists || !selectedGalleryImage.value) {
        const defaultImg = images.find(img => img.is_default) || images[0];
        selectedGalleryImage.value = defaultImg || null;
      }
    } else {
      selectedGalleryImage.value = null;
    }
  },
  { immediate: true }
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
              type="button"
              @click.stop="toggleCategoryDropdown"
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
              class="absolute left-0 z-30 mt-1.5 w-72 bg-card border border-border rounded-xl shadow-lg p-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
            >
              <!-- Category Search Input inside Popover -->
              <div class="relative mb-2">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
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
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between',
                    selectedCategoryIds.length === 0 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <span>All Categories</span>
                  <Check v-if="selectedCategoryIds.length === 0" class="w-3.5 h-3.5 text-primary" />
                </button>

                <button
                  v-for="cat in categoryPagination.items.value"
                  :key="cat.id"
                  type="button"
                  @click="toggleCategorySelection(cat.id)"
                  :class="[
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between',
                    isCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                  <div 
                    class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                    :class="isCategorySelected(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                  >
                    <Check v-if="isCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                  </div>
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
                  <div v-if="product.wishlist || product.in_cart" class="flex items-center gap-1">
                    <span v-if="product.wishlist" class="p-1 rounded-md bg-rose-500/10 text-rose-500" title="In Wishlist">
                      <Heart class="w-3 h-3 fill-rose-500" />
                    </span>
                    <span v-if="product.in_cart" class="p-1 rounded-md bg-primary/10 text-primary" title="In Cart">
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
              <span v-if="product.wishlist" class="shrink-0 text-rose-500 mt-0.5" title="In Wishlist">
                <Heart class="w-3.5 h-3.5 fill-rose-500" />
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
    <UiAdminModal
      :is-open="modalState.isCreate.value || (modalState.isEdit.value && (!!modalState.activeEntity.value || modalState.isResolving.value))"
      :title="modalState.isEdit.value ? 'Edit Product' : 'Add Product'"
      :subtitle="modalState.isEdit.value ? 'Update product specifications, category classifications, descriptions, and pricing.' : 'Configure and register a new product in the catalog.'"
      :max-width="modalState.isEdit.value ? 'max-w-3xl' : 'max-w-xl'"
      :close-on-escape="!imageToDelete"
      :close-on-backdrop="!imageToDelete"
      @close="modalState.closeModal"
    >
      <!-- Loading State during Edit entity resolution -->
      <div v-if="modalState.isEdit.value && modalState.isResolving.value" class="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 class="w-7 h-7 animate-spin text-primary" />
        <span class="text-xs font-semibold">Loading product details...</span>
      </div>

      <form v-else @submit.prevent="handleModalProductSubmit" class="flex flex-col">
        <!-- Scrollable Modal Body -->
        <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <!-- Error Banner -->
          <div v-if="modalFormError" class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs font-medium text-destructive">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ modalFormError }}</span>
          </div>

          <!-- Product Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Product Name <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.name" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.name }}</span>
            </label>
            <input
              ref="modalProductNameInputRef"
              v-model="modalProductName"
              type="text"
              placeholder="e.g. GeForce RTX 4090 Gaming OC 24G"
              :class="cn(
                'w-full h-11 px-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2',
                modalFieldErrors.name ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
              )"
              :disabled="isModalSubmitting"
            />
          </div>

          <!-- Categories Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Categories <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.categories" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.categories }}</span>
            </label>

            <!-- Selected Category Pills / Chips -->
            <div v-if="modalSelectedCategoryIds.length > 0" class="flex flex-wrap gap-1.5 mb-2">
              <span 
                v-for="catId in modalSelectedCategoryIds" 
                :key="catId"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
              >
                <Layers class="w-3 h-3" />
                <span>{{ getModalCategoryNameById(catId) }}</span>
                <button
                  type="button"
                  @click="removeModalCategorySelection(catId)"
                  class="text-primary/70 hover:text-primary hover:bg-primary/20 rounded p-0.5 transition-colors cursor-pointer"
                  title="Remove category"
                  aria-label="Remove category"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
            </div>

            <!-- Modal Category Dropdown Trigger -->
            <div ref="modalCategoryDropdownRef" class="relative">
              <button
                type="button"
                @click.stop="toggleModalCategoryDropdown"
                :class="cn(
                  'w-full h-11 px-3.5 bg-background border rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer focus:ring-2',
                  modalFieldErrors.categories ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20',
                  modalSelectedCategoryIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                )"
                :disabled="isModalSubmitting"
                aria-haspopup="listbox"
                :aria-expanded="isModalCategoryDropdownOpen"
              >
                <div class="flex items-center gap-2 truncate">
                  <Layers class="w-4 h-4 text-muted-foreground shrink-0" />
                  <span class="truncate">
                    {{ modalSelectedCategoryIds.length === 0 ? 'Select one or more categories...' : `${modalSelectedCategoryIds.length} categories selected` }}
                  </span>
                </div>
                <ChevronDown :class="cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isModalCategoryDropdownOpen && 'rotate-180')" />
              </button>

              <!-- Category Dropdown Popover -->
              <div 
                v-if="isModalCategoryDropdownOpen"
                @click.stop
                class="absolute left-0 top-full z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl p-2.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
              >
                <!-- Category Search Input -->
                <div class="relative mb-2">
                  <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    v-model="modalCategorySearchQuery"
                    type="text"
                    placeholder="Search categories..."
                    class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <!-- Header & Clear Option -->
                <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
                  <span class="text-muted-foreground font-semibold">Available Categories</span>
                  <button
                    v-if="modalSelectedCategoryIds.length > 0"
                    type="button"
                    @click="clearModalCategorySelection"
                    class="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Clear selection ({{ modalSelectedCategoryIds.length }})
                  </button>
                </div>

                <!-- Infinite Scroll List of Categories -->
                <div class="max-h-52 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
                  <button
                    v-for="cat in modalCategoryPagination.items.value"
                    :key="cat.id"
                    type="button"
                    @click="toggleModalCategorySelection(cat.id)"
                    :class="[
                      'w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                      isModalCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    ]"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <span class="truncate">{{ cat.name }}</span>
                      <span v-if="cat.slug" class="font-mono text-[10px] text-muted-foreground">/{{ cat.slug }}</span>
                    </div>
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="isModalCategorySelected(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="isModalCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  <!-- Loading State -->
                  <div v-if="modalCategoryPagination.isLoading.value && modalCategoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                    <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Loading categories...</span>
                  </div>

                  <!-- Empty Category State -->
                  <div v-if="!modalCategoryPagination.isLoading.value && modalCategoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground text-xs">
                    No matching categories found.
                  </div>

                  <!-- Infinite Scroll Sentinel -->
                  <UiInfiniteScroll
                    :has-more="modalCategoryPagination.hasMore.value"
                    :is-loading="modalCategoryPagination.isFetchingNextPage.value"
                    :error="modalCategoryPagination.error.value"
                    @load-more="modalCategoryPagination.loadNextPage"
                    @retry="modalCategoryPagination.loadNextPage"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Current Selling Price -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Current Selling Price <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.price" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.price }}</span>
            </label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pointer-events-none">
                Tk
              </div>
              <input
                v-model.number="modalCurrentSellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :class="cn(
                  'w-full h-11 pl-9 pr-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 font-mono',
                  modalFieldErrors.price ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
                )"
                :disabled="isModalSubmitting"
              />
            </div>
            <p class="text-[11px] text-muted-foreground">Standard retail unit price for transactions in BDT (Tk).</p>
          </div>

          <!-- Rich-Text HTML Fields in Edit Mode -->
          <template v-if="modalState.isEdit.value">
            <!-- Short Description -->
            <div class="space-y-1.5 pt-2 border-t border-border/60">
              <UiRichTextEditor
                v-model="modalShortDescription"
                label="Short Description"
                placeholder="Enter brief product highlights / summary..."
                min-height="min-h-[100px]"
                :disabled="isModalSubmitting"
                helper-text="Concise summary displayed on product cards and catalog overviews."
              />
            </div>

            <!-- Full Description -->
            <div class="space-y-1.5 pt-2 border-t border-border/60">
              <UiRichTextEditor
                v-model="modalDescription"
                label="Description"
                placeholder="Enter comprehensive product description, features, and marketing content..."
                min-height="min-h-[160px]"
                :disabled="isModalSubmitting"
                helper-text="Full product details with headings, bullet points, formatting, and paragraphs."
              />
            </div>

            <!-- Technical Specifications -->
            <div class="space-y-1.5 pt-2 border-t border-border/60">
              <UiRichTextEditor
                v-model="modalSpecifications"
                label="Specifications"
                placeholder="Enter technical specifications (insert table using toolbar)..."
                min-height="min-h-[180px]"
                :disabled="isModalSubmitting"
                :allow-tables="true"
                helper-text="HTML specification table containing structured technical hardware parameters."
              />
            </div>

            <!-- Dedicated Product Image Gallery Section -->
            <div class="space-y-3 pt-6 border-t border-border/60 mt-4">
              <div class="flex items-center justify-between border-b border-border pb-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
                    {{ modalGalleryImages.length }} {{ modalGalleryImages.length === 1 ? 'image' : 'images' }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <div v-if="isModalImagesLoading" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                    <span class="text-[11px] font-medium hidden xs:inline">Fetching...</span>
                  </div>
                  <button 
                    v-if="canAddProductImage"
                    type="button" 
                    @click="isAddingImage = !isAddingImage" 
                    :class="cn('text-xs font-semibold px-2 py-1 rounded-md transition-colors flex items-center gap-1.5', isAddingImage ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20')"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    <span>{{ isAddingImage ? 'Cancel Upload' : 'Add Image' }}</span>
                  </button>
                </div>
              </div>

              <!-- Upload Form (Inline) -->
              <div v-if="isAddingImage" class="p-4 border border-primary/20 bg-primary/5 rounded-xl space-y-4 mb-4">
                <input 
                  type="file" 
                  ref="imageFileInput" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  class="hidden" 
                  @change="onImageFileChange" 
                />
                
                <div v-if="!newImageFile" class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl bg-background/50 cursor-pointer hover:bg-primary/5 transition-colors" @click="triggerImageUpload">
                  <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                    <Upload class="w-5 h-5" />
                  </div>
                  <p class="text-sm font-semibold text-primary">Click to select an image</p>
                  <p class="text-[11px] text-muted-foreground mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>

                <div v-else class="flex gap-4">
                  <div class="w-24 h-24 sm:w-32 sm:h-32 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden relative">
                    <img :src="newImagePreview!" alt="Preview" class="w-full h-full object-contain" />
                    <button type="button" @click.stop="cancelAddImage" class="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground backdrop-blur-xs p-1 rounded-md shadow-xs transition-colors">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div class="flex-1 space-y-3 min-w-0">
                    <div class="space-y-1">
                      <label class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Alt Text (Optional)</label>
                      <input 
                        v-model="newImageAltText" 
                        type="text" 
                        class="w-full h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20" 
                        placeholder="Describe the image for accessibility and SEO..."
                        :disabled="isUploadingImage"
                      />
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="new-image-default" 
                        v-model="newImageIsDefault"
                        class="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary"
                        :disabled="isUploadingImage || modalGalleryImages.length === 0"
                      />
                      <label for="new-image-default" class="text-[11px] font-medium text-foreground cursor-pointer select-none">
                        Set as Default Image
                      </label>
                    </div>

                    <div class="pt-1">
                      <button 
                        type="button"
                        @click="confirmAddImage"
                        :disabled="isUploadingImage"
                        class="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Loader2 v-if="isUploadingImage" class="w-3.5 h-3.5 animate-spin" />
                        <Upload v-else class="w-3.5 h-3.5" />
                        <span>{{ isUploadingImage ? 'Uploading...' : 'Upload Image' }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading Skeleton State -->
              <div v-if="isModalImagesLoading && modalGalleryImages.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div v-for="i in 4" :key="i" class="aspect-square rounded-xl bg-muted/40 animate-pulse border border-border flex items-center justify-center">
                  <Loader2 class="w-5 h-5 animate-spin text-muted-foreground/50" />
                </div>
              </div>

              <!-- Gallery Cards Grid -->
              <div v-else-if="modalGalleryImages.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div
                  v-for="(img, idx) in modalGalleryImages"
                  :key="img.id ?? idx"
                  @click="selectedGalleryImage = img"
                  role="button"
                  tabindex="0"
                  @keydown.enter="selectedGalleryImage = img"
                  @keydown.space.prevent="selectedGalleryImage = img"
                  :class="cn(
                    'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all cursor-pointer select-none',
                    selectedGalleryImage?.image === img.image
                      ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                      : 'border-border hover:border-primary/50 hover:shadow-xs'
                  )"
                  :title="img.alt_text ? `${img.alt_text}${img.is_default ? ' (Default)' : ''}` : `Product Image ${idx + 1}${img.is_default ? ' (Default)' : ''}`"
                  :aria-label="img.alt_text ? `Select ${img.alt_text}` : `Select product image ${idx + 1}`"
                >
                  <!-- Image Container with aspect ratio -->
                  <div class="aspect-square bg-muted/20 relative flex items-center justify-center p-3 overflow-hidden">
                    <img
                      :src="modalImageErrorMap[img.image || ''] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : img.image"
                      :alt="img.alt_text || `Product image ${idx + 1}`"
                      @error="handleModalImageError(img.image)"
                      class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                    <!-- Default Badge -->
                    <span
                      v-if="img.is_default"
                      class="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider leading-none"
                      title="Default product image"
                    >
                      Default
                    </span>
                    <!-- Display Order Badge -->
                    <span
                      v-if="img.display_order !== undefined && img.display_order !== null"
                      class="absolute top-2 right-2 bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/60 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded leading-none"
                      title="Display order"
                    >
                      #{{ img.display_order }}
                    </span>
                  </div>

                  <!-- Card Footer / Caption -->
                  <div class="p-2 bg-card border-t border-border/60 flex items-center justify-between gap-1 text-xs">
                    <span class="truncate text-[11px] font-medium text-foreground" :title="img.alt_text || `Image ${idx + 1}`">
                      {{ img.alt_text || `Image ${idx + 1}` }}
                    </span>
                    <div class="flex items-center gap-1 shrink-0">
                      <span
                        v-if="selectedGalleryImage?.image === img.image"
                        class="text-[10px] font-bold text-primary flex items-center gap-0.5"
                      >
                        <Check class="w-3 h-3 stroke-[2.5]" />
                        <span class="hidden xs:inline">Selected</span>
                      </span>
                      <button
                        v-if="canDeleteProductImage && img.id !== undefined && img.id !== null"
                        type="button"
                        @click.stop="promptDeleteProductImage(img)"
                        class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete image"
                        aria-label="Delete image"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="p-6 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
                <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <ImageIcon class="w-5 h-5" />
                </div>
                <p class="text-xs font-semibold text-foreground">No images available</p>
                <p class="text-[11px] text-muted-foreground">No gallery images have been recorded for this product.</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Modal Footer Controls -->
        <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <button 
            type="button"
            @click="() => modalState.closeModal()"
            class="h-10 px-5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isModalSubmitting || (modalState.isCreate.value && !canCreateProduct) || (modalState.isEdit.value && !canEditProduct)"
            class="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isModalSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isModalSubmitting ? (modalState.isEdit.value ? 'Saving Changes...' : 'Creating Product...') : (modalState.isEdit.value ? 'Save Changes' : 'Create Product') }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: View Product Details -->
    <UiAdminModal 
      :is-open="modalState.isView.value" 
      max-width="max-w-3xl" 
      :show-close-button="false" 
      :close-on-escape="!imageToDelete"
      :close-on-backdrop="!imageToDelete"
      @close="modalState.closeModal"
    >
      <div class="w-full relative overflow-hidden flex flex-col cursor-default">
        <!-- Header Banner -->
        <div class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Product Specification Audit</span>
            <h3 class="text-xl font-display font-extrabold tracking-tight text-foreground mt-0.5">
              {{ modalState.isResolving.value ? 'Loading Product...' : (selectedProduct?.name || 'Product Details') }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink 
              v-if="!modalState.isResolving.value && selectedProduct"
              :to="getStorefrontProductUrl(selectedProduct)"
              target="_blank"
              rel="noopener noreferrer"
              class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View on Storefront"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Storefront</span>
            </NuxtLink>
            <button 
              v-if="!modalState.isResolving.value && selectedProduct && canEditProduct"
              type="button"
              @click="modalState.openEdit(selectedProduct.id)"
              class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button 
              type="button"
              @click="modalState.closeModal()" 
              aria-label="Close dialog"
              class="w-9 h-9 border border-input rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Resolving / Loading State -->
        <div v-if="modalState.isResolving.value" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <p class="text-xs font-semibold text-muted-foreground">Retrieving product specifications & metadata...</p>
        </div>

        <!-- Error / Not Found State -->
        <div v-else-if="!selectedProduct" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle class="w-6 h-6" />
          </div>
          <p class="text-sm font-bold text-foreground">Product Details Not Available</p>
          <p class="text-xs text-muted-foreground">Could not load the requested product specifications from the catalog registry.</p>
          <button 
            type="button"
            @click="modalState.closeModal()"
            class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        <!-- Product Content Container -->
        <div v-else class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          <!-- Product Hero Card -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-muted/40 rounded-2xl border border-border">
            <div class="w-20 h-20 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0 relative">
              <div v-if="isModalImagesLoading" class="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-xs z-10">
                <Loader2 class="w-4 h-4 animate-spin text-primary" />
              </div>
              <img 
                :src="modalMainImageUrl" 
                :alt="modalMainImageAlt" 
                @error="handleModalImageError(selectedGalleryImage?.image)"
                class="w-full h-full object-contain" 
              />
            </div>
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-lg font-bold font-display tracking-tight text-foreground leading-tight">
                  {{ selectedProduct.name }}
                </span>
                <span v-if="selectedProduct.wishlist" class="shrink-0 text-rose-500" title="In Wishlist">
                  <Heart class="w-4 h-4 fill-rose-500" />
                </span>
                <span v-if="selectedProduct.in_cart" class="shrink-0 text-primary" title="In Cart">
                  <ShoppingCart class="w-4 h-4" />
                </span>
              </div>

              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                  {{ selectedProduct.slug }}
                </span>
                <span class="font-mono text-muted-foreground text-[11px] font-semibold">
                  SKU: {{ selectedProduct.sku || 'N/A' }}
                </span>
                <div class="flex items-center gap-1.5 ml-auto">
                  <span :class="cn(
                    'w-2 h-2 rounded-full',
                    selectedProduct.is_active !== false ? 'bg-emerald-500' : 'bg-muted-foreground'
                  )"></span>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {{ selectedProduct.is_active !== false ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing & Core Identifiers Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selling Price</span>
              <p class="text-base font-extrabold text-foreground font-mono">
                {{ formatCurrency(getProductPrice(selectedProduct)) }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product ID</span>
              <p class="text-base font-bold text-foreground font-mono">
                #{{ selectedProduct.id }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legacy ID</span>
              <p class="text-base font-bold text-foreground font-mono">
                {{ selectedProduct.legacy_id !== null && selectedProduct.legacy_id !== undefined ? `#${selectedProduct.legacy_id}` : 'N/A' }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory Stock</span>
              <p class="text-base font-bold text-foreground font-mono">
                {{ selectedProduct.stock ?? 0 }} units
              </p>
            </div>
          </div>

          <!-- Dedicated Product Image Gallery Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-border pb-1.5">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
                  {{ modalGalleryImages.length }} {{ modalGalleryImages.length === 1 ? 'image' : 'images' }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div v-if="isModalImagesLoading" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                  <span class="text-[11px] font-medium hidden xs:inline">Fetching...</span>
                </div>
                <button 
                  v-if="canAddProductImage"
                  type="button" 
                  @click="isAddingImage = !isAddingImage" 
                  :class="cn('text-xs font-semibold px-2 py-1 rounded-md transition-colors flex items-center gap-1.5', isAddingImage ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20')"
                >
                  <Upload class="w-3.5 h-3.5" />
                  <span>{{ isAddingImage ? 'Cancel Upload' : 'Add Image' }}</span>
                </button>
              </div>
            </div>

            <!-- Upload Form (Inline) -->
            <div v-if="isAddingImage" class="p-4 border border-primary/20 bg-primary/5 rounded-xl space-y-4 mb-4">
              <input 
                type="file" 
                ref="imageFileInput" 
                accept="image/jpeg,image/png,image/webp,image/gif" 
                class="hidden" 
                @change="onImageFileChange" 
              />
              
              <div v-if="!newImageFile" class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl bg-background/50 cursor-pointer hover:bg-primary/5 transition-colors" @click="triggerImageUpload">
                <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                  <Upload class="w-5 h-5" />
                </div>
                <p class="text-sm font-semibold text-primary">Click to select an image</p>
                <p class="text-[11px] text-muted-foreground mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>

              <div v-else class="flex gap-4">
                <div class="w-24 h-24 sm:w-32 sm:h-32 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden relative">
                  <img :src="newImagePreview!" alt="Preview" class="w-full h-full object-contain" />
                  <button type="button" @click.stop="cancelAddImage" class="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground backdrop-blur-xs p-1 rounded-md shadow-xs transition-colors">
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div class="flex-1 space-y-3 min-w-0">
                  <div class="space-y-1">
                    <label class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Alt Text (Optional)</label>
                    <input 
                      v-model="newImageAltText" 
                      type="text" 
                      class="w-full h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20" 
                      placeholder="Describe the image for accessibility and SEO..."
                      :disabled="isUploadingImage"
                    />
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="new-image-default-view" 
                      v-model="newImageIsDefault"
                      class="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary"
                      :disabled="isUploadingImage || modalGalleryImages.length === 0"
                    />
                    <label for="new-image-default-view" class="text-[11px] font-medium text-foreground cursor-pointer select-none">
                      Set as Default Image
                    </label>
                  </div>

                  <div class="pt-1">
                    <button 
                      type="button"
                      @click="confirmAddImage"
                      :disabled="isUploadingImage"
                      class="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Loader2 v-if="isUploadingImage" class="w-3.5 h-3.5 animate-spin" />
                      <Upload v-else class="w-3.5 h-3.5" />
                      <span>{{ isUploadingImage ? 'Uploading...' : 'Upload Image' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading Skeleton State -->
            <div v-if="isModalImagesLoading && modalGalleryImages.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div v-for="i in 4" :key="i" class="aspect-square rounded-xl bg-muted/40 animate-pulse border border-border flex items-center justify-center">
                <Loader2 class="w-5 h-5 animate-spin text-muted-foreground/50" />
              </div>
            </div>

            <!-- Gallery Cards Grid -->
            <div v-else-if="modalGalleryImages.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="(img, idx) in modalGalleryImages"
                :key="img.id ?? idx"
                @click="selectedGalleryImage = img"
                role="button"
                tabindex="0"
                @keydown.enter="selectedGalleryImage = img"
                @keydown.space.prevent="selectedGalleryImage = img"
                :class="cn(
                  'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all cursor-pointer select-none',
                  selectedGalleryImage?.image === img.image
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-border hover:border-primary/50 hover:shadow-xs'
                )"
                :title="img.alt_text ? `${img.alt_text}${img.is_default ? ' (Default)' : ''}` : `Product Image ${idx + 1}${img.is_default ? ' (Default)' : ''}`"
                :aria-label="img.alt_text ? `Select ${img.alt_text}` : `Select product image ${idx + 1}`"
              >
                <!-- Image Container with aspect ratio -->
                <div class="aspect-square bg-muted/20 relative flex items-center justify-center p-3 overflow-hidden">
                  <img
                    :src="modalImageErrorMap[img.image || ''] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : img.image"
                    :alt="img.alt_text || `Product image ${idx + 1}`"
                    @error="handleModalImageError(img.image)"
                    class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  <!-- Default Badge -->
                  <span
                    v-if="img.is_default"
                    class="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider leading-none"
                    title="Default product image"
                  >
                    Default
                  </span>
                  <!-- Display Order Badge -->
                  <span
                    v-if="img.display_order !== undefined && img.display_order !== null"
                    class="absolute top-2 right-2 bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/60 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded leading-none"
                    title="Display order"
                  >
                    #{{ img.display_order }}
                  </span>
                </div>

                <!-- Card Footer / Caption -->
                <div class="p-2 bg-card border-t border-border/60 flex items-center justify-between gap-1 text-xs">
                  <span class="truncate text-[11px] font-medium text-foreground" :title="img.alt_text || `Image ${idx + 1}`">
                    {{ img.alt_text || `Image ${idx + 1}` }}
                  </span>
                  <div class="flex items-center gap-1 shrink-0">
                    <span
                      v-if="selectedGalleryImage?.image === img.image"
                      class="text-[10px] font-bold text-primary flex items-center gap-0.5"
                    >
                      <Check class="w-3 h-3 stroke-[2.5]" />
                      <span class="hidden xs:inline">Selected</span>
                    </span>
                    <button
                      v-if="canDeleteProductImage && img.id !== undefined && img.id !== null"
                      type="button"
                      @click.stop="promptDeleteProductImage(img)"
                      class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete image"
                      aria-label="Delete image"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="p-6 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon class="w-5 h-5" />
              </div>
              <p class="text-xs font-semibold text-foreground">No images available</p>
              <p class="text-[11px] text-muted-foreground">No gallery images have been recorded for this product.</p>
            </div>
          </div>

          <!-- Categories & Origin Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-border pb-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxonomy & Classifications</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Categories list -->
              <div class="space-y-1.5">
                <span class="text-xs font-semibold text-muted-foreground">Assigned Categories</span>
                <div v-if="getProductDetailCategories.length > 0" class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="cat in getProductDetailCategories" 
                    :key="cat.id"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
                  >
                    <Layers class="w-3 h-3" />
                    <span>{{ cat.name }}</span>
                    <span v-if="cat.slug" class="text-[10px] font-mono text-primary/70">/{{ cat.slug }}</span>
                  </span>
                </div>
                <p v-else class="text-xs text-muted-foreground italic">No categories assigned.</p>
              </div>

              <!-- Origin -->
              <div class="space-y-1.5">
                <span class="text-xs font-semibold text-muted-foreground">Category Origin</span>
                <div v-if="selectedProduct.origin" class="p-2.5 bg-muted/30 border border-border rounded-xl space-y-0.5 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-foreground">{{ typeof selectedProduct.origin === 'object' ? selectedProduct.origin.name : selectedProduct.origin }}</span>
                    <span v-if="typeof selectedProduct.origin === 'object' && selectedProduct.origin.id" class="font-mono text-[10px] text-muted-foreground">ID: #{{ selectedProduct.origin.id }}</span>
                  </div>
                  <p v-if="typeof selectedProduct.origin === 'object' && selectedProduct.origin.slug" class="text-[11px] font-mono text-muted-foreground">
                    Slug: {{ selectedProduct.origin.slug }}
                  </p>
                  <p v-if="typeof selectedProduct.origin === 'object' && selectedProduct.origin.parent" class="text-[11px] text-muted-foreground">
                    Parent: {{ selectedProduct.origin.parent }}
                  </p>
                </div>
                <p v-else class="text-xs text-muted-foreground italic">No category origin recorded.</p>
              </div>
            </div>
          </div>

          <!-- Short Description -->
          <div v-if="selectedProduct.short_description" class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Short Description</span>
            <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-foreground bg-muted/30 p-3.5 rounded-xl border border-border font-medium leading-relaxed" v-html="selectedProduct.short_description">
            </div>
          </div>

          <!-- Full Description -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
            <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-foreground bg-muted/20 p-4 rounded-xl border border-border font-normal leading-relaxed max-h-48 overflow-y-auto">
              <div v-if="selectedProduct.description" v-html="selectedProduct.description"></div>
              <p v-else class="text-xs text-muted-foreground italic m-0">No product description provided.</p>
            </div>
          </div>

          <!-- Specifications Section -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Technical Specifications</span>
            <!-- If raw HTML specifications -->
            <div v-if="typeof selectedProduct.specifications === 'string' && (selectedProduct.specifications.includes('<') && selectedProduct.specifications.includes('>'))" class="prose prose-sm prose-slate dark:prose-invert max-w-none">
              <div v-html="selectedProduct.specifications" class="text-xs text-foreground bg-card border rounded-xl p-4 overflow-x-auto"></div>
            </div>
            <!-- Else fallback to parsedSpecifications if we have any -->
            <div v-else-if="parsedSpecifications.length > 0" class="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
              <div 
                v-for="(spec, idx) in parsedSpecifications" 
                :key="idx"
                class="flex items-start justify-between p-2.5 bg-card hover:bg-muted/30 transition-colors gap-4"
              >
                <span class="font-bold text-muted-foreground w-1/3 shrink-0">{{ spec.key }}</span>
                <span class="font-medium text-foreground text-right break-words flex-1">{{ spec.value }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">No specifications recorded for this product.</p>
          </div>

          <!-- Price History Section -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price History</span>
            <div v-if="selectedProduct.price_histories && selectedProduct.price_histories.length > 0" class="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
              <div class="grid grid-cols-3 bg-muted/40 p-2.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Price</span>
                <span>Changed At</span>
                <span class="text-right">Changed By</span>
              </div>
              <div 
                v-for="(history, hIdx) in selectedProduct.price_histories" 
                :key="hIdx"
                class="grid grid-cols-3 p-2.5 bg-card hover:bg-muted/20 transition-colors items-center"
              >
                <span class="font-bold font-mono text-foreground">{{ typeof history.price === 'number' ? formatCurrency(history.price) : (!isNaN(Number(history.price)) ? formatCurrency(Number(history.price)) : history.price) }}</span>
                <span class="text-muted-foreground text-[11px] font-mono">{{ formatDate(history.changed_at) }}</span>
                <span class="text-right text-muted-foreground font-mono text-[11px]">{{ history.changed_by || 'System' }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">No price modification history records available.</p>
          </div>

          <!-- Audit Metadata Grid -->
          <div class="pt-4 border-t border-border space-y-2.5 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Governance</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Created At</span>
                <p class="font-mono text-[11px] text-foreground">{{ formatDate(selectedProduct.created_at) }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Updated At</span>
                <p class="font-mono text-[11px] text-foreground">{{ formatDate(selectedProduct.updated_at) }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Created By</span>
                <p class="font-mono text-[11px] text-foreground">{{ selectedProduct.created_by ? `#${selectedProduct.created_by}` : 'System' }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Updated By</span>
                <p class="font-mono text-[11px] text-foreground">{{ selectedProduct.updated_by ? `#${selectedProduct.updated_by}` : 'System' }}</p>
              </div>
            </div>
            <div v-if="selectedProduct.deleted_at" class="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center justify-between">
              <span class="font-bold">Soft Deleted Timestamp</span>
              <span class="font-mono">{{ formatDate(selectedProduct.deleted_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer Control -->
        <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <button 
            type="button"
            @click="modalState.closeModal()" 
            class="h-10 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

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

    <!-- Product Image Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="!!imageToDelete"
      max-width="max-w-md"
      :show-close-button="false"
      @close="cancelDeleteProductImage"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Image Deletion</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete this product image from the gallery? This action cannot be undone.
          </p>
          <div v-if="imageToDelete?.image" class="mt-4 flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20">
            <div class="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted/40 p-1 flex items-center justify-center shrink-0">
              <img 
                :src="modalImageErrorMap[imageToDelete.image] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : imageToDelete.image" 
                :alt="imageToDelete.alt_text || 'Image to delete'" 
                class="w-full h-full object-contain" 
              />
            </div>
            <div class="min-w-0 flex-1 text-xs">
              <p class="font-medium text-foreground truncate">
                {{ imageToDelete.alt_text || 'Product Image' }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span v-if="imageToDelete.is_default" class="text-primary font-bold uppercase text-[9px]">Default Image</span>
                <span v-if="imageToDelete.display_order !== undefined">Order #{{ imageToDelete.display_order }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold"
            @click="cancelDeleteProductImage"
            :disabled="isDeletingImage"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            @click="confirmDeleteProductImage"
            :disabled="isDeletingImage"
          >
            <Loader2 v-if="isDeletingImage" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>{{ isDeletingImage ? 'Deleting...' : 'Delete Image' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
    </div>
  </NuxtLayout>
</template>

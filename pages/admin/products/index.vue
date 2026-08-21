<!-- File: /pages/admin/products/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  Layers, 
  Star, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  Heart, 
  ShoppingCart,
  ChevronDown,
  Check,
  X
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { formatCurrency, cn } from '@/utils';
import type { Product, Category } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';

definePageMeta({
  layout: 'admin'
});

const tableColumns: UiTableColumn<Product>[] = [
  { key: 'name', label: 'Product Details', headerClass: 'px-6 py-4', cellClass: 'px-6 py-4' },
  { key: 'sku', label: 'SKU', headerClass: 'px-6 py-4', cellClass: 'px-6 py-4' },
  { key: 'category', label: 'Category', headerClass: 'px-6 py-4', cellClass: 'px-6 py-4' },
  { key: 'price', label: 'Price', align: 'right', headerClass: 'px-6 py-4 text-right', cellClass: 'px-6 py-4 text-right' },
  { key: 'stock', label: 'Inventory', headerClass: 'px-6 py-4', cellClass: 'px-6 py-4' },
  { key: 'status', label: 'Status', headerClass: 'px-6 py-4', cellClass: 'px-6 py-4' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-6 py-4 text-right', cellClass: 'px-6 py-4 text-right' },
];

const productService = useProductService();
const categoryService = useCategoryService();
const { canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

const route = useRoute();
const router = useRouter();

const canCreateProduct = computed(() => canCreateInModule('/admin/products'));
const canEditProduct = computed(() => canEditInModule('/admin/products'));
const canDeleteProduct = computed(() => canDeleteInModule('/admin/products'));

// State managers initialized from URL query parameters
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

// Category search and infinite-scrolling picker options
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

// Fetch products page from API (GET /api/v1/products/)
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
      page: currentPage.value > 1 ? currentPage.value : undefined,
      pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
      search: debouncedSearchQuery.value.trim() || undefined,
      categories: categoriesParam,
      category: undefined
    }
  });
  fetchProductsPage();
};

// Reset pagination to page 1 whenever filters change
watch([debouncedSearchQuery, () => selectedCategoryIds.value.join(','), itemsPerPage], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    updateRouteAndFetch();
  }
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

// Document click / keyboard listeners for category popover dismiss
const onDocumentClick = (e: MouseEvent) => {
  if (!isCategoryDropdownOpen.value) return;
  const target = e.target as HTMLElement | null;
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isCategoryDropdownOpen.value) {
    closeCategoryDropdown();
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

const handleDelete = async (product: Product) => {
  if (!confirm(`Are you sure you want to delete product "${product.name}"?`)) return;
  isDeleting.value = product.id;
  try {
    await productService.deleteProduct(product.id);
    toastSuccess(`Product "${product.name}" deleted successfully.`);
    await fetchProductsPage();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete product.');
  } finally {
    isDeleting.value = null;
  }
};

onMounted(() => {
  fetchProductsPage();
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
  <div class="space-y-6">
    <!-- Single-Row Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground">Catalog Management</h1>
        <p class="text-xs text-muted-foreground mt-0.5">Configure and manage hardware inventory assets.</p>
      </div>
      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <NuxtLink 
          v-if="canCreateProduct" 
          to="/admin/products/new"
          class="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Add Product</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Filters Area -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <UiSearchInput
          v-model="searchQuery"
          placeholder="Search by product name, SKU..."
          class="w-full sm:w-80"
        />

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
                <span class="truncate">{{ cat.name }}</span>
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

        <!-- Items per page selector -->
        <div class="flex items-center gap-1.5 border-l border-border pl-2.5">
          <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
          <select 
            v-model="itemsPerPage"
            class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option :value="5">5 / page</option>
            <option :value="10">10 / page</option>
            <option :value="25">25 / page</option>
            <option :value="50">50 / page</option>
          </select>
        </div>

        <!-- Reload Button -->
        <button 
          type="button"
          @click="fetchProductsPage"
          :disabled="isLoading"
          class="h-9 w-9 flex items-center justify-center bg-background border border-input rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
          title="Refresh products list"
          aria-label="Refresh products list"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
        </button>
      </div>
    </div>

    <!-- Error State Banner -->
    <div v-if="fetchError" class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4 text-xs font-medium text-destructive">
      <div class="flex items-center gap-2.5">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ fetchError }}</span>
      </div>
      <button 
        type="button"
        @click="fetchProductsPage"
        class="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
      >
        Retry
      </button>
    </div>

    <!-- Products Table -->
    <UiTable
      :columns="tableColumns"
      :data="productsList"
      :loading="isLoading"
      key-field="id"
      empty-text="No Products Found"
      empty-description="No items match your query or filter criteria. Try clearing search filters."
    >
      <!-- Product Details Column -->
      <template #cell-name="{ item: product }">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center relative">
            <img 
              :src="getProductImageUrl(product)" 
              :alt="getProductImageAlt(product)"
              @error="handleImageError(product.id)"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {{ product.name }}
              </span>
              <span v-if="product.wishlist" class="shrink-0 text-rose-500" title="In Wishlist">
                <Heart class="w-3.5 h-3.5 fill-rose-500" />
              </span>
              <span v-if="product.in_cart" class="shrink-0 text-primary" title="In Cart">
                <ShoppingCart class="w-3.5 h-3.5" />
              </span>
            </div>
            <div class="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span class="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/80">
                {{ product.brand }}
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
          <span>{{ getCategoryName(product) }}</span>
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
            v-if="canEditProduct" 
            :to="`/admin/products/${product.id}`" 
            class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" 
            title="Edit product" 
            aria-label="Edit product"
          >
            <Edit2 class="w-4 h-4" />
          </NuxtLink>
          <button 
            v-if="canDeleteProduct" 
            type="button"
            @click="handleDelete(product)" 
            :disabled="isDeleting === product.id"
            class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50" 
            title="Delete product" 
            aria-label="Delete product"
          >
            <Loader2 v-if="isDeleting === product.id" class="w-4 h-4 animate-spin text-destructive" />
            <Trash2 v-else class="w-4 h-4" />
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
  </div>
</template>

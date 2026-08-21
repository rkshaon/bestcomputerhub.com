<!-- File: /pages/admin/products/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  Download,
  Package,
  Layers,
  Star,
  RefreshCw,
  AlertCircle,
  Loader2,
  Heart,
  ShoppingCart
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { formatCurrency, cn } from '@/utils';
import type { Product, Category } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
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

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const categoryFilter = ref(route.query.category ? String(route.query.category) : 'all');
const ordering = ref(route.query.ordering ? String(route.query.ordering) : '-id');

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Category filter dropdown options
const availableCategories = ref<{ id: string | number; name: string; slug: string }[]>([]);

const loadCategories = async () => {
  try {
    const res = await categoryService.getCategoriesList({ page_size: 100 });
    if (res && Array.isArray(res.results)) {
      availableCategories.value = res.results.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      }));
    }
  } catch {}
};

// Fetch products page from API (GET /api/v1/products/)
const fetchProductsPage = async () => {
  isLoading.value = true;
  fetchError.value = null;

  try {
    const response = await productService.getProductsList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value.trim() || undefined,
      category: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
      ordering: ordering.value || undefined
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
  router.replace({
    query: {
      ...route.query,
      page: currentPage.value > 1 ? currentPage.value : undefined,
      pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
      search: debouncedSearchQuery.value.trim() || undefined,
      category: categoryFilter.value !== 'all' ? categoryFilter.value : undefined,
      ordering: ordering.value !== '-id' ? ordering.value : undefined
    }
  });
  fetchProductsPage();
};

watch([debouncedSearchQuery, categoryFilter, ordering, itemsPerPage], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    updateRouteAndFetch();
  }
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

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
  loadCategories();
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
    <div class="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
      <div class="flex-1 min-w-[260px]">
        <UiSearchInput
          v-model="searchQuery"
          placeholder="Search by product name, SKU..."
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <select 
          v-model="categoryFilter"
          class="h-12 px-4 bg-muted/50 border border-input rounded-2xl text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option v-for="cat in availableCategories" :key="cat.id" :value="cat.slug || cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- Ordering Sort -->
        <select 
          v-model="ordering"
          class="h-12 px-4 bg-muted/50 border border-input rounded-2xl text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="-id">Newest First</option>
          <option value="name">Name (A-Z)</option>
          <option value="-name">Name (Z-A)</option>
          <option value="price">Price (Low to High)</option>
          <option value="-price">Price (High to Low)</option>
        </select>

        <!-- Items per page -->
        <select 
          v-model="itemsPerPage"
          class="h-12 px-3 bg-muted/50 border border-input rounded-2xl text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option :value="5">5 per page</option>
          <option :value="10">10 per page</option>
          <option :value="25">25 per page</option>
          <option :value="50">50 per page</option>
        </select>

        <!-- Reload Button -->
        <button 
          type="button"
          @click="fetchProductsPage"
          :disabled="isLoading"
          class="h-12 w-12 flex items-center justify-center bg-muted/50 border border-input rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
          title="Refresh products list"
          aria-label="Refresh products list"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
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

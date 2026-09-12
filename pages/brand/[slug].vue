<!-- File: /pages/brand/[slug].vue -->
<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  SlidersHorizontal,
  Grid, 
  List, 
  ArrowUpDown, 
  RefreshCw, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Tag,
  AlertCircle,
  Search,
  Loader2,
  Edit2
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useAuthStore } from '@/stores/auth';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import { cn, decodeHtmlEntities } from '@/utils';
import type { Product, Brand, Category } from '@/types';
import CommerceProductCard from '@/components/commerce/ProductCard.vue';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';

const route = useRoute();
const router = useRouter();
const productService = useProductService();
const brandService = useBrandService();
const categoryService = useCategoryService();
const authStore = useAuthStore();
const { hasPermission } = useAdminPermissions();
const { toastSuccess, handleApiError } = useToast();

const brandSlug = computed(() => (route.params.slug as string) || '');

// Brand details fetched from GET /api/v1/brands/{brand-slug}/
const brandDetail = ref<Brand | null>(null);
const isBrandLoading = ref(true);

const isOwnerOrStaff = computed(() => {
  if (!authStore.isLoggedIn || !authStore.user) return false;
  const roleUpper = (authStore.user.role || '').toString().trim().toUpperCase();
  if (roleUpper === 'OWNER' || roleUpper === 'STAFF') return true;
  if (Boolean(authStore.user.is_staff || authStore.user.is_superuser || authStore.user.is_superadmin)) return true;
  return false;
});

const canEditBrandFromStorefront = computed(() => {
  return isOwnerOrStaff.value && (hasPermission('store.change_brand') || hasPermission('change_brand') || hasPermission('brands.change_brand'));
});

// Inline editing state
const editingField = ref<'name' | 'description' | null>(null);
const isFieldSaving = ref<'name' | 'description' | null>(null);

const editNameValue = ref('');
const editDescValue = ref('');

const nameInputRef = ref<HTMLInputElement | null>(null);

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

const startEditing = (field: 'name' | 'description') => {
  if (!canEditBrandFromStorefront.value) return;
  
  editingField.value = field;
  
  if (field === 'name') {
    editNameValue.value = brandDetail.value?.name || '';
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  } else if (field === 'description') {
    editDescValue.value = brandDetail.value?.description || '';
  }
};

const cancelEditing = () => {
  editingField.value = null;
  isFieldSaving.value = null;
};

const saveField = async (field: 'name' | 'description') => {
  if (isFieldSaving.value === field) return; // Prevent duplicate submissions
  
  const targetBrand = brandDetail.value;
  if (!targetBrand) return;
  
  const targetIdentifier = targetBrand.id;
  if (!targetIdentifier) return;

  let hasChanged = false;
  const payload: any = {};

  if (field === 'name') {
    const newVal = editNameValue.value.trim();
    const oldVal = (targetBrand.name || '').trim();
    if (newVal && newVal !== oldVal) {
      payload.name = newVal;
      hasChanged = true;
    }
  } else if (field === 'description') {
    const newVal = editDescValue.value;
    const oldVal = targetBrand.description || '';
    if (!isHtmlEquivalent(newVal, oldVal)) {
      payload.description = newVal;
      hasChanged = true;
    }
  }

  if (!hasChanged) {
    editingField.value = null;
    return;
  }

  isFieldSaving.value = field;

  try {
    const updated = await brandService.updateBrand(String(targetIdentifier), payload);
    toastSuccess('Brand updated successfully.');
    
    if (brandDetail.value) {
      if (field === 'name') {
        brandDetail.value.name = updated.name;
      } else if (field === 'description') {
        brandDetail.value.description = updated.description;
      }
    }
    
    editingField.value = null;
  } catch (err: any) {
    handleApiError(err, 'Failed to update brand.');
  } finally {
    isFieldSaving.value = null;
  }
};

const handleFocusOut = (event: FocusEvent, field: 'description') => {
  const container = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  
  if (container && relatedTarget && container.contains(relatedTarget)) {
    return;
  }
  
  saveField(field);
};

// Formatted fallback title if brand object is loading
const brandTitle = computed(() => {
  if (brandDetail.value?.name) {
    return decodeHtmlEntities(brandDetail.value.name);
  }
  if (!brandSlug.value) return 'Brand Catalog';
  return brandSlug.value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
});

const cleanShortDescription = computed(() => {
  const desc = brandDetail.value?.description || '';
  if (!desc) {
    return `Explore optimized enterprise-grade technology and premium ${brandTitle.value} options.`;
  }
  // Strip HTML tags for the short text introduction in header
  const stripped = desc.replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
  if (stripped.length > 180) {
    return stripped.substring(0, 180) + '...';
  }
  return stripped;
});

const pageTitle = computed(() => `${brandTitle.value} Products`);
const pageDescription = computed(() => {
  if (brandDetail.value?.description && brandDetail.value.description.trim()) {
    return brandDetail.value.description.trim();
  }
  return `Explore authentic ${brandTitle.value} products at Best Computer Hub. Official warranty, verified specifications, and competitive prices.`;
});

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription
});

// Breadcrumbs setup
const breadcrumbs = computed(() => {
  return [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products/' },
    { name: brandTitle.value, url: `/brand/${brandSlug.value}/` }
  ];
});

// State for Products
const products = ref<Product[]>([]);
const isLoading = ref(true);
const isError = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const pageSize = ref(12);
const viewMode = ref<'grid' | 'list'>('grid');

const filters = reactive({
  category: '',
  minPrice: 0,
  maxPrice: 10000,
  sort: 'newest'
});

const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

// Load all categories for filters selection list
const allCategoriesList = ref<Category[]>([]);
const loadAllCategories = async () => {
  try {
    const listResponse = await categoryService.getCategoriesList({ page_size: 200 });
    if (listResponse && listResponse.results && listResponse.results.length) {
      allCategoriesList.value = listResponse.results;
    } else {
      allCategoriesList.value = productService.getCategories();
    }
  } catch {
    allCategoriesList.value = productService.getCategories();
  }
};

// Fetch Brand Details (GET /api/v1/brands/{brand-slug}/)
const fetchBrandDetails = async () => {
  if (!brandSlug.value) return;
  brandDetail.value = null; // Clear stale state to prevent using old brand ID during transition
  isBrandLoading.value = true;
  try {
    const data = await brandService.getBrandDetails(brandSlug.value);
    brandDetail.value = data;
  } catch (err: any) {
    console.warn('Could not fetch brand details via slug endpoint:', err);
    brandDetail.value = null;
  } finally {
    isBrandLoading.value = false;
  }
};

// Fetch Products belonging to the Brand (GET /api/v1/products/?brands={brand-id})
const fetchBrandProducts = async () => {
  if (!brandSlug.value) return;
  
  // Strictly require resolved Brand ID to avoid sending slug to the Product API
  if (!brandDetail.value?.id) {
    return;
  }

  isLoading.value = true;
  isError.value = false;
  errorMessage.value = '';

  const brandIdentifier = String(brandDetail.value.id);

  try {
    const response = await productService.getProductsList({
      brands: brandIdentifier,
      category: filters.category || undefined,
      query: debouncedSearchQuery.value || undefined,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < 10000 ? filters.maxPrice : undefined,
      page: currentPage.value,
      page_size: pageSize.value,
      sort: filters.sort
    });

    products.value = response.results;
    totalCount.value = response.count;
    totalPages.value = response.pages;
  } catch (err: any) {
    isError.value = true;
    errorMessage.value = err?.message || 'Failed to load brand products from catalog.';
    
    // Fallback sync query in mock mode
    try {
      const fallback = productService.getProducts({
        brand: brandIdentifier,
        category: filters.category,
        query: debouncedSearchQuery.value,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort
      });
      products.value = fallback;
      totalCount.value = fallback.length;
      totalPages.value = Math.ceil(fallback.length / pageSize.value) || 1;
      isError.value = false;
    } catch {
      products.value = [];
      totalCount.value = 0;
      totalPages.value = 1;
    }
  } finally {
    isLoading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value || newPage === currentPage.value) return;
  currentPage.value = newPage;
  fetchBrandProducts();
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
};

const resetFilters = () => {
  filters.category = '';
  filters.minPrice = 0;
  filters.maxPrice = 10000;
  filters.sort = 'newest';
  searchQuery.value = '';
};

const loadBrandData = async () => {
  await fetchBrandDetails();
  await fetchBrandProducts();
};

watch(
  () => route.params.slug,
  () => {
    currentPage.value = 1;
    loadBrandData();
  }
);

watch(
  [debouncedSearchQuery, () => filters.category, () => filters.minPrice, () => filters.maxPrice, () => filters.sort],
  () => {
    currentPage.value = 1;
    fetchBrandProducts();
  }
);

onMounted(() => {
  loadAllCategories();
  loadBrandData();
});
</script>

<template>
  <div class="min-h-screen pb-24 bg-background">
    <!-- Breadcrumbs & Brand Header -->
    <div class="bg-card border-b py-12 transition-all duration-300">
      <div class="container mx-auto px-4">
        <!-- Breadcrumbs Navigation -->
        <UiBreadcrumbs class="mb-6" :items="breadcrumbs" />

        <!-- Brand Header Details -->
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div class="max-w-4xl space-y-4">
            <div class="flex items-center gap-4">
              <!-- Brand Logo when available -->
              <div 
                v-if="brandDetail?.logo" 
                class="w-16 h-16 rounded-2xl bg-background p-2 border border-border/80 shadow-sm flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img 
                  :src="brandDetail.logo" 
                  :alt="brandTitle" 
                  class="w-full h-full object-contain" 
                />
              </div>
              <div v-else class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Tag class="w-7 h-7" />
              </div>

              <!-- Brand Name Heading / Editor -->
              <div class="relative group/edit">
                <template v-if="editingField === 'name'">
                  <div class="flex items-center gap-2">
                    <input 
                      v-model="editNameValue"
                      ref="nameInputRef"
                      type="text"
                      @blur="saveField('name')"
                      @keydown.enter="saveField('name')"
                      @keydown.esc="cancelEditing"
                      :disabled="isFieldSaving === 'name'"
                      class="text-4xl md:text-5xl font-display font-black tracking-tight text-foreground transition-all bg-background border border-input rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <div v-if="isFieldSaving === 'name'" class="shrink-0">
                      <Loader2 class="w-5 h-5 animate-spin text-primary" />
                    </div>
                  </div>
                </template>
                <template v-else>
                  <h1 class="text-4xl md:text-5xl font-display font-black tracking-tight text-foreground transition-all flex items-center gap-2.5">
                    <span>{{ brandTitle }}</span>
                    <button 
                      v-if="canEditBrandFromStorefront" 
                      @click="startEditing('name')"
                      class="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                      title="Edit Brand Name"
                    >
                      <Edit2 class="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </h1>
                </template>
              </div>
            </div>

            <p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
              {{ cleanShortDescription }}
            </p>

            <!-- Inactive Status Notice -->
            <div v-if="brandDetail && brandDetail.is_active === false" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>This brand is currently marked as inactive in the catalog system.</span>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <NuxtLink 
              to="/products/" 
              class="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3.5 py-2.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-colors shadow-sm"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              All Products
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="container mx-auto px-4 py-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 xl:w-72 shrink-0 space-y-8">
          <div class="flex items-center justify-between border-b pb-4">
            <h3 class="font-bold text-base flex items-center gap-2">
              <SlidersHorizontal class="w-4.5 h-4.5 text-primary" />
              Advanced Filters
            </h3>
            <button 
              @click="resetFilters" 
              class="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-all"
            >
              Reset All
            </button>
          </div>

          <!-- Search inside Brand Workspace -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Search Brand</h4>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search collection..." 
                class="w-full h-11 bg-muted/60 border rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-border/85"
              />
            </div>
          </div>

          <!-- Price Threshold -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Price Threshold</h4>
            <div class="space-y-4">
              <input 
                type="range" 
                v-model="filters.maxPrice" 
                min="0" 
                max="10000" 
                step="100" 
                class="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" 
              />
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="bg-muted px-2.5 py-1 rounded-md">Tk 0</span>
                <span class="text-primary bg-primary/10 px-3 py-1 rounded-md">Up to Tk {{ filters.maxPrice }}</span>
              </div>
            </div>
          </div>

          <!-- Brand Locked Workspace Indicator -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Brand Workspace</h4>
            <div class="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-1 shadow-sm">
              <span class="text-xs font-extrabold text-foreground block truncate">
                {{ brandTitle }}
              </span>
              <span class="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                Strictly Scoped
              </span>
            </div>
          </div>

          <!-- Strategic Categories list filter -->
          <div v-if="allCategoriesList.length > 0" class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Strategic Categories</h4>
            <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-submenu-scrollbar">
              <label class="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="radio" 
                  name="category_filter" 
                  value="" 
                  v-model="filters.category"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors">
                  All Categories
                </span>
              </label>
              <label 
                v-for="cat in allCategoriesList" 
                :key="cat.id" 
                class="flex items-center gap-3 cursor-pointer group/label"
              >
                <input 
                  type="radio" 
                  name="category_filter" 
                  :value="cat.id" 
                  v-model="filters.category"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors block truncate">
                  {{ decodeHtmlEntities(cat.name) }}
                </span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Product Listing & Toolbar -->
        <div class="flex-1 min-w-0 w-full space-y-8">
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b">
            <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Displaying <span class="text-foreground font-extrabold">{{ totalCount }}</span> optimal results
            </span>
            
            <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div class="flex items-center border rounded-lg overflow-hidden">
                <button 
                  @click="viewMode = 'grid'"
                  :class="cn('p-2.5 transition-all shrink-0 cursor-pointer', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
                  title="Grid view" 
                  aria-label="Grid view"
                >
                  <Grid class="w-4 h-4" />
                </button>
                <button 
                  @click="viewMode = 'list'"
                  :class="cn('p-2.5 transition-all shrink-0 cursor-pointer', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
                  title="List view" 
                  aria-label="List view"
                >
                  <List class="w-4 h-4" />
                </button>
              </div>
              <select 
                v-model="filters.sort"
                class="h-11 bg-background border border-border/85 rounded-xl px-4 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 shrink-0"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Performance</option>
              </select>
            </div>
          </div>

          <!-- Loading State Skeletons -->
          <div 
            v-if="isLoading" 
            :class="cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
            )"
          >
            <div v-for="i in 8" :key="i" class="bg-card rounded-2xl border p-6 space-y-4 animate-pulse">
              <div class="aspect-video bg-muted rounded-xl w-full"></div>
              <div class="space-y-2">
                <div class="h-4 bg-muted rounded w-1/3"></div>
                <div class="h-6 bg-muted rounded w-3/4"></div>
              </div>
              <div class="flex items-center justify-between pt-4">
                <div class="h-6 bg-muted rounded w-1/4"></div>
                <div class="h-8 bg-muted rounded-full w-1/4"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="isError" class="p-8 sm:p-12 text-center bg-card border rounded-3xl max-w-lg mx-auto space-y-4 my-8 shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <RefreshCw class="w-6 h-6 animate-spin" />
            </div>
            <h2 class="text-xl font-bold font-display text-foreground">Unable to Load Products</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ errorMessage }}</p>
            <button 
              @click="fetchBrandProducts" 
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <RefreshCw class="w-4 h-4" /> Try Again
            </button>
          </div>

          <!-- Products Listing Render -->
          <div v-else-if="products.length > 0" class="space-y-12">
            <div 
              :class="cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
              )"
            >
              <CommerceProductCard 
                v-for="product in products" 
                :key="product.id" 
                :product="product" 
              />
            </div>

            <!-- Modern Paginated Controls -->
            <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-8">
              <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Page <span class="text-foreground font-black">{{ currentPage }}</span> of <span class="text-foreground font-black">{{ totalPages }}</span>
              </span>
              <div class="flex items-center gap-3">
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === 1" 
                  @click="handlePageChange(currentPage - 1)"
                  class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Previous
                </UiButton>
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === totalPages" 
                  @click="handlePageChange(currentPage + 1)"
                  class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-card border border-dashed rounded-2xl p-12 max-w-2xl mx-auto shadow-sm">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search class="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold tracking-tight text-foreground">No matches found</h3>
              <p class="text-muted-foreground max-w-sm text-sm">
                Try loosening your limits or searching a different term inside this brand workspace.
              </p>
            </div>
            <UiButton variant="outline" @click="resetFilters">Clear All Filters</UiButton>
          </div>
        </div>
      </div>

      <!-- Bottom Rich Brand Details Section -->
      <div 
        v-if="canEditBrandFromStorefront || (brandDetail?.description && (brandDetail.description.includes('<') || brandDetail.description.length > 200))" 
        class="mt-16 bg-card border border-border/80 rounded-[2rem] p-8 md:p-12 space-y-6 shadow-sm"
      >
        <div class="flex items-center justify-between border-b pb-4">
          <h2 class="text-2xl font-display font-black tracking-tight text-foreground">
            Detailed Guide to {{ brandDetail?.name || 'this Brand' }}
          </h2>
          
          <div v-if="canEditBrandFromStorefront" class="shrink-0">
            <button 
              v-if="editingField !== 'description'"
              @click="startEditing('description')"
              class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Edit Description"
            >
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit Description</span>
            </button>
            <div v-else-if="isFieldSaving === 'description'" class="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase tracking-wider">
              <Loader2 class="w-3.5 h-3.5 animate-spin" /> Saving...
            </div>
          </div>
        </div>

        <div v-if="editingField === 'description'">
          <div @focusout="handleFocusOut($event, 'description')" class="w-full">
            <UiRichTextEditor 
              v-model="editDescValue"
              min-height="min-h-[220px]"
              :disabled="isFieldSaving === 'description'"
              placeholder="Enter brand detailed description..."
            />
          </div>
        </div>
        <div v-else>
          <div 
            v-if="brandDetail?.description"
            class="prose prose-slate dark:prose-invert max-w-none"
            v-html="brandDetail.description"
          />
          <p v-else class="text-sm text-muted-foreground italic">
            No detailed description available. Click "Edit Description" to add one.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose h2 {
  @apply text-xl font-bold text-foreground mt-8 mb-4;
}
.prose h3 {
  @apply text-lg font-bold text-foreground mt-6 mb-3;
}
.prose h4 {
  @apply text-base font-bold text-foreground mt-4 mb-2;
}
.prose p {
  @apply mb-4 text-muted-foreground leading-relaxed text-sm;
}
.prose ul {
  @apply list-disc pl-6 mb-6 space-y-2;
}
.prose li {
  @apply text-muted-foreground text-sm leading-relaxed;
}
.prose a {
  @apply text-primary hover:underline transition-all;
}
</style>

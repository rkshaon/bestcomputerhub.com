<!-- File: /pages/brand/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Grid2X2, 
  List, 
  ArrowUpDown, 
  RefreshCw, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Tag
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { decodeHtmlEntities } from '@/utils';
import type { Product } from '@/types';
import ProductCard from '@/components/commerce/ProductCard.vue';

const route = useRoute();
const router = useRouter();
const productService = useProductService();

const brandSlug = computed(() => (route.params.slug as string) || '');

// Formatted brand title (e.g. "msi" -> "MSI", "asus-rog" -> "ASUS ROG")
const brandTitle = computed(() => {
  if (!brandSlug.value) return 'Brand Catalog';
  return brandSlug.value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
});

const pageTitle = computed(() => `${brandTitle.value} Products`);
const pageDescription = computed(() => 
  `Explore authentic ${brandTitle.value} products at Best Computer Hub. Official warranty, verified specifications, and competitive prices.`
);

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription
});

// State
const products = ref<Product[]>([]);
const isLoading = ref(true);
const isError = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const pageSize = ref(12);
const viewMode = ref<'grid' | 'list'>('grid');
const sortOption = ref('featured');

const fetchBrandProducts = async () => {
  if (!brandSlug.value) return;
  isLoading.value = true;
  isError.value = false;
  errorMessage.value = '';

  try {
    const response = await productService.getProductsList({
      brands: brandSlug.value,
      brand: brandSlug.value,
      page: currentPage.value,
      page_size: pageSize.value,
      sort: sortOption.value
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
        brand: brandSlug.value,
        sort: sortOption.value
      });
      products.value = fallback;
      totalCount.value = fallback.length;
      totalPages.value = 1;
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

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    fetchBrandProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(
  [() => route.params.slug, sortOption],
  () => {
    currentPage.value = 1;
    fetchBrandProducts();
  }
);

onMounted(() => {
  fetchBrandProducts();
});
</script>

<template>
  <div class="min-h-screen bg-background pb-16 sm:pb-24">
    <!-- Header Banner & Breadcrumbs -->
    <div class="bg-card border-b border-border/60 py-6 sm:py-10">
      <div class="container mx-auto px-4">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-4 overflow-x-auto custom-submenu-scrollbar">
          <NuxtLink to="/" class="hover:text-primary transition-colors whitespace-nowrap">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/products/" class="hover:text-primary transition-colors whitespace-nowrap">Products</NuxtLink>
          <span>/</span>
          <span class="text-foreground font-semibold whitespace-nowrap">{{ brandTitle }}</span>
        </nav>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Tag class="w-4 h-4" />
              </div>
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                {{ brandTitle }}
              </h1>
            </div>
            <p class="text-xs sm:text-sm text-muted-foreground">
              Official {{ brandTitle }} products available in catalog
            </p>
          </div>

          <div class="flex items-center gap-3">
            <NuxtLink 
              to="/products/" 
              class="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              All Brands
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="container mx-auto px-4 mt-6 sm:mt-8">
      <!-- Toolbar: Controls & Summary -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-card border border-border/60 shadow-sm mb-6">
        <div class="flex items-center justify-between sm:justify-start gap-4">
          <span class="text-xs sm:text-sm font-semibold text-foreground">
            <span class="text-primary font-bold">{{ totalCount }}</span>
            <span class="text-muted-foreground"> Product{{ totalCount !== 1 ? 's' : '' }} Found</span>
          </span>

          <!-- Grid/List Switcher -->
          <div class="flex items-center bg-muted/60 p-1 rounded-xl border border-border/40">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'grid' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              ]"
              title="Grid View"
              aria-label="Grid view"
            >
              <Grid2X2 class="w-4 h-4" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'list' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              ]"
              title="List View"
              aria-label="List view"
            >
              <List class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Sorting Selector -->
        <div class="flex items-center gap-2">
          <label for="sort-select" class="text-xs font-medium text-muted-foreground shrink-0 hidden xs:inline">Sort by:</label>
          <div class="relative w-full sm:w-auto">
            <select
              id="sort-select"
              v-model="sortOption"
              class="w-full sm:w-48 h-9 pl-3 pr-8 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
            >
              <option value="featured">Featured / Default</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <ArrowUpDown class="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Loading State Skeleton Grid -->
      <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        <div 
          v-for="i in 8" 
          :key="i" 
          class="bg-card border rounded-2xl p-4 space-y-4 animate-pulse"
        >
          <div class="aspect-square bg-muted/60 rounded-xl"></div>
          <div class="space-y-2">
            <div class="h-3 bg-muted/60 rounded w-1/3"></div>
            <div class="h-4 bg-muted/60 rounded w-full"></div>
            <div class="h-4 bg-muted/60 rounded w-2/3"></div>
            <div class="h-5 bg-muted/60 rounded w-1/2 pt-2"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="isError" class="p-8 sm:p-12 text-center bg-card border rounded-3xl max-w-lg mx-auto space-y-4 my-8">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <RefreshCw class="w-6 h-6" />
        </div>
        <h2 class="text-xl font-bold font-display text-foreground">Unable to Load Products</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ errorMessage }}</p>
        <UiButton variant="outline" @click="fetchBrandProducts" class="gap-2">
          <RefreshCw class="w-4 h-4" /> Try Again
        </UiButton>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="p-12 sm:p-16 text-center bg-card border rounded-3xl max-w-lg mx-auto space-y-4 my-8">
        <div class="w-16 h-16 rounded-2xl bg-muted/50 text-muted-foreground/60 flex items-center justify-center mx-auto">
          <Package class="w-8 h-8 stroke-1" />
        </div>
        <div class="space-y-1">
          <h2 class="text-xl font-bold font-display text-foreground">No Products Found</h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            There are currently no products listed under brand <span class="font-bold text-foreground">{{ brandTitle }}</span>.
          </p>
        </div>
        <div class="pt-2">
          <UiButton to="/products/" class="gap-2">
            <ArrowLeft class="w-4 h-4" /> Browse Catalog
          </UiButton>
        </div>
      </div>

      <!-- Products Grid / List View -->
      <div v-else>
        <div 
          :class="[
            viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6' 
              : 'flex flex-col gap-4'
          ]"
        >
          <ProductCard 
            v-for="product in products" 
            :key="product.id" 
            :product="product" 
          />
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8 sm:mt-12">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="h-9 px-3 rounded-xl border bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" /> Previous
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="p in totalPages"
              :key="p"
              @click="changePage(p)"
              :class="[
                'w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer',
                currentPage === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border text-foreground hover:bg-muted'
              ]"
            >
              {{ p }}
            </button>
          </div>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="h-9 px-3 rounded-xl border bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            Next <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- File: /pages/product-category/[...slug].vue -->
<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { SlidersHorizontal, Grid, List, Search, ChevronRight, Home, ArrowLeft } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { cn } from '@/utils';
import type { Category, Product } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
import CommerceProductCard from '@/components/commerce/ProductCard.vue';

const route = useRoute();
const productService = useProductService();
const categoryService = useCategoryService();

const slugs = computed(() => {
  const s = route.params.slug;
  if (!s) return [];
  const raw = Array.isArray(s) ? s : [s];
  return raw.map(segment => (typeof segment === 'string' ? segment.trim() : '')).filter(Boolean);
});

const categorySlug = computed(() => {
  const arr = slugs.value;
  return arr.length ? arr[arr.length - 1] : '';
});

const allCategoriesList = ref<Category[]>([]);
const isPageLoading = ref(true);

const loadAllCategories = async () => {
  isPageLoading.value = true;
  try {
    const listResponse = await categoryService.getCategoriesList({ page_size: 200 });
    if (listResponse && listResponse.results && listResponse.results.length) {
      allCategoriesList.value = listResponse.results;
    } else {
      allCategoriesList.value = productService.getCategories();
    }
  } catch {
    allCategoriesList.value = productService.getCategories();
  } finally {
    isPageLoading.value = false;
    await resolveCategory();
  }
};

const activeCategory = ref<Category | null>(null);

const pageTitle = computed(() => {
  if (activeCategory.value?.name) {
    return activeCategory.value.name;
  }
  return categorySlug.value ? categorySlug.value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Products';
});

const pageDescription = computed(() => {
  if (activeCategory.value?.description) {
    return activeCategory.value.description;
  }
  return `Explore top quality ${pageTitle.value} at Best Computer Hub in Bangladesh. Authentic products with reliable warranty and fast shipping.`;
});

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription
});

const resolveCategory = async () => {
  const targetSlug = categorySlug.value ? categorySlug.value.toLowerCase() : '';
  if (!targetSlug) {
    activeCategory.value = null;
    return;
  }

  // Recursive search helper to find category by slug in a hierarchy tree
  const findCategoryBySlug = (categories: Category[], slug: string): Category | null => {
    for (const cat of categories) {
      if (cat.slug?.toLowerCase() === slug.toLowerCase()) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryBySlug(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  };

  // 1. Instantly check for match in allCategoriesList (from menu's data/hierarchy list)
  let match = findCategoryBySlug(allCategoriesList.value, targetSlug);
  
  // 2. Fall back to static mock categories if not found in list
  if (!match) {
    match = findCategoryBySlug(productService.getCategories(), targetSlug);
  }

  // Set local match immediately so user gets an instant layout & visual response
  if (match) {
    activeCategory.value = { ...match };
  }

  // 3. Regardless of finding local match, call the Category Details API to load full rich content/description & ID
  try {
    const detail = await categoryService.getCategoryDetails(targetSlug);
    if (detail) {
      if (activeCategory.value) {
        // Merge rich details (like full description/guide) onto the basic category object
        activeCategory.value = { ...activeCategory.value, ...detail };
      } else {
        activeCategory.value = detail;
      }
      return;
    }
  } catch (e) {
    console.error('Failed to load category details via details API:', e);
  }

  // 4. If still not matched at all, try query search by slug
  if (!activeCategory.value && allCategoriesList.value.length > 0) {
    try {
      const searchRes = await categoryService.getCategoriesList({ search: targetSlug, page_size: 10 });
      if (searchRes && searchRes.results && searchRes.results.length) {
        const exactMatch = findCategoryBySlug(searchRes.results, targetSlug);
        if (exactMatch) {
          activeCategory.value = exactMatch;
          if (!allCategoriesList.value.some(c => c.id === exactMatch.id)) {
            allCategoriesList.value.push(exactMatch);
          }
        }
      }
    } catch (e) {
      console.error('Failed to resolve category via search:', e);
    }
  }
};

const category = computed(() => activeCategory.value);

const cleanShortDescription = computed(() => {
  const desc = category.value?.description || '';
  if (!desc) {
    return `Explore optimized enterprise-grade technology and premium ${category.value?.name || 'hardware'} options.`;
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

onMounted(() => {
  loadAllCategories();
});

watch(() => route.params.slug, async () => {
  await resolveCategory();
}, { immediate: true, deep: true });

// Breadcrumbs trail
const breadcrumbs = computed(() => {
  const trail: { name: string; url: string }[] = [];
  if (!category.value) return trail;
  
  const list = allCategoriesList.value.length ? allCategoriesList.value : productService.getCategories();
  
  const buildTrail = (cat: Category) => {
    trail.unshift({
      name: cat.name,
      url: categoryService.getCategoryUrl(cat, list)
    });
    
    if (cat.parentCategoryId) {
      const parent = list.find(p => p.id === cat.parentCategoryId);
      if (parent) {
        buildTrail(parent);
      }
    }
  };
  
  buildTrail(category.value);
  return trail;
});

const filters = reactive({
  brand: '',
  minPrice: 0,
  maxPrice: 10000,
  sort: 'newest'
});

const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const viewMode = ref<'grid' | 'list'>('grid');
const loadedProducts = ref<Product[]>([]);
const isProductsLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const pageSize = ref(12);

const fetchProducts = async () => {
  if (!category.value) {
    loadedProducts.value = [];
    totalCount.value = 0;
    totalPages.value = 1;
    return;
  }
  isProductsLoading.value = true;
  try {
    const res = await productService.getProductsList({
      categories: category.value.id,
      query: debouncedSearchQuery.value || undefined,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < 10000 ? filters.maxPrice : undefined,
      brand: filters.brand || undefined,
      sort: filters.sort,
      page: currentPage.value,
      page_size: pageSize.value
    });
    loadedProducts.value = res.results;
    totalCount.value = res.count;
    totalPages.value = res.pages;
  } catch {
    // Fallback sync query
    const fallbackProducts = productService.getProducts({
      category: category.value.id || category.value.slug,
      query: debouncedSearchQuery.value,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      brand: filters.brand,
      sort: filters.sort
    });
    loadedProducts.value = fallbackProducts;
    totalCount.value = fallbackProducts.length;
    totalPages.value = Math.ceil(fallbackProducts.length / pageSize.value) || 1;
  } finally {
    isProductsLoading.value = false;
  }
};

watch(category, () => {
  currentPage.value = 1;
  fetchProducts();
}, { deep: true });

watch(
  [debouncedSearchQuery, () => filters.brand, () => filters.minPrice, () => filters.maxPrice, () => filters.sort],
  () => {
    currentPage.value = 1;
    fetchProducts();
  }
);

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value || newPage === currentPage.value) return;
  currentPage.value = newPage;
  fetchProducts();
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
};

const products = computed(() => loadedProducts.value);

// Reset filters helper
const resetFilters = () => {
  filters.brand = '';
  filters.minPrice = 0;
  filters.maxPrice = 10000;
  filters.sort = 'newest';
  searchQuery.value = '';
};
</script>

<template>
  <div class="min-h-screen pb-24 bg-background">
    <!-- Breadcrumbs & Category Header -->
    <div class="bg-card border-b py-12 transition-all duration-300">
      <div class="container mx-auto px-4">
        <!-- Breadcrumbs Navigation -->
        <nav class="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-6 overflow-x-auto whitespace-nowrap py-1">
          <NuxtLink to="/" class="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Home class="w-3.5 h-3.5" />
            Home
          </NuxtLink>
          <template v-for="(bc, index) in breadcrumbs" :key="bc.url">
            <ChevronRight class="w-3.5 h-3.5 shrink-0" />
            <NuxtLink 
              v-if="index < breadcrumbs.length - 1" 
              :to="bc.url" 
              class="hover:text-primary transition-colors"
            >
              {{ bc.name }}
            </NuxtLink>
            <span v-else class="text-foreground font-extrabold truncate">{{ bc.name }}</span>
          </template>
        </nav>

        <!-- Category Title & Info -->
        <div class="max-w-4xl space-y-4">
          <h1 class="text-4xl md:text-5xl font-display font-black tracking-tight text-foreground transition-all">
            {{ category?.name || 'Hardware Collection' }}
          </h1>
          <p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
            {{ cleanShortDescription }}
          </p>
        </div>
      </div>
    </div>

    <!-- Main Section -->
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

          <!-- Search in this Category -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Search Category</h4>
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
                <span class="bg-muted px-2.5 py-1 rounded-md">$0</span>
                <span class="text-primary bg-primary/10 px-3 py-1 rounded-md">Up to ${{ filters.maxPrice }}</span>
              </div>
            </div>
          </div>

          <!-- Brands Selection -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Strategic Manufacturer</h4>
            <div class="space-y-2">
              <label 
                v-for="brand in ['NVIDIA', 'AMD', 'Intel', 'Supermicro']" 
                :key="brand" 
                class="flex items-center gap-3 cursor-pointer group/label"
              >
                <input 
                  type="radio" 
                  name="brand_filter" 
                  :value="brand" 
                  v-model="filters.brand"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors">
                  {{ brand }}
                </span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="radio" 
                  name="brand_filter" 
                  value="" 
                  v-model="filters.brand"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors">
                  All Brands
                </span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Product Grid Area -->
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
                  :class="cn('p-2.5 transition-all shrink-0', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
                  title="Grid view" 
                  aria-label="Grid view"
                >
                  <Grid class="w-4 h-4" />
                </button>
                <button 
                  @click="viewMode = 'list'"
                  :class="cn('p-2.5 transition-all shrink-0', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
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

          <!-- Grid of Products / Skeletons -->
          <div 
            v-if="isProductsLoading" 
            :class="cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
            )"
          >
            <div v-for="i in 6" :key="i" class="bg-card rounded-2xl border p-6 space-y-4 animate-pulse">
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

          <div v-else-if="products.length > 0" class="space-y-12">
            <div 
              :class="cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
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
          <div v-else class="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-card border border-dashed rounded-2xl p-12 max-w-2xl mx-auto">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search class="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold tracking-tight text-foreground">No matches found</h3>
              <p class="text-muted-foreground max-w-sm text-sm">
                Try loosening your limits or searching a different term inside this category workspace.
              </p>
            </div>
            <UiButton variant="outline" @click="resetFilters">Clear All Filters</UiButton>
          </div>
        </div>
      </div>

      <!-- Bottom Rich Category Details Section -->
      <div 
        v-if="category?.description && (category.description.includes('<') || category.description.length > 200)" 
        class="mt-16 bg-card border border-border/80 rounded-[2rem] p-8 md:p-12 space-y-6 shadow-sm"
      >
        <h2 class="text-2xl font-display font-black tracking-tight text-foreground border-b pb-4">
          Detailed Guide to {{ category.name }}
        </h2>
        <div 
          class="prose prose-slate dark:prose-invert max-w-none"
          v-html="category.description"
        />
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

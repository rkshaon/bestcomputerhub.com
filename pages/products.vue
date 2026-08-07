<!-- File: /pages/products.vue -->
<script setup lang="ts">
import { 
  Filter, 
  Grid2X2, 
  List, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X,
  ChevronDown
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { cn } from '@/utils';
import type { Product } from '@/types';

const productService = useProductService();
const route = useRoute();
const router = useRouter();

// Filters State
const filters = ref({
  query: (route.query.q as string) || '',
  category: (route.query.category as string) || '',
  brand: (route.query.brand as string) || '',
  minPrice: Number(route.query.minPrice) || 0,
  maxPrice: Number(route.query.maxPrice) || 10000,
  sort: (route.query.sort as string) || 'featured'
});

const dynamicTitle = computed(() => {
  if (filters.value.query) {
    return 'Search Results';
  }
  if (filters.value.brand) {
    const brandName = filters.value.brand.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${brandName} Products`;
  }
  if (filters.value.category) {
    return filters.value.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'All Products';
});

const dynamicDescription = computed(() => {
  if (filters.value.query) {
    return `Search results for "${filters.value.query}" at Best Computer Hub. Find authentic products with competitive prices and warranty.`;
  }
  if (filters.value.brand) {
    return `Shop authentic ${filters.value.brand} products at Best Computer Hub. Official warranty and fast delivery in Bangladesh.`;
  }
  return 'Browse our extensive catalog of gaming PCs, laptops, computer components, and accessories at Best Computer Hub.';
});

useSeoMeta({
  title: dynamicTitle,
  description: dynamicDescription,
  ogTitle: dynamicTitle,
  ogDescription: dynamicDescription
});

const isFilterSidebarOpen = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

const loadedProducts = ref<Product[]>([]);
const isProductsLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const fetchProducts = async () => {
  isProductsLoading.value = true;
  try {
    const res = await productService.getProductsList({
      query: filters.value.query,
      category: filters.value.category,
      brand: filters.value.brand,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      sort: filters.value.sort,
      page: currentPage.value,
      page_size: 12
    });
    loadedProducts.value = res.results;
    totalCount.value = res.count;
    totalPages.value = res.pages;
  } catch {
    // Fallback sync query
    const fallbackProducts = productService.getProducts({
      query: filters.value.query,
      category: filters.value.category,
      brand: filters.value.brand,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      sort: filters.value.sort
    });
    loadedProducts.value = fallbackProducts;
    totalCount.value = fallbackProducts.length;
    totalPages.value = 1;
  } finally {
    isProductsLoading.value = false;
  }
};

const products = computed(() => loadedProducts.value);

const allCategories = computed(() => productService.getCategories().filter(c => !c.parentCategoryId));
const allBrands = Array.from(new Set(productService.getProducts().map(p => p.brand)));

const updateRoute = () => {
  router.push({
    query: {
      q: filters.value.query || undefined,
      category: filters.value.category || undefined,
      brand: filters.value.brand || undefined,
      minPrice: filters.value.minPrice > 0 ? filters.value.minPrice : undefined,
      maxPrice: filters.value.maxPrice < 10000 ? filters.value.maxPrice : undefined,
      sort: filters.value.sort !== 'featured' ? filters.value.sort : undefined
    }
  });
};

watch(filters, () => {
  currentPage.value = 1;
  updateRoute();
  fetchProducts();
}, { deep: true });

onMounted(() => {
  fetchProducts();
});

const clearFilters = () => {
  filters.value = {
    query: '',
    category: '',
    brand: '',
    minPrice: 0,
    maxPrice: 10000,
    sort: 'featured'
  };
};

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.category) count++;
  if (filters.value.brand) count++;
  if (filters.value.minPrice > 0 || filters.value.maxPrice < 10000) count++;
  if (filters.value.query) count++;
  return count;
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-black text-white pt-32 pb-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div class="container mx-auto px-4 relative">
        <div class="max-w-3xl space-y-4">
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
            Enterprise <span class="italic text-primary">Catalog</span>
          </h1>
          <p class="text-lg text-white/50 max-w-xl">
            Explore our curated selection of high-performance hardware, ranging from semiconductor components to full server architectures.
          </p>
        </div>
      </div>
    </section>

    <!-- Toolbar -->
    <div class="sticky top-[72px] z-30 bg-background/80 backdrop-blur-xl border-b py-4">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center gap-4">
          <!-- Search -->
          <div class="relative w-full md:max-w-md group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              v-model="filters.query"
              type="text" 
              placeholder="Search components..." 
              class="w-full h-11 bg-muted/50 border rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
            />
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto md:ml-auto">
            <UiButton 
              variant="outline" 
              class="rounded-xl h-11 font-bold gap-2 flex-grow md:flex-grow-0"
              @click="isFilterSidebarOpen = true"
            >
              <Filter class="w-4 h-4" /> Filters
              <span v-if="activeFiltersCount > 0" class="w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                {{ activeFiltersCount }}
              </span>
            </UiButton>

            <div class="h-11 bg-muted/50 rounded-xl border flex p-1">
              <button 
                @click="viewMode = 'grid'"
                :class="cn('px-3 rounded-lg flex items-center transition-all', viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')"
              >
                <Grid2X2 class="w-4 h-4" />
              </button>
              <button 
                @click="viewMode = 'list'"
                :class="cn('px-3 rounded-lg flex items-center transition-all', viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')"
              >
                <List class="w-4 h-4" />
              </button>
            </div>

            <div class="relative group h-11">
              <select 
                v-model="filters.sort"
                class="appearance-none h-full bg-muted/50 border rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="container mx-auto px-4 py-12">
      <div v-if="isProductsLoading" :class="cn(
        'grid gap-8',
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
      )">
        <div v-for="i in 8" :key="i" class="bg-card rounded-[2rem] border p-6 space-y-4 animate-pulse">
          <div class="aspect-video bg-muted rounded-2xl w-full"></div>
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
        <div :class="cn(
          'grid gap-8',
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
        )">
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
              @click="currentPage--; fetchProducts()"
              class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </UiButton>
            <UiButton 
              variant="outline" 
              size="sm" 
              :disabled="currentPage === totalPages" 
              @click="currentPage++; fetchProducts()"
              class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-32 flex flex-col items-center justify-center text-center space-y-6">
        <div class="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center text-muted-foreground opacity-40">
          <Search class="w-10 h-10" />
        </div>
        <div class="space-y-2">
          <h2 class="text-3xl font-display font-bold">No results found</h2>
          <p class="text-muted-foreground max-w-md mx-auto">We couldn't find any components matching your current filter criteria. Try adjusting your search.</p>
        </div>
        <UiButton variant="outline" class="rounded-full px-8 font-bold" @click="clearFilters">
          Clear All Filters
        </UiButton>
      </div>
    </div>

    <!-- Filter Sidebar (Mobile/Drawer style) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isFilterSidebarOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" @click="isFilterSidebarOpen = false">
        <div 
          class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
          @click.stop
        >
          <div class="flex items-center justify-between p-6 border-b">
            <h2 class="text-xl font-display font-bold flex items-center gap-2">
              <SlidersHorizontal class="w-5 h-5" /> Filter Components
            </h2>
            <button @click="isFilterSidebarOpen = false" class="p-2 hover:bg-muted rounded-full transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-grow overflow-y-auto p-6 space-y-10">
            <!-- Categories -->
            <div class="space-y-4">
              <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Component Category</p>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="cat in allCategories" 
                  :key="cat.slug"
                  @click="filters.category = cat.slug"
                  :class="cn(
                    'px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                    filters.category === cat.slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-transparent hover:bg-muted'
                  )"
                >
                  {{ cat.name }}
                </button>
              </div>
            </div>

            <!-- Price Range -->
            <div class="space-y-6">
              <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price Range (USD)</p>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-muted-foreground uppercase">Min</label>
                  <input v-model.number="filters.minPrice" type="number" class="w-full h-11 bg-muted/50 border rounded-xl px-4 text-sm font-bold transition-all focus:border-primary outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-muted-foreground uppercase">Max</label>
                  <input v-model.number="filters.maxPrice" type="number" class="w-full h-11 bg-muted/50 border rounded-xl px-4 text-sm font-bold transition-all focus:border-primary outline-none" />
                </div>
              </div>
            </div>

             <!-- Brands -->
             <div class="space-y-4">
              <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manufacturers</p>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  v-for="brand in allBrands" 
                  :key="brand"
                  @click="filters.brand = filters.brand === brand ? '' : brand"
                  :class="cn(
                    'p-3 text-left border rounded-xl text-sm font-semibold transition-all cursor-pointer',
                    filters.brand === brand ? 'bg-primary border-primary text-white font-bold' : 'bg-muted/30 border-transparent hover:bg-muted text-foreground'
                  )"
                >
                   {{ brand }}
                </button>
              </div>
            </div>
          </div>

          <div class="p-6 border-t grid grid-cols-2 gap-4 bg-muted/5">
            <UiButton variant="outline" class="rounded-full h-12 font-bold" @click="clearFilters">Reset All</UiButton>
            <UiButton class="rounded-full h-12 font-bold shadow-lg shadow-primary/20" @click="isFilterSidebarOpen = false">Show Results</UiButton>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

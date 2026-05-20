<script setup lang="ts">
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Star, 
  Heart, 
  Grid, 
  ChevronDown,
  X,
  Plus
} from 'lucide-vue-next';
import { PRODUCTS, CATEGORIES, type Product } from '~/mock/data';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { cn } from '~/utils';

const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const route = useRoute();

// Filter states
const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedBrand = ref('all');
const maxPrice = ref(2500);
const sortBy = ref('featured');

const brands = computed(() => {
  const list = PRODUCTS.map(p => p.brand);
  return ['all', ...Array.from(new Set(list))];
});

// Sync from route query if direct linked
onMounted(() => {
  if (route.query.category) {
    selectedCategory.value = String(route.query.category);
  }
  if (route.query.search) {
    searchQuery.value = String(route.query.search);
  }
});

// Watch route to update category query dynamically
watch(() => route.query.category, (newVal) => {
  if (newVal) selectedCategory.value = String(newVal);
}, { immediate: true });

const filteredProducts = computed(() => {
  let result = [...PRODUCTS];

  // Search Match
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }

  // Category Match
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value);
  }

  // Brand Match
  if (selectedBrand.value !== 'all') {
    result = result.filter(p => p.brand === selectedBrand.value);
  }

  // Price match
  result = result.filter(p => p.price <= maxPrice.value);

  // Sorting
  if (sortBy.value === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sortBy.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
});

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  selectedBrand.value = 'all';
  maxPrice.value = 2500;
  sortBy.value = 'featured';
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left">
    
    <!-- Top Catalog Header -->
    <div class="border-b border-slate-200/50 dark:border-slate-800 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-3xl font-display font-black tracking-tight">TechCore Shop</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">Explore our high-performance laptops, smartphones, high-fidelity audio equipment, and premium accessories.</p>
      </div>

      <!-- Quick Sorting and Search input -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative max-w-xs w-full sm:w-64">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search premium products..." 
            class="h-10 pl-9 pr-4 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold focus:border-rose-500 transition-colors"
          />
        </div>

        <select 
          v-model="sortBy"
          class="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none focus:border-rose-500 transition-colors"
        >
          <option value="featured">Featured First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Reviewed</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>
    </div>

    <!-- Master Layout Grid (Sidebar + Product Grids) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Filters Sidebar Panel -->
      <div class="lg:col-span-3 space-y-6">
        <div class="p-6 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-[2rem] space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
            <span class="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal class="w-4 h-4 text-rose-500" /> Filter Criteria
            </span>
            <button @click="clearFilters" class="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 cursor-pointer bg-transparent border-none">
              Reset
            </button>
          </div>

          <!-- Category Filter items -->
          <div class="space-y-3">
            <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-400">Product Categories</h4>
            <div class="space-y-2">
              <button 
                @click="selectedCategory = 'all'"
                :class="cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border text-[10px] font-bold uppercase transition-all cursor-pointer',
                  selectedCategory === 'all' 
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 dark:text-rose-400' 
                    : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                )"
              >
                <span>All Products</span>
                <span class="font-mono opacity-60">{{ PRODUCTS.length }}</span>
              </button>

              <button 
                v-for="cat in CATEGORIES" 
                :key="cat.slug"
                @click="selectedCategory = cat.slug"
                :class="cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border text-[10px] font-bold uppercase transition-all cursor-pointer',
                  selectedCategory === cat.slug 
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 dark:text-rose-400' 
                    : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                )"
              >
                <span>{{ cat.name }}</span>
                <span class="font-mono opacity-60">{{ cat.count || PRODUCTS.filter(p => p.category === cat.slug).length }}</span>
              </button>
            </div>
          </div>

          <!-- Brand select items -->
          <div class="space-y-3">
            <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-400">Manufacturer Brands</h4>
            <div class="space-y-1.5">
              <button 
                v-for="b in brands" 
                :key="b"
                @click="selectedBrand = b"
                :class="cn(
                  'w-full flex items-center px-3 py-1.5 rounded-lg text-left text-[10px] font-bold uppercase transition-colors cursor-pointer',
                  selectedBrand === b 
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )"
              >
                {{ b === 'all' ? 'All Brands' : b }}
              </button>
            </div>
          </div>

          <!-- Slider Range pricing limits -->
          <div class="space-y-3">
            <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Price Range</span>
              <span class="font-mono text-slate-900 dark:text-white font-black">${{ maxPrice }}</span>
            </div>
            <input 
              v-model.number="maxPrice"
              type="range" 
              min="50" 
              max="2500" 
              step="50"
              class="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full cursor-pointer accent-rose-600"
            />
          </div>

          <!-- Standard Compliance notice sidebar -->
          <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900/80">
            <h5 class="text-[9px] font-black uppercase tracking-wider text-rose-500 leading-none">Official Warranty Shield</h5>
            <p class="text-[9px] text-slate-400 leading-relaxed mt-1.5 font-semibold">
              Every purchase enjoys our premium direct support and 2-year worry-free warranty protection.
            </p>
          </div>
        </div>
      </div>

      <!-- Products Grid Panel -->
      <div class="lg:col-span-9 space-y-8">
        
        <!-- Empty filter states -->
        <div v-if="filteredProducts.length === 0" class="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-950/30">
          <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400 mb-6">
            <Search class="w-8 h-8" />
          </div>
          <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-slate-50">Zero Matches</h3>
          <p class="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">No device payloads match your filtered parameters. Readjust your thresholds or clear search entries.</p>
          <UiButton variant="rose" size="sm" class="mt-6" @click="clearFilters">Reset All Filters</UiButton>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div 
            v-for="prod in filteredProducts" 
            :key="prod.id"
            class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-[410px] relative hover:border-rose-500/20 dark:hover:border-rose-500/20 hover:scale-[1.01] transition-all duration-300 shadow-sm"
          >
            <!-- Badges -->
            <div class="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              <span v-if="prod.isOnSale" class="bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">SALE</span>
              <span v-if="prod.isNew" class="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">NEW</span>
            </div>

            <!-- Heart Wishlist Toggle and Product Image -->
            <div class="relative">
              <button 
                @click="wishlistStore.toggleWishlist(prod)"
                class="absolute top-0 right-0 z-10 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Heart :class="cn('w-4 h-4', wishlistStore.isInWishlist(prod.id) && 'text-rose-500 fill-rose-500')" />
              </button>

              <NuxtLink :to="`/products/${prod.slug}`" class="block rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 mt-2">
                <img :src="prod.image" :alt="prod.name" class="w-full h-44 object-cover group-hover:scale-103 transition-transform duration-500" />
              </NuxtLink>
            </div>

            <!-- Description -->
            <div class="space-y-2 mt-4 text-left">
              <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                <span>{{ prod.brand }}</span>
                <span class="flex items-center gap-1"><Star class="w-3 text-amber-400 fill-amber-400" /> {{ prod.rating }} ({{ prod.reviewCount }})</span>
              </div>
              
              <NuxtLink :to="`/products/${prod.slug}`" class="block min-h-[36px]">
                <h3 class="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2 hover:text-rose-500 transition-colors">
                  {{ prod.name }}
                </h3>
              </NuxtLink>
              
              <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {{ prod.description }}
              </p>
            </div>

            <!-- Quantity & Actions -->
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-900">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-400 tracking-widest uppercase text-[8px] leading-none mb-1">PRICE</span>
                <span class="text-base font-mono font-black text-slate-900 dark:text-white">
                  ${{ prod.price }}
                  <span v-if="prod.originalPrice" class="text-[10px] text-slate-400 line-through font-normal">${{ prod.originalPrice }}</span>
                </span>
              </div>

              <UiButton 
                size="sm" 
                variant="secondary"
                class="h-8 text-[9px] uppercase font-black px-4 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500"
                @click="cartStore.addToCart(prod)"
              >
                Add to Basket
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Custom footer summary -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
          <span>Displaying {{ filteredProducts.length }} of {{ PRODUCTS.length }} High-Spec Products</span>
          <span>Compliant Catalog</span>
        </div>
      </div>

    </div>

  </div>
</template>

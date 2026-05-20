<script setup lang="ts">
import { SlidersHorizontal, Grid, List, Search } from 'lucide-vue-next';

const route = useRoute();
const productService = useProductService();

const slug = route.params.slug as string;
const categories = productService.getCategories();
const category = categories.find(c => c.slug === slug);

const filters = reactive({
  brand: '',
  minPrice: 0,
  maxPrice: 5000,
  sort: 'newest'
});

const searchQuery = ref('');
const products = computed(() => {
  return productService.getProducts({
    category: category?.id || category?.slug, // Try both ID and Slug
    query: searchQuery.value,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort
  });
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-card border-b py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl space-y-4">
          <h1 class="text-5xl font-display font-extrabold tracking-tight capitalize">
            {{ category?.name || 'Hardware Collection' }}
          </h1>
          <p class="text-muted-foreground text-lg leading-relaxed">
            Discover our curated selection of high-performance {{ category?.name.toLowerCase() }} designed for ultimate productivity.
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-72 shrink-0 space-y-10 group">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg flex items-center gap-2">
              <SlidersHorizontal class="w-5 h-5 text-primary" />
              Advanced Filters
            </h3>
            <button class="text-xs font-bold uppercase tracking-widest text-primary hover:underline">Reset All</button>
          </div>

          <!-- Search Inner -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Search Collection</h4>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Filter results..." 
                class="w-full h-10 bg-muted/50 border rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <!-- Price Range -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price Threshold</h4>
            <div class="space-y-6">
              <input 
                type="range" 
                v-model="filters.maxPrice" 
                min="0" 
                max="5000" 
                step="50" 
                class="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" 
              />
              <div class="flex items-center justify-between text-sm font-bold">
                <span class="bg-muted px-2 py-1 rounded-md">$0</span>
                <span class="text-primary bg-primary/10 px-3 py-1 rounded-md">Up to ${{ filters.maxPrice }}</span>
              </div>
            </div>
          </div>

          <!-- Brand Selection -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Brand</h4>
            <div class="space-y-2">
              <label v-for="brand in ['Quantum', 'VisionTech', 'Titan', 'Apex']" :key="brand" class="flex items-center gap-3 cursor-pointer group/label">
                <input type="checkbox" class="w-4 h-4 rounded border-muted text-primary focus:ring-primary" />
                <span class="text-sm font-medium text-muted-foreground group-hover/label:text-foreground transition-colors">{{ brand }}</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Product Grid -->
        <div class="flex-grow space-y-8">
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b">
            <span class="text-sm font-medium text-muted-foreground">
              Displaying <span class="text-foreground font-bold">{{ products.length }}</span> items in {{ category?.name }}
            </span>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center border rounded-lg overflow-hidden">
                <button class="p-2 bg-muted text-foreground"><Grid class="w-4 h-4" /></button>
                <button class="p-2 hover:bg-muted text-muted-foreground"><List class="w-4 h-4" /></button>
              </div>
              <select 
                v-model="filters.sort"
                class="h-10 bg-background border rounded-lg px-4 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          <!-- Grid -->
          <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            <CommerceProductCard v-for="product in products" :key="product.id" :product="product" />
          </div>

          <!-- Empty State -->
          <div v-else class="py-32 flex flex-col items-center text-center space-y-6">
            <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <Search class="w-10 h-10 text-muted-foreground" />
            </div>
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">No results found</h3>
              <p class="text-muted-foreground max-w-sm">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
            <UiButton variant="outline" @click="filters.maxPrice = 5000; searchQuery = ''">Clear Filters</UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

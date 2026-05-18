<script setup lang="ts">
import { ref, computed } from 'vue';
import { ShoppingCart, Heart, Search, User, Menu, X, Sun, Moon, ChevronDown, PackageSearch } from 'lucide-vue-next';
import { cn } from '@/utils';

const uiStore = useUIStore();
const cartStore = useCartStore();
const productService = useProductService();
const allCategories = productService.getCategories();

// Filter for top-level categories
const categories = computed(() => allCategories.filter(c => !c.parentCategoryId));

// Helper to get products for a subcategory (limited to 4)
const getSubProducts = (subCategorySlug: string) => {
  return productService.getProducts({ category: subCategorySlug }).slice(0, 4);
};

const isScrolled = ref(false);

if (import.meta.client) {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 20;
  });
}
</script>

<template>
  <header 
    :class="cn(
      'sticky top-0 z-50 w-full transition-all duration-300 border-b',
      isScrolled ? 'bg-background/80 backdrop-blur-md py-2' : 'bg-background py-4'
    )"
  >
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between gap-8">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
          <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <PackageSearch class="text-primary-foreground w-6 h-6" />
          </div>
          <span class="font-display font-bold text-xl tracking-tight hidden sm:block">TechCore</span>
        </NuxtLink>

        <!-- Search Bar (Search-First UX) -->
        <div class="hidden md:flex flex-1 max-w-2xl relative group">
          <input 
            type="text" 
            placeholder="Search 9,000+ products, brands, and categories..." 
            class="w-full h-11 bg-muted/50 border-input border rounded-full px-12 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 sm:gap-4 shrink-0">
          <button @click="uiStore.toggleDarkMode()" class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <Sun v-if="uiStore.isDarkMode" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          
          <NuxtLink to="/account" class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <User class="w-5 h-5" />
          </NuxtLink>

          <NuxtLink to="/wishlist" class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground">
            <Heart class="w-5 h-5" />
          </NuxtLink>

          <button @click="uiStore.toggleCart()" class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground">
            <ShoppingCart class="w-5 h-5" />
            <span v-if="cartStore.totalItems > 0" class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {{ cartStore.totalItems }}
            </span>
          </button>

          <button @click="uiStore.toggleMobileMenu()" class="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
            <Menu v-if="!uiStore.isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Navigation (Mega Menu) -->
      <nav class="hidden md:flex items-center gap-8 mt-4 pt-4 border-t">
        <div v-for="cat in categories" :key="cat.id" class="group relative py-2">
          <NuxtLink :to="`/category/${cat.slug}`" class="flex items-center gap-1 font-medium text-sm hover:text-primary transition-colors">
            {{ cat.name }}
            <ChevronDown class="w-4 h-4 text-muted-foreground group-hover:rotate-180 transition-transform" />
          </NuxtLink>
          
          <!-- Mega Menu Dropdown -->
          <div class="absolute top-full left-0 hidden group-hover:block pt-2">
            <div class="bg-background border rounded-xl shadow-xl p-6 w-[700px] grid grid-cols-3 gap-8">
              <div v-for="sub in cat.subCategories" :key="sub">
                <NuxtLink :to="`/category/${sub}`" class="font-bold text-sm mb-3 block capitalize text-primary hover:underline">
                  {{ sub.replace(/-/g, ' ') }}
                </NuxtLink>
                <ul class="space-y-2">
                  <li v-for="product in getSubProducts(sub)" :key="product.id">
                    <NuxtLink :to="`/product/${product.slug}`" class="text-sm text-muted-foreground hover:text-foreground transition-colors line-clamp-1 block">
                      {{ product.name }}
                    </NuxtLink>
                  </li>
                  <li v-if="getSubProducts(sub).length === 0">
                    <span class="text-xs text-muted-foreground italic">Coming soon...</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <NuxtLink to="/offers" class="font-medium text-sm text-destructive hover:opacity-80 transition-opacity">Special Offers</NuxtLink>
        <NuxtLink to="/blog" class="font-medium text-sm hover:text-primary transition-colors">Tech Blog</NuxtLink>
      </nav>
    </div>
  </header>
</template>

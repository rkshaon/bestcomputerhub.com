<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingCart, Heart, Search, User, Menu, X, Sun, Moon, Monitor, ChevronDown, PackageSearch, Grid2X2 } from 'lucide-vue-next';
import { cn } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useAuthStore } from '@/stores/auth';
import { useProductService } from '@/composables/useProductService';
const uiStore = useUIStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const productService = useProductService();
const allCategories = productService.getCategories();

// Filter for top-level categories
const categories = computed(() => allCategories.filter(c => !c.parentCategoryId));

// Helper to get products for a subcategory (limited to 4)
const getSubProducts = (subCategorySlug: string) => {
  return productService.getProducts({ category: subCategorySlug }).slice(0, 4);
};

const isScrolled = ref(false);
const isThemeMenuOpen = ref(false);

if (process.client) {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 20;
  });
  
  // Close theme menu on click outside
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      isThemeMenuOpen.value = false;
    }
  });
}
</script>

<template>
  <header 
    :class="cn(
      'sticky top-0 z-50 w-full transition-all duration-500 border-b',
      isScrolled ? 'bg-background/90 backdrop-blur-xl py-2 shadow-sm' : 'bg-background py-4'
    )"
  >
    <div class="container mx-auto px-4">
      <div :class="cn('flex transition-all duration-500 items-center justify-between', isScrolled ? 'flex-row gap-8' : 'flex-col')">
        <!-- Main Row (Logo, Search, Actions) -->
        <div :class="cn('flex items-center justify-between w-full transition-all duration-500', isScrolled ? 'w-auto shrink-0 gap-8' : 'gap-8')">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0 group">
            <div :class="cn('bg-primary rounded-xl flex items-center justify-center transition-all duration-500', isScrolled ? 'w-8 h-8' : 'w-10 h-10')">
              <PackageSearch :class="cn('text-primary-foreground transition-all duration-500', isScrolled ? 'w-4 h-4' : 'w-6 h-6')" />
            </div>
            <span :class="cn('font-display font-extrabold tracking-tighter hidden sm:block transition-all duration-500', isScrolled ? 'text-lg' : 'text-xl')">
              Tech<span class="text-primary italic">Core</span>
            </span>
          </NuxtLink>

          <!-- Search Bar (Visible when not scrolled or in a smaller form) -->
          <div v-if="!isScrolled" class="hidden md:flex flex-1 max-w-2xl relative group">
            <input 
              type="text" 
              placeholder="Search enterprise hardware..." 
              class="w-full bg-muted/50 border-input border rounded-full px-12 h-11 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-500 outline-none"
              @keyup.enter="navigateTo(`/products?q=${($event.target as HTMLInputElement).value}`)"
            />
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-500 w-5 h-5" />
          </div>

          <!-- Actions (Desktop Hidden when scrolled to make room for nav, but visible in both if possible) -->
          <div :class="cn('flex items-center gap-1 sm:gap-2 shrink-0 transition-all duration-500', isScrolled ? 'order-last' : '')">
            <!-- Search Icon only when scrolled -->
            <button v-if="isScrolled" class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <Search class="w-5 h-5" />
            </button>

            <!-- Theme Dropdown -->
            <div class="relative theme-dropdown">
              <button 
                @click="isThemeMenuOpen = !isThemeMenuOpen" 
                class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center"
              >
                <Sun v-if="uiStore.themeMode === 'light'" class="w-5 h-5" />
                <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-5 h-5" />
                <Monitor v-else class="w-5 h-5" />
              </button>
              
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div v-if="isThemeMenuOpen" class="absolute top-full right-0 mt-2 w-40 bg-background border rounded-2xl shadow-xl p-2 z-50">
                  <button 
                    v-for="mode in ['light', 'dark', 'system'] as const" 
                    :key="mode"
                    @click="uiStore.setTheme(mode); isThemeMenuOpen = false"
                    :class="cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                      uiStore.themeMode === mode ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    )"
                  >
                    <Sun v-if="mode === 'light'" class="w-4 h-4" />
                    <Moon v-else-if="mode === 'dark'" class="w-4 h-4" />
                    <Monitor v-else class="w-4 h-4" />
                    <span class="capitalize">{{ mode }}</span>
                  </button>
                </div>
              </transition>
            </div>
            
            <NuxtLink to="/account" class="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <div v-if="authStore.isLoggedIn && authStore.user" class="w-8 h-8 rounded-full overflow-hidden border border-border">
                <img :src="authStore.user.avatar" :alt="authStore.user.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="p-1">
                <User class="w-5 h-5" />
              </div>
            </NuxtLink>

            <NuxtLink to="/wishlist" class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground">
              <Heart class="w-5 h-5" />
              <span v-if="wishlistStore.wishlistCount > 0" class="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {{ wishlistStore.wishlistCount }}
              </span>
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

        <!-- Navigation (Mega Menu) - Transitions into the same flex row as logo when scrolled -->
        <nav 
          :class="cn(
            'hidden md:flex items-center transition-all duration-500',
            isScrolled ? 'flex-1 justify-center gap-4 h-9' : 'w-full mt-4 pt-4 border-t h-12 gap-6'
          )"
        >
          <NuxtLink to="/products" class="font-bold text-xs text-primary flex items-center gap-2 group whitespace-nowrap">
            <Grid2X2 class="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-500" />
            Explore Catalog
          </NuxtLink>
          <div v-for="cat in categories" :key="cat.id" class="group relative h-full flex items-center">
            <NuxtLink :to="`/category/${cat.slug}`" class="flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap">
              {{ cat.name }}
              <ChevronDown class="w-3.5 h-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
            </NuxtLink>
            
            <!-- Mega Menu Dropdown -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block pt-2">
              <div class="bg-background border rounded-2xl shadow-2xl p-8 w-[750px] grid grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div v-for="sub in cat.subCategories" :key="sub" class="space-y-4">
                  <NuxtLink :to="`/category/${sub}`" class="font-bold text-xs uppercase tracking-widest block text-primary hover:translate-x-1 transition-transform">
                    {{ sub.replace(/-/g, ' ') }}
                  </NuxtLink>
                  <ul class="space-y-2 border-l border-muted pl-4">
                    <li v-for="product in getSubProducts(sub)" :key="product.id">
                      <NuxtLink :to="`/product/${product.slug}`" class="text-xs text-muted-foreground hover:text-primary transition-colors line-clamp-1 block">
                        {{ product.name }}
                      </NuxtLink>
                    </li>
                    <li v-if="getSubProducts(sub).length === 0">
                      <span class="text-[10px] text-muted-foreground italic uppercase tracking-tighter">Rolling out soon...</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!isScrolled" class="flex-grow"></div>
          <div :class="cn('flex items-center gap-6', isScrolled ? 'hidden xl:flex' : '')">
            <NuxtLink to="/offers" class="font-bold text-[10px] uppercase tracking-widest text-destructive hover:opacity-80 transition-opacity">Special Offers</NuxtLink>
            <NuxtLink to="/new-arrivals" class="font-bold text-[10px] uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">New Arrivals</NuxtLink>
            <NuxtLink to="/blog" class="font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Insights</NuxtLink>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingCart, Heart, Search, User, Menu, X, Sun, Moon, Monitor, ChevronDown, PackageSearch, Grid2X2, ShieldCheck } from 'lucide-vue-next';
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

const isSuperAdmin = computed(() => {
  if (!authStore.isLoggedIn || !authStore.user) return false;
  const email = (authStore.user.email || '').toLowerCase().trim();
  const role = (authStore.user.role || '').toLowerCase().trim();
  
  return role === 'admin' || 
         role === 'staff' || 
         role === 'super admin' || 
         role === 'superadmin' || 
         email === 'rkshaon.ist@gmail.com' ||
         email.includes('admin') ||
         email.includes('staff');
});
const productService = useProductService();
const allCategories = productService.getCategories();

// Filter for top-level categories
const categories = computed(() => allCategories.filter(c => !c.parentCategoryId));

// Helper to get category by slug
const getCategoryBySlug = (slug: string) => allCategories.find(c => c.slug === slug);

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
      <!-- Main Row -->
      <div class="flex items-center justify-between transition-all duration-500 gap-4 lg:gap-6">
        <!-- Logo -->
        <NuxtLink 
          to="/" 
          class="flex items-center gap-2 shrink-0 group transition-all duration-500"
        >
          <div :class="cn('bg-primary rounded-xl flex items-center justify-center transition-all duration-500', isScrolled ? 'w-8 h-8' : 'w-10 h-10')">
            <PackageSearch :class="cn('text-primary-foreground transition-all duration-500', isScrolled ? 'w-4 h-4' : 'w-6 h-6')" />
          </div>
          <span :class="cn('font-display font-extrabold tracking-tighter hidden sm:block transition-all duration-500', isScrolled ? 'text-lg' : 'text-xl')">
            Tech<span class="text-primary italic">Core</span>
          </span>
        </NuxtLink>

        <!-- Search Bar -->
        <div 
          :class="cn(
            'hidden md:flex relative group transition-all duration-500 ease-in-out shrink-0',
            isScrolled ? 'w-40 lg:w-48' : 'flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-12'
          )"
        >
          <input 
            type="text" 
            placeholder="Search items..." 
            :class="cn(
              'w-full bg-muted/50 border-input border rounded-full focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-500 outline-none',
              isScrolled ? 'h-8 text-[10px] px-8 pl-9' : 'h-11 text-sm px-12'
            )"
            @keyup.enter="navigateTo(`/products?q=${($event.target as HTMLInputElement).value}`)"
          />
          <Search :class="cn('absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-500', isScrolled ? 'w-3.5 h-3.5 left-3' : 'w-5 h-5')" />
        </div>

        <!-- Compact Navigation Menu (Visible only when scrolled) -->
        <nav 
          :class="cn(
            'hidden md:flex items-center gap-3 lg:gap-6 transition-all duration-500 ease-in-out overflow-hidden h-9 flex-1 justify-center',
            isScrolled 
              ? 'opacity-100 max-w-lg lg:max-w-xl translate-x-0 pointer-events-auto' 
              : 'opacity-0 max-w-0 -translate-x-4 pointer-events-none'
          )"
        >
          <NuxtLink to="/products" class="font-bold text-[10px] uppercase tracking-widest text-primary flex items-center gap-2 group whitespace-nowrap">
            <Grid2X2 class="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-500" />
            Catalog
          </NuxtLink>
          <div v-for="cat in categories" :key="cat.id" class="group relative h-full flex items-center">
            <NuxtLink :to="`/category/${cat.slug}`" class="flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.1em] hover:text-primary transition-colors whitespace-nowrap">
              {{ cat.name }}
              <ChevronDown class="w-3 h-3 text-muted-foreground group-hover:rotate-180 transition-transform duration-500 hidden lg:block" />
            </NuxtLink>
            
            <!-- Mega Menu Dropdown -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block pt-3 z-50">
              <div class="bg-background/95 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 w-[680px] grid grid-cols-3 gap-8 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top">
                <div v-for="subSlug in cat.subCategories" :key="subSlug" class="space-y-4">
                  <template v-if="getCategoryBySlug(subSlug)">
                    <NuxtLink :to="`/category/${subSlug}`" class="font-bold text-[10px] uppercase tracking-widest block text-primary hover:translate-x-1 transition-transform">
                      {{ getCategoryBySlug(subSlug)?.name }}
                    </NuxtLink>
                    <ul class="space-y-2 border-l border-muted pl-4">
                      <template v-if="getCategoryBySlug(subSlug)?.subCategories?.length">
                        <li v-for="subSubSlug in getCategoryBySlug(subSlug)?.subCategories" :key="subSubSlug">
                          <NuxtLink :to="`/category/${subSubSlug}`" class="text-[10px] uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors block whitespace-nowrap">
                            {{ getCategoryBySlug(subSubSlug)?.name || subSubSlug.replace(/-/g, ' ') }}
                          </NuxtLink>
                        </li>
                      </template>
                      <li v-else>
                        <span class="text-[10px] text-muted-foreground italic uppercase tracking-tighter opacity-50">Latest Models</span>
                      </li>
                    </ul>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-6 hidden xl:flex">
            <NuxtLink to="/offers" class="font-bold text-[10px] uppercase tracking-widest text-destructive hover:opacity-80 transition-opacity whitespace-nowrap">Offers</NuxtLink>
            <NuxtLink to="/blog" class="font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap">Insights</NuxtLink>
          </div>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0 transition-all duration-500">
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
          
          <!-- Admin Panel Button (Super Admin Exclusive) -->
          <NuxtLink 
            v-if="isSuperAdmin" 
            to="/admin" 
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 hover:bg-primary/10 border border-primary/20 text-primary rounded-full transition-all duration-300 hover:scale-[1.02] mr-1 shrink-0" 
            title="Admin Protocol System"
          >
            <ShieldCheck class="w-4 h-4" />
            <span class="text-[9px] font-extrabold uppercase tracking-widest">Admin</span>
          </NuxtLink>

          <!-- Mobile Admin Panel Button (Super Admin Exclusive, visible on small viewports) -->
          <NuxtLink 
            v-if="isSuperAdmin" 
            to="/admin" 
            class="sm:hidden p-2 hover:bg-primary/10 text-primary rounded-full transition-colors shrink-0" 
            title="Admin Protocol System"
          >
            <ShieldCheck class="w-5 h-5" />
          </NuxtLink>

          <NuxtLink :to="authStore.isLoggedIn ? '/account' : '/login'" class="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <div v-if="authStore.isLoggedIn && authStore.user" class="w-8 h-8 rounded-full overflow-hidden border border-border">
              <img :src="authStore.user.avatar" :alt="authStore.user.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="p-1">
              <User class="w-4 h-4 sm:w-5 h-5" />
            </div>
          </NuxtLink>

          <NuxtLink to="/wishlist" class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground">
            <Heart class="w-4 h-4 sm:w-5 h-5" />
            <span v-if="wishlistStore.wishlistCount > 0" class="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {{ wishlistStore.wishlistCount }}
            </span>
          </NuxtLink>

          <button @click="uiStore.toggleCart()" class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground">
            <ShoppingCart class="w-4 h-4 sm:w-5 h-5" />
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

      <!-- Collapsible Secondary Row (Visible only when not scrolled) -->
      <nav 
        :class="cn(
          'hidden md:flex items-center gap-6 overflow-hidden transition-all duration-500 ease-in-out',
          isScrolled 
            ? 'h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none' 
            : 'h-12 opacity-100 mt-4 pt-4 border-t border-border/50'
        )"
      >
        <NuxtLink to="/products" class="font-bold text-[10px] uppercase tracking-widest text-primary flex items-center gap-2 group whitespace-nowrap">
          <Grid2X2 class="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-500" />
          Catalog
        </NuxtLink>
        <div v-for="cat in categories" :key="cat.id" class="group relative h-full flex items-center">
          <NuxtLink :to="`/category/${cat.slug}`" class="flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.1em] hover:text-primary transition-colors whitespace-nowrap">
            {{ cat.name }}
            <ChevronDown class="w-3 h-3 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
          </NuxtLink>
          
          <!-- Mega Menu Dropdown -->
          <div class="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block pt-3 z-50">
            <div class="bg-background/95 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 w-[680px] grid grid-cols-3 gap-8 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top">
              <div v-for="subSlug in cat.subCategories" :key="subSlug" class="space-y-4">
                <template v-if="getCategoryBySlug(subSlug)">
                  <NuxtLink :to="`/category/${subSlug}`" class="font-bold text-[10px] uppercase tracking-widest block text-primary hover:translate-x-1 transition-transform">
                    {{ getCategoryBySlug(subSlug)?.name }}
                  </NuxtLink>
                  <ul class="space-y-2 border-l border-muted pl-4">
                    <template v-if="getCategoryBySlug(subSlug)?.subCategories?.length">
                      <li v-for="subSubSlug in getCategoryBySlug(subSlug)?.subCategories" :key="subSubSlug">
                        <NuxtLink :to="`/category/${subSubSlug}`" class="text-[10px] uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors block whitespace-nowrap">
                          {{ getCategoryBySlug(subSubSlug)?.name || subSubSlug.replace(/-/g, ' ') }}
                        </NuxtLink>
                      </li>
                    </template>
                    <li v-else>
                      <span class="text-[10px] text-muted-foreground italic uppercase tracking-tighter opacity-50">Latest Models</span>
                    </li>
                  </ul>
                </template>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex-grow"></div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/offers" class="font-bold text-[10px] uppercase tracking-widest text-destructive hover:opacity-80 transition-opacity whitespace-nowrap">Offers</NuxtLink>
          <NuxtLink to="/blog" class="font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap">Insights</NuxtLink>
        </div>
      </nav>
    </div>
  </header>
</template>

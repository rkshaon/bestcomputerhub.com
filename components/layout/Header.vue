<!-- File: /components/layout/Header.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Handbag, Search, User, Menu, X, Sun, Moon, Monitor, PackageSearch, Grid2X2, ShieldCheck, Home, Cpu, ArrowLeftRight, ChevronRight, ArrowRight, Tag, Sparkles, Zap, Clock } from 'lucide-vue-next';
import { cn } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useToast } from '@/composables/useToast';
import type { Category, Product } from '@/types';
import HeaderMegaMenu from '@/components/layout/HeaderMegaMenu.vue';
import HeaderUtilityBar from '@/components/layout/HeaderUtilityBar.vue';

const uiStore = useUIStore();
const cartStore = useCartStore();
const authStore = useAuthStore();
const productService = useProductService();
const categoryService = useCategoryService();
const { toastInfo } = useToast();
const route = useRoute();

// Expanded Search State
const isSearchExpanded = ref(false);
const searchQuery = ref('');
const searchResults = ref<Product[]>([]);
const isSearching = ref(false);
const searchContainerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const popularSearches = [
  'RTX 4090',
  'DDR5 RAM',
  'Intel Core i9',
  'Gaming Laptops',
  'NVMe SSD',
  'Monitors'
];

const openSearch = () => {
  isSearchExpanded.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const closeSearch = () => {
  isSearchExpanded.value = false;
  searchInputRef.value?.blur();
};

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    navigateTo(`/products?q=${encodeURIComponent(searchQuery.value.trim())}`);
    closeSearch();
  }
};

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newQuery) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  
  if (!newQuery.trim()) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  searchDebounceTimer = setTimeout(async () => {
    try {
      const res = await productService.getProductsList({
        search: newQuery.trim(),
        page_size: 6
      });
      searchResults.value = res.results || [];
    } catch (err) {
      console.error('Header search error:', err);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 250);
});

const handleCompareClick = () => {
  toastInfo('Product comparison coming soon!', {
    description: 'Select products on catalog pages to compare specifications.'
  });
};

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

// Load static fallback initially to prevent hydration mismatch
const initialAllCategories = productService.getCategories();
const allCategories = ref<Category[]>(initialAllCategories);
const categories = ref<Category[]>(initialAllCategories.filter(c => !c.parentCategoryId));

const isMenuLoading = ref(false);
const menuError = ref<string | null>(null);

const loadMenuCategories = async () => {
  isMenuLoading.value = true;
  menuError.value = null;
  try {
    const rootRes = await categoryService.getRootCategories();
    if (rootRes && rootRes.length) {
      categories.value = rootRes;
    }
    
    // Recursively collect all categories from root categories' children arrays to guarantee robust localized slug mapping and eliminate the redundant getCategoriesList call
    const collected: Category[] = [];
    const collectAllCategories = (list: Category[]) => {
      list.forEach(c => {
        if (!collected.some(existing => existing.id === c.id)) {
          collected.push(c);
        }
        if (c.children && c.children.length) {
          collectAllCategories(c.children);
        }
      });
    };
    
    if (categories.value && categories.value.length) {
      collectAllCategories(categories.value);
      allCategories.value = collected;
    }
  } catch (err: any) {
    menuError.value = err.message || 'Failed to sync categories.';
  } finally {
    isMenuLoading.value = false;
  }
};

const isScrolled = ref(false);

const handleScroll = () => {
  if (typeof window !== 'undefined') {
    isScrolled.value = window.scrollY > 20;
  }
};

onMounted(() => {
  loadMenuCategories();
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll);
  }
});

// Helper to get category by slug safely
const getCategoryBySlug = (slug: string) => allCategories.value.find(c => c.slug === slug);

// Helper to get sub-categories dynamically from either 'children' object list (real backend) or 'subCategories' key (mock)
const getSubCategories = (cat: Category): Category[] => {
  if (cat.children && Array.isArray(cat.children) && cat.children.length) {
    return cat.children;
  }
  
  if (cat.subCategories && Array.isArray(cat.subCategories)) {
    return cat.subCategories
      .map(slug => getCategoryBySlug(slug))
      .filter((c): c is Category => !!c);
  }
  
  return [];
};

const isThemeMenuOpen = ref(false);

const activeMegaMenuId = ref<string | null>(null);
let megaMenuTimer: ReturnType<typeof setTimeout> | null = null;

const openMegaMenu = (catId: string) => {
  if (megaMenuTimer) clearTimeout(megaMenuTimer);
  activeMegaMenuId.value = catId;
};

const closeMegaMenu = () => {
  megaMenuTimer = setTimeout(() => {
    activeMegaMenuId.value = null;
  }, 180);
};

const keepMegaMenuOpen = () => {
  if (megaMenuTimer) clearTimeout(megaMenuTimer);
};

if (process.client) {
  // Close theme menu & mega menu on click outside / escape
  const handleWindowClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      isThemeMenuOpen.value = false;
    }
    if (
      isSearchExpanded.value &&
      searchContainerRef.value &&
      !searchContainerRef.value.contains(e.target as Node)
    ) {
      closeSearch();
    }
  };

  const handleWindowKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      activeMegaMenuId.value = null;
      if (isSearchExpanded.value) {
        closeSearch();
      }
    }
  };

  window.addEventListener('click', handleWindowClick);
  window.addEventListener('keydown', handleWindowKeydown);

  onUnmounted(() => {
    window.removeEventListener('click', handleWindowClick);
    window.removeEventListener('keydown', handleWindowKeydown);
  });
}
</script>

<template>
  <header 
    :class="cn(
      'sticky top-0 z-50 w-full border-b py-0 sm:py-1 transition-colors transition-shadow duration-300',
      isScrolled 
        ? 'bg-card border-border shadow-md' 
        : 'bg-background border-border/50 shadow-sm'
    )"
  >
    <div 
      :class="cn(
        'grid transition-all duration-300 ease-in-out overflow-hidden',
        isScrolled ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'
      )"
    >
      <div class="min-h-0">
        <HeaderUtilityBar />
      </div>
    </div>

    <div 
      ref="searchContainerRef" 
      :class="cn(
        'container mx-auto px-4 relative py-2 sm:py-2.5 flex items-center justify-between gap-3 md:gap-0',
        !isSearchExpanded && 'md:grid md:grid-cols-[auto_1fr] md:gap-x-5 lg:gap-x-6'
      )"
    >
      <!-- Spanning Brand Logo (Spans Row 1 Search + Row 2 Category Nav on Desktop) -->
      <NuxtLink 
        to="/" 
        :class="cn(
          'flex items-center justify-center shrink-0 group transition-all duration-300',
          !isSearchExpanded && 'md:col-start-1 md:row-start-1 md:row-span-2 md:self-center pr-2 lg:pr-3'
        )"
        aria-label="Best Computer Hub Home"
        @click="closeSearch"
      >
        <UiBrandLogo 
          size="lg" 
          :show-text="false" 
          :img-class="cn(
            'object-contain transition-all duration-300 group-hover:scale-105 shrink-0',
            isSearchExpanded 
              ? 'h-9 w-auto md:h-11' 
              : 'h-9 w-auto md:h-[80px] lg:h-[84px] max-h-[86px]'
          )"
        />
      </NuxtLink>

      <!-- Main Row -->
      <div 
        :class="cn(
          'flex items-center justify-between gap-3 sm:gap-4 md:gap-6 group/mainheader flex-1 min-w-0',
          !isSearchExpanded && 'md:col-start-2 md:row-start-1'
        )"
      >
        <!-- Search Bar -->
        <div 
          :class="cn(
            'hidden md:flex relative group flex-1 min-w-0 transition-all duration-300 ease-in-out',
            isSearchExpanded ? 'z-50' : ''
          )"
        >
          <input 
            ref="searchInputRef"
            v-model="searchQuery"
            type="text" 
            :placeholder="isSearchExpanded ? 'Search products, brands or models...' : 'Search items...'" 
            role="combobox"
            :aria-expanded="isSearchExpanded"
            aria-autocomplete="list"
            aria-label="Search items"
            :class="cn(
              'w-full bg-muted/50 border rounded-full outline-none h-11 text-sm px-12 transition-all duration-200',
              isSearchExpanded 
                ? 'bg-background border-primary/50 shadow-md ring-2 ring-primary/20' 
                : 'border-input focus:bg-background focus:ring-2 focus:ring-primary/20'
            )"
            @focus="openSearch"
            @keyup.enter="handleSearchSubmit"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary w-5 h-5 transition-colors" />
          <button 
            v-if="searchQuery && isSearchExpanded" 
            type="button" 
            @click="searchQuery = ''; searchInputRef?.focus()"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted"
            aria-label="Clear search text"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Normal Header Actions (Hidden when Search is Expanded) -->
        <div v-if="!isSearchExpanded" class="flex items-center gap-1 sm:gap-2 shrink-0 transition-opacity duration-200">
          <!-- Theme Dropdown -->
          <div 
            :class="cn(
              'relative theme-dropdown transition-opacity duration-200',
              isThemeMenuOpen
                ? 'opacity-100 pointer-events-auto'
                : 'sm:opacity-0 sm:pointer-events-none sm:group-hover/mainheader:opacity-100 sm:group-hover/mainheader:pointer-events-auto sm:group-focus-within/mainheader:opacity-100 sm:group-focus-within/mainheader:pointer-events-auto'
            )"
          >
            <button 
              @click="isThemeMenuOpen = !isThemeMenuOpen" 
              class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center"
              aria-label="Toggle theme"
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

          <!-- Promotional Actions (Offers, New Arrivals, Flash Sale, Happy Hours) -->
          <div class="hidden lg:flex items-center gap-1.5 shrink-0">
            <!-- Offers -->
            <NuxtLink 
              to="/offers" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-semibold transition-all shrink-0 group"
              title="Offers"
              aria-label="Offers"
            >
              <Tag class="w-3.5 h-3.5 text-destructive shrink-0 transition-transform group-hover:rotate-12" />
              <span>Offers</span>
            </NuxtLink>

            <!-- New Arrivals -->
            <NuxtLink 
              to="/new-arrivals" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-amber-500/40 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 text-xs font-semibold transition-all shrink-0"
              title="New Arrivals"
              aria-label="New Arrivals"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>New Arrivals</span>
            </NuxtLink>

            <!-- Flash Sale -->
            <NuxtLink 
              to="/offers" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs font-semibold transition-all shrink-0"
              title="Flash Sale"
              aria-label="Flash Sale"
            >
              <Zap class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Flash Sale</span>
            </NuxtLink>

            <!-- Happy Hours -->
            <NuxtLink 
              to="/offers" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-sky-500/40 hover:bg-sky-500/10 text-muted-foreground hover:text-sky-500 text-xs font-semibold transition-all shrink-0"
              title="Happy Hours"
              aria-label="Happy Hours"
            >
              <Clock class="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Happy Hours</span>
            </NuxtLink>
          </div>

          <!-- PC Builder -->
          <NuxtLink 
            to="/products"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            title="PC Builder"
            aria-label="PC Builder"
          >
            <Cpu class="w-4 h-4 text-primary shrink-0" />
            <span>PC Builder</span>
          </NuxtLink>

          <!-- Compare -->
          <button 
            @click="handleCompareClick"
            type="button"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0 cursor-pointer"
            title="Compare products"
            aria-label="Compare products"
          >
            <ArrowLeftRight class="w-4 h-4 text-primary shrink-0" />
            <span>Compare</span>
          </button>

          <!-- Bag (Cart) -->
          <button 
            @click="uiStore.toggleCart()" 
            class="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground hover:text-foreground shrink-0"
            title="Shopping Bag"
            aria-label="Cart"
          >
            <Handbag class="w-5 h-5" />
            <span 
              v-if="cartStore.totalItems > 0" 
              class="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cartStore.totalItems }}
            </span>
          </button>

          <button @click="uiStore.toggleMobileMenu()" class="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
            <Menu v-if="!uiStore.isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>

        <!-- Cancel Action (Shown when Search is Expanded) -->
        <div v-else class="hidden md:flex items-center shrink-0 z-50">
          <button 
            type="button" 
            @click="closeSearch"
            class="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-full hover:bg-accent border border-border/50 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Expanded Search Results / Suggestions Panel -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-[0.99]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-[0.99]"
      >
        <div 
          v-if="isSearchExpanded" 
          class="hidden md:block absolute top-full left-4 right-4 z-50 mt-2 bg-background/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden space-y-4 max-h-[75vh] overflow-y-auto"
        >
          <!-- Popular Searches when query is empty -->
          <div v-if="!searchQuery.trim()" class="space-y-4">
            <div class="space-y-2">
              <p class="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Popular Searches
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in popularSearches"
                  :key="tag"
                  type="button"
                  @click="searchQuery = tag; searchInputRef?.focus()"
                  class="px-3.5 py-1.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/40 text-xs font-semibold transition-all cursor-pointer"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div class="border-t border-border/50 pt-3 space-y-2">
              <p class="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Explore Top Categories
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <NuxtLink
                  v-for="cat in categories.slice(0, 4)"
                  :key="cat.id"
                  :to="categoryService.getCategoryUrl(cat, allCategories)"
                  @click="closeSearch"
                  class="p-2.5 rounded-xl bg-muted/40 hover:bg-accent border border-border/30 hover:border-primary/30 transition-all text-xs font-bold text-foreground hover:text-primary flex items-center justify-between group"
                >
                  <span class="truncate">{{ cat.name }}</span>
                  <ChevronRight class="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Live Search Results when query typed -->
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between border-b border-border/40 pb-2.5">
              <p class="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Matching Catalog Products
              </p>
              <button
                type="button"
                @click="handleSearchSubmit"
                class="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all results</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="isSearching" class="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
              <span class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              <span>Searching catalog database...</span>
            </div>

            <div v-else-if="searchResults.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink
                v-for="product in searchResults"
                :key="product.id"
                :to="`/product/${product.slug}`"
                @click="closeSearch"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent border border-transparent hover:border-border/60 transition-all group"
              >
                <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                  <img :src="product.images[0]" :alt="product.name" class="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {{ product.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs font-extrabold text-primary">${{ product.price }}</span>
                    <span v-if="product.brand" class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {{ product.brand }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <div v-else class="py-8 text-center space-y-1">
              <p class="text-xs font-medium text-muted-foreground">
                No matching products found for "<span class="font-bold text-foreground">{{ searchQuery }}</span>"
              </p>
              <p class="text-[11px] text-muted-foreground/80">
                Try searching for GPU models, processors, RAM modules, or brand names.
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Category Navigation Row (Hidden when Search is Expanded) -->
      <nav v-if="!isSearchExpanded" class="hidden md:flex relative items-center justify-between gap-2 w-full flex-nowrap h-9 overflow-visible opacity-100 mt-2.5 pt-2 border-t border-border/50 md:col-start-2 md:row-start-2">
        <!-- Static Home Link -->
        <NuxtLink 
          to="/" 
          aria-label="Home"
          title="Home"
          :class="cn(
            'relative flex items-center justify-center font-semibold text-xs lg:text-[13px] tracking-normal transition-colors whitespace-nowrap py-1.5 px-1 hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:transition-all after:duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs',
            route.path === '/' ? 'text-primary font-bold after:opacity-100' : 'text-foreground/85 after:opacity-0 hover:after:opacity-100'
          )"
        >
          <Home class="w-4 h-4" />
        </NuxtLink>

        <div 
          v-for="(cat, index) in categories" 
          :key="cat.id" 
          class="group relative h-full flex items-center shrink-0"
          @mouseenter="openMegaMenu(cat.id)"
          @mouseleave="closeMegaMenu"
          @focusin="openMegaMenu(cat.id)"
          @focusout="closeMegaMenu"
        >
          <NuxtLink 
            :to="categoryService.getCategoryUrl(cat, allCategories)" 
            :class="cn(
              'relative flex items-center font-semibold text-xs lg:text-[13px] tracking-normal transition-colors whitespace-nowrap py-1.5 px-0.5 hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:transition-all after:duration-200',
              activeMegaMenuId === cat.id ? 'text-primary font-bold after:opacity-100' : 'text-foreground/85 after:opacity-0 hover:after:opacity-100'
            )"
          >
            {{ cat.name }}
          </NuxtLink>
          
          <!-- Mega Menu Dropdown -->
          <HeaderMegaMenu 
            :category="cat" 
            :all-categories="allCategories"
            :is-open="activeMegaMenuId === cat.id"
            :align-right="index >= categories.length / 2"
            @keep-open="keepMegaMenuOpen"
            @close="closeMegaMenu"
          />
        </div>
      </nav>
    </div>

    <!-- Backdrop Overlay for Expanded Search -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isSearchExpanded" 
        class="fixed inset-0 bg-background/60 backdrop-blur-xs z-40 top-[56px] sm:top-[64px]"
        @click="closeSearch"
      />
    </transition>

    <!-- Mobile Navigation Drawer representing the full Taxonomy hierarchy dynamically fetched -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div 
        v-if="uiStore.isMobileMenuOpen" 
        class="md:hidden absolute top-full left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border flex flex-col p-6 space-y-6 max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <!-- Mobile Search -->
        <div class="relative group">
          <input 
            type="text" 
            placeholder="Search items..." 
            class="w-full bg-muted/50 border border-input rounded-full h-10 text-xs px-10 outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-300"
            @keyup.enter="navigateTo(`/products?q=${($event.target as HTMLInputElement).value}`); uiStore.closeMobileMenu()"
          />
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        <!-- Navigation Menu Hierarchy -->
        <div class="flex flex-col space-y-4">
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">
            Technical Categories
          </div>
          
          <NuxtLink 
            to="/products" 
            class="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2"
            @click="uiStore.closeMobileMenu()"
          >
            <Grid2X2 class="w-4 h-4 text-primary" />
            Full Catalog
          </NuxtLink>

          <!-- Dynamic Loader -->
          <div v-if="isMenuLoading" class="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span class="animate-spin border-2 border-primary/30 border-t-primary rounded-full w-4 h-4"></span>
            Synchronizing Nodes...
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="cat in categories" :key="cat.id" class="space-y-2">
              <NuxtLink 
                :to="categoryService.getCategoryUrl(cat, allCategories)" 
                class="font-bold text-xs uppercase tracking-wider block hover:text-primary transition-colors"
                @click="uiStore.closeMobileMenu()"
              >
                {{ cat.name }}
              </NuxtLink>
              
              <!-- Subcategories simple mapping -->
              <ul v-if="getSubCategories(cat).length" class="pl-4 border-l border-border/60 space-y-1.5 py-1">
                <li v-for="subCat in getSubCategories(cat)" :key="subCat.id">
                  <NuxtLink 
                    :to="categoryService.getCategoryUrl(subCat, allCategories)" 
                    class="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary block"
                    @click="uiStore.closeMobileMenu()"
                  >
                    {{ subCat.name }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Secondary Support / Corporate Links -->
        <div class="space-y-3 pt-4 border-t border-border/50">
          <NuxtLink 
            :to="authStore.isLoggedIn ? '/account' : '/login'" 
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <User class="w-4 h-4 text-primary" />
            <span>{{ authStore.isLoggedIn ? (authStore.user?.name || 'Account') : 'Hello, Login' }}</span>
          </NuxtLink>
          <NuxtLink 
            to="/products" 
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <Cpu class="w-4 h-4 text-primary" />
            <span>PC Builder</span>
          </NuxtLink>
          <button 
            @click="handleCompareClick(); uiStore.closeMobileMenu()" 
            type="button"
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors w-full text-left cursor-pointer"
          >
            <ArrowLeftRight class="w-4 h-4 text-primary" />
            <span>Compare</span>
          </button>
          <NuxtLink 
            to="/offers" 
            class="font-bold text-xs uppercase tracking-widest text-destructive flex items-center gap-2 hover:translate-x-1 transition-transform"
            @click="uiStore.closeMobileMenu()"
          >
            <Tag class="w-4 h-4 text-destructive" />
            <span>Offers</span>
          </NuxtLink>
          <NuxtLink 
            to="/new-arrivals" 
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-amber-500 transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span>New Arrivals</span>
          </NuxtLink>
          <NuxtLink 
            to="/offers" 
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <Zap class="w-4 h-4 text-primary" />
            <span>Flash Sale</span>
          </NuxtLink>
          <NuxtLink 
            to="/offers" 
            class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-sky-500 transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <Clock class="w-4 h-4 text-sky-500" />
            <span>Happy Hours</span>
          </NuxtLink>
          <NuxtLink 
            to="/blog" 
            class="font-bold text-xs uppercase tracking-widest block hover:text-primary hover:translate-x-1 transition-all duration-300"
            @click="uiStore.closeMobileMenu()"
          >
            Tech Insights
          </NuxtLink>
        </div>
      </div>
    </transition>
  </header>
</template>


<!-- File: /components/layout/Header.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { Handbag, Search, User, Menu, X, Sun, Moon, Monitor, PackageSearch, Grid2X2, ShieldCheck, Home, Cpu, ArrowLeftRight, ChevronRight, ChevronDown, ArrowRight, Tag, Sparkles, Zap, Clock } from 'lucide-vue-next';
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

// Mobile Category Drawer Accordion State
const openMobileCategoryIds = ref<string[]>([]);
const toggleMobileCategory = async (catId: string) => {
  if (openMobileCategoryIds.value.includes(catId)) {
    openMobileCategoryIds.value = openMobileCategoryIds.value.filter(id => id !== catId);
  } else {
    openMobileCategoryIds.value.push(catId);
    const cat = categories.value.find(c => String(c.id) === String(catId)) || allCategories.value.find(c => String(c.id) === String(catId));
    if (cat && cat.has_children !== false && !categoryService.hasChildrenLoaded(catId)) {
      await categoryService.getCategoryChildrenBatch([catId]);
    }
  }
};

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

const debouncedSearchQuery = refDebounced(searchQuery, 300);

watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = [];
    isSearching.value = false;
  } else {
    isSearching.value = true;
  }
});

watch(debouncedSearchQuery, async (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
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
});

const handleCompareClick = () => {
  toastInfo('Product comparison coming soon!', {
    description: 'Select products on catalog pages to compare specifications.'
  });
};

const isSuperAdmin = computed(() => {
  return authStore.isAdmin;
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
    const rootRes = await categoryService.getRootCategories({ page: 1 });
    if (rootRes && rootRes.length > 0) {
      // Collect root category IDs that have children
      const rootIdsWithChildren = rootRes
        .filter(c => c.has_children !== false)
        .map(c => c.id);

      // Batched request for direct children across all root categories in a single call
      let childrenList: Category[] = [];
      if (rootIdsWithChildren.length > 0) {
        childrenList = await categoryService.getCategoryChildrenBatch(rootIdsWithChildren);
      }

      // Map direct children to their respective root parent categories by category ID or slug
      const enrichedRoots: Category[] = rootRes.map(root => {
        let directChildren = categoryService.getChildrenForParent(root.id);
        if (directChildren.length === 0 && root.slug) {
          directChildren = categoryService.getChildrenForParent(root.slug);
        }
        if (directChildren.length === 0) {
          directChildren = childrenList.filter(
            child => String(child.parentCategoryId) === String(root.id) || (root.slug && child.parentCategoryId === root.slug)
          );
        }
        if (directChildren.length > 0) {
          categoryService.storeChildrenInCache(root.id, directChildren);
          if (root.slug && root.slug !== root.id) {
            categoryService.storeChildrenInCache(root.slug, directChildren);
          }
        }
        return {
          ...root,
          children: directChildren.length > 0 ? directChildren : root.children
        };
      });

      categories.value = enrichedRoots;

      // Combine root categories and their direct children for global lookup and routing
      const combined = [...enrichedRoots];
      childrenList.forEach(child => {
        if (!combined.some(c => String(c.id) === String(child.id))) combined.push(child);
      });
      allCategories.value = combined;
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

// Helper to get category by slug safely
const getCategoryBySlug = (slug: string) => allCategories.value.find(c => c.slug === slug);

// Helper to check if a category has child categories using has_children or children arrays
const hasChildren = (cat: Category): boolean => {
  if (typeof cat.has_children === 'boolean') {
    return cat.has_children;
  }
  return getSubCategories(cat).length > 0;
};

// Helper to get sub-categories dynamically from cached children state or 'children' object list
const getSubCategories = (cat: Category): Category[] => {
  if (!cat) return [];

  const cached = categoryService.getChildrenForParent(cat.id);
  if (cached && cached.length > 0) {
    return cached;
  }

  if (cat.slug) {
    const cachedBySlug = categoryService.getChildrenForParent(cat.slug);
    if (cachedBySlug && cachedBySlug.length > 0) {
      return cachedBySlug;
    }
  }

  if (cat.children && Array.isArray(cat.children) && cat.children.length) {
    return cat.children;
  }
  
  if (cat.subCategories && Array.isArray(cat.subCategories)) {
    const list = allCategories.value || [];
    const matched = cat.subCategories
      .map(idOrSlug => list.find(c => c.id === idOrSlug || c.slug === idOrSlug))
      .filter((c): c is Category => !!c);
    if (matched.length > 0) return matched;
  }

  if (allCategories.value && allCategories.value.length > 0) {
    const matches = allCategories.value.filter(
      c => c.id !== cat.id && (String(c.parentCategoryId) === String(cat.id) || c.parentCategoryId === cat.slug)
    );
    if (matches.length > 0) return matches;
  }
  
  return [];
};

const isThemeMenuOpen = ref(false);

const activeMegaMenuId = ref<string | null>(null);
let megaMenuTimer: ReturnType<typeof setTimeout> | null = null;

const openMegaMenu = async (catId: string | number) => {
  if (megaMenuTimer) {
    clearTimeout(megaMenuTimer);
    megaMenuTimer = null;
  }
  const catIdStr = String(catId);
  const cleanId = catIdStr.startsWith('more-') ? catIdStr.replace('more-', '') : catIdStr;
  activeMegaMenuId.value = catIdStr;

  const cat = categories.value.find(c => String(c.id) === cleanId) || allCategories.value.find(c => String(c.id) === cleanId);
  const childrenAtHover = categoryService.getChildrenForParent(cleanId);

  console.log(`[MEGA HOVER DEBUG]\nCategory: ${cat?.name || 'Unknown'}\nID: ${cleanId}\nChildren count: ${childrenAtHover.length}\nChildren:`, childrenAtHover);

  if (cat && cat.has_children !== false) {
    const isLoaded = categoryService.hasChildrenLoaded(cleanId) || (cat.slug ? categoryService.hasChildrenLoaded(cat.slug) : false);
    if (!isLoaded) {
      await categoryService.getCategoryChildrenBatch([cleanId]);
      const childrenPostFetch = categoryService.getChildrenForParent(cleanId);
      console.log(`[MEGA HOVER DEBUG] (post-fetch)\nCategory: ${cat?.name || 'Unknown'}\nID: ${cleanId}\nChildren count: ${childrenPostFetch.length}\nChildren:`, childrenPostFetch);
    }
  }
};

const closeMegaMenu = () => {
  if (megaMenuTimer) {
    clearTimeout(megaMenuTimer);
  }
  megaMenuTimer = setTimeout(() => {
    activeMegaMenuId.value = null;
    megaMenuTimer = null;
  }, 200);
};

const keepMegaMenuOpen = () => {
  if (megaMenuTimer) {
    clearTimeout(megaMenuTimer);
    megaMenuTimer = null;
  }
};

// ==========================================
// Adaptive Desktop Navigation System
// ==========================================
const navRef = ref<HTMLElement | null>(null);
const measureContainerRef = ref<HTMLElement | null>(null);
const measureHomeRef = ref<HTMLElement | null>(null);
const measureMoreRef = ref<HTMLElement | null>(null);
const measureItemRefs = ref<HTMLElement[]>([]);

const visibleCount = ref<number>(categories.value.length);
const isNavCompact = ref(false);
const isNavUltraCompact = ref(false);

const setMeasureItemRef = (el: any, index: number) => {
  if (el) {
    measureItemRefs.value[index] = (el as any).$el || el;
  }
};

const visibleCategories = computed(() => {
  if (visibleCount.value >= categories.value.length) {
    return categories.value;
  }
  return categories.value.slice(0, visibleCount.value);
});

const overflowCategories = computed(() => {
  if (visibleCount.value >= categories.value.length) {
    return [];
  }
  return categories.value.slice(visibleCount.value);
});

// Calculate how many categories fit in the desktop nav bar dynamically
const updateAdaptiveNav = () => {
  if (!navRef.value) return;

  const availableWidth = navRef.value.clientWidth;
  if (availableWidth <= 0) return;

  // Determine compactness based on available container width
  if (availableWidth < 680) {
    isNavCompact.value = true;
    isNavUltraCompact.value = true;
  } else if (availableWidth < 920) {
    isNavCompact.value = true;
    isNavUltraCompact.value = false;
  } else {
    isNavCompact.value = false;
    isNavUltraCompact.value = false;
  }

  // Outer gap between [Home], [Categories Container], and [More]
  const outerGap = isNavUltraCompact.value ? 8 : (isNavCompact.value ? 12 : 16);
  // Minimum padding/spacing required per item in categories container
  const minItemGap = isNavUltraCompact.value ? 4 : (isNavCompact.value ? 6 : 8);

  const homeWidth = measureHomeRef.value?.offsetWidth || 32;
  const moreWidth = measureMoreRef.value?.offsetWidth || 75;

  const itemWidths = categories.value.map((_, idx) => {
    const el = measureItemRefs.value[idx];
    return el ? el.offsetWidth : 90;
  });

  const totalItemsWidth = itemWidths.reduce((a, b) => a + b, 0);

  // Space needed if ALL categories fit without "More" button
  const totalSpaceNeededForAll = homeWidth + outerGap + totalItemsWidth + Math.max(0, categories.value.length - 1) * minItemGap;

  if (totalSpaceNeededForAll <= availableWidth) {
    // All categories fit! No "More" menu needed.
    visibleCount.value = categories.value.length;
  } else {
    // Overflow occurs: calculate space available inside the Categories container
    const spaceForCategoryContainer = availableWidth - homeWidth - moreWidth - (2 * outerGap);

    let fitCount = 0;
    let accumulatedWidth = 0;

    for (let i = 0; i < itemWidths.length; i++) {
      const itemW = itemWidths[i] ?? 90;
      const minGapNeeded = i === 0 ? 0 : minItemGap;
      if (accumulatedWidth + minGapNeeded + itemW <= spaceForCategoryContainer) {
        accumulatedWidth += minGapNeeded + itemW;
        fitCount++;
      } else {
        break;
      }
    }

    visibleCount.value = Math.max(1, Math.min(fitCount, categories.value.length - 1));
  }
};

// "More" Dropdown State & Handlers
const isMoreOpen = ref(false);
let moreHoverTimer: ReturnType<typeof setTimeout> | null = null;

const openMoreDropdown = () => {
  if (moreHoverTimer) clearTimeout(moreHoverTimer);
  isMoreOpen.value = true;
};

const closeMoreDropdown = () => {
  moreHoverTimer = setTimeout(() => {
    isMoreOpen.value = false;
  }, 180);
};

const keepMoreOpen = () => {
  if (moreHoverTimer) clearTimeout(moreHoverTimer);
};

// ResizeObserver setup
let navResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  loadMenuCategories();
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  if (typeof window !== 'undefined') {
    nextTick(() => {
      updateAdaptiveNav();

      if ('ResizeObserver' in window && navRef.value) {
        navResizeObserver = new ResizeObserver(() => {
          updateAdaptiveNav();
        });
        navResizeObserver.observe(navRef.value);
      }
    });
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll);
  }
  if (navResizeObserver) {
    navResizeObserver.disconnect();
    navResizeObserver = null;
  }
});

watch([categories, isSearchExpanded], () => {
  nextTick(() => {
    updateAdaptiveNav();
  });
});

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
    if (!target.closest('.group\\/more') && !target.closest('.group\\/moreitem')) {
      isMoreOpen.value = false;
    }
  };

  const handleWindowKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      activeMegaMenuId.value = null;
      isMoreOpen.value = false;
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
        'container mx-auto px-4 relative py-2 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0',
        !isSearchExpanded && 'md:grid md:grid-cols-[auto_1fr] md:gap-x-5 lg:gap-x-6'
      )"
    >
      <!-- Mobile Row 1 (< md): [ Menu Toggle ] [ Brand Logo ] [ Theme & Bag ] -->
      <div class="flex md:hidden items-center justify-between w-full gap-2 py-0.5">
        <button 
          @click="uiStore.toggleMobileMenu()" 
          class="p-2 hover:bg-accent rounded-full transition-colors shrink-0 text-foreground"
          aria-label="Toggle navigation menu"
        >
          <Menu v-if="!uiStore.isMobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>

        <NuxtLink 
          to="/" 
          class="flex items-center justify-center shrink-0 group transition-all duration-300"
          aria-label="Best Computer Hub Home"
          @click="closeSearch"
        >
          <UiBrandLogo 
            size="lg" 
            :show-text="false" 
            img-class="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105 shrink-0"
          />
        </NuxtLink>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Theme Toggle -->
          <button 
            @click="isThemeMenuOpen = !isThemeMenuOpen" 
            class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center"
            aria-label="Toggle theme"
          >
            <Sun v-if="uiStore.themeMode === 'light'" class="w-5 h-5" />
            <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-5 h-5" />
            <Monitor v-else class="w-5 h-5" />
          </button>

          <!-- Shopping Bag -->
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
        </div>
      </div>

      <!-- Mobile Row 2 (< md): Real Mobile Search Input Bar -->
      <div class="w-full relative md:hidden pb-1">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search products, brands or models..." 
          role="combobox"
          :aria-expanded="isSearchExpanded"
          aria-autocomplete="list"
          aria-label="Search items"
          class="w-full bg-muted/60 border border-input focus:border-primary/50 rounded-full outline-none h-10 text-xs px-10 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-medium"
          @focus="openSearch"
          @keyup.enter="handleSearchSubmit"
        />
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <button 
          v-if="searchQuery" 
          type="button" 
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted"
          aria-label="Clear search text"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Desktop Spanning Brand Logo (md: and up) -->
      <NuxtLink 
        to="/" 
        :class="cn(
          'hidden md:flex items-center justify-center shrink-0 group transition-all duration-300',
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

      <!-- Desktop Main Row (md: and up) -->
      <div 
        :class="cn(
          'hidden md:flex items-center justify-between gap-3 sm:gap-4 md:gap-6 group/mainheader flex-1 min-w-0',
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

          <button @click="uiStore.toggleMobileMenu()" class="md:hidden p-2 hover:bg-accent rounded-full transition-colors" title="Toggle navigation menu" aria-label="Toggle navigation menu">
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
          class="absolute top-full left-2 right-2 md:left-4 md:right-4 z-50 mt-1 sm:mt-2 bg-background/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden space-y-4 max-h-[75vh] overflow-y-auto"
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
      <nav 
        v-if="!isSearchExpanded" 
        ref="navRef"
        :class="cn(
          'hidden md:flex relative items-center justify-between w-full flex-nowrap h-9 overflow-visible opacity-100 mt-2.5 pt-2 border-t border-border/50 md:col-start-2 md:row-start-2 transition-all duration-200',
          isNavUltraCompact ? 'gap-2' : (isNavCompact ? 'gap-3' : 'gap-4')
        )"
      >
        <!-- Static Home Link -->
        <NuxtLink 
          to="/" 
          aria-label="Home"
          title="Home"
          :class="cn(
            'relative flex items-center justify-center font-semibold tracking-normal transition-colors whitespace-nowrap py-1.5 px-1 hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:transition-all after:duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs',
            isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]'),
            route.path === '/' ? 'text-primary font-bold after:opacity-100' : 'text-foreground/85 after:opacity-0 hover:after:opacity-100'
          )"
        >
          <Home class="w-4 h-4" />
        </NuxtLink>

        <!-- Categories Flexible Container (Grows to occupy all remaining horizontal space) -->
        <div class="flex-1 flex items-center justify-between min-w-0 h-full">
          <div 
            v-for="(cat, index) in visibleCategories" 
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
                'relative flex items-center font-semibold tracking-normal transition-colors whitespace-nowrap py-1.5 px-0.5 hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:transition-all after:duration-200',
                isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]'),
                activeMegaMenuId === String(cat.id) ? 'text-primary font-bold after:opacity-100' : 'text-foreground/85 after:opacity-0 hover:after:opacity-100'
              )"
            >
              {{ cat.name }}
            </NuxtLink>
            
            <!-- Mega Menu Dropdown -->
            <HeaderMegaMenu 
              :category="cat" 
              :all-categories="allCategories"
              :is-open="activeMegaMenuId === String(cat.id)"
              :align-right="index >= visibleCategories.length / 2"
              @keep-open="keepMegaMenuOpen"
              @close="closeMegaMenu"
            />
          </div>
        </div>

        <!-- Dynamic "More" Dropdown Button (Only shown when overflowCategories exists) -->
        <div 
          v-if="overflowCategories.length > 0"
          class="group/more relative h-full flex items-center shrink-0"
          @mouseenter="openMoreDropdown"
          @mouseleave="closeMoreDropdown"
          @focusin="openMoreDropdown"
          @focusout="closeMoreDropdown"
        >
          <button
            type="button"
            :class="cn(
              'relative flex items-center gap-1 font-semibold transition-colors whitespace-nowrap py-1.5 px-1.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md cursor-pointer',
              isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]'),
              isMoreOpen || (typeof activeMegaMenuId === 'string' && activeMegaMenuId.startsWith('more-')) ? 'text-primary font-bold' : 'text-foreground/85'
            )"
            :aria-expanded="isMoreOpen"
            aria-label="More categories"
          >
            <span>More</span>
            <ChevronDown :class="cn('w-3.5 h-3.5 transition-transform duration-200', isMoreOpen ? 'rotate-180 text-primary' : 'text-muted-foreground')" />
          </button>

          <!-- More Categories Dropdown Menu -->
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div 
              v-if="isMoreOpen"
              class="absolute top-full right-0 mt-1 min-w-[200px] max-w-[260px] bg-background/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5"
              @mouseenter="keepMoreOpen"
              @mouseleave="closeMoreDropdown"
            >
              <div 
                v-for="cat in overflowCategories" 
                :key="cat.id"
                class="group/moreitem relative"
                @mouseenter="openMegaMenu('more-' + cat.id)"
                @mouseleave="closeMegaMenu"
              >
                <NuxtLink
                  :to="categoryService.getCategoryUrl(cat, allCategories)"
                  :class="cn(
                    'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    activeMegaMenuId === 'more-' + cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80 text-foreground/90 hover:text-primary'
                  )"
                  @click="isMoreOpen = false; activeMegaMenuId = null"
                >
                  <span class="truncate">{{ cat.name }}</span>
                  <ChevronRight v-if="hasChildren(cat)" class="w-3.5 h-3.5 text-muted-foreground group-hover/moreitem:text-primary shrink-0 ml-2" />
                </NuxtLink>

                <!-- Nested Mega Menu for overflow items -->
                <HeaderMegaMenu 
                  v-if="hasChildren(cat)"
                  :category="cat" 
                  :all-categories="allCategories"
                  :is-open="activeMegaMenuId === 'more-' + cat.id"
                  :level="2"
                  :flyout-left="true"
                  @keep-open="keepMegaMenuOpen"
                  @close="closeMegaMenu"
                />
              </div>
            </div>
          </transition>
        </div>
      </nav>

      <!-- Offscreen Measurement Container -->
      <div 
        ref="measureContainerRef" 
        class="absolute top-0 left-0 -z-50 pointer-events-none opacity-0 invisible flex items-center flex-nowrap"
        :class="isNavUltraCompact ? 'gap-1' : (isNavCompact ? 'gap-1.5' : 'gap-2.5')"
        aria-hidden="true"
      >
        <div ref="measureHomeRef" class="py-1.5 px-1 font-semibold" :class="isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]')">
          <Home class="w-4 h-4" />
        </div>

        <div 
          v-for="(cat, idx) in categories" 
          :key="cat.id"
          :ref="el => setMeasureItemRef(el, idx)"
          class="font-semibold py-1.5 px-0.5 whitespace-nowrap"
          :class="isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]')"
        >
          {{ cat.name }}
        </div>

        <div ref="measureMoreRef" class="font-semibold py-1.5 px-1.5 flex items-center gap-1 whitespace-nowrap" :class="isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]')">
          <span>More</span>
          <ChevronDown class="w-3.5 h-3.5" />
        </div>
      </div>
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
          
          <div v-else class="space-y-3">
            <div v-for="cat in categories" :key="cat.id" class="border-b border-border/40 pb-2">
              <div class="flex items-center justify-between">
                <NuxtLink 
                  :to="categoryService.getCategoryUrl(cat, allCategories)" 
                  class="font-bold text-xs uppercase tracking-wider block hover:text-primary transition-colors py-1"
                  @click="uiStore.closeMobileMenu()"
                >
                  {{ cat.name }}
                </NuxtLink>

                <button 
                  v-if="hasChildren(cat)"
                  type="button"
                  @click="toggleMobileCategory(cat.id)"
                  class="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  :aria-label="`Toggle subcategories for ${cat.name}`"
                >
                  <ChevronRight 
                    :class="cn('w-4 h-4 transition-transform duration-200', categoryService.isChildrenLoading(cat.id) ? 'animate-spin text-primary' : (openMobileCategoryIds.includes(cat.id) ? 'rotate-90 text-primary' : ''))" 
                  />
                </button>
              </div>
              
              <!-- Subcategories expandable via tap -->
              <transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-h-0 opacity-0 overflow-hidden"
                enter-to-class="max-h-96 opacity-100 overflow-hidden"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="max-h-96 opacity-100 overflow-hidden"
                leave-to-class="max-h-0 opacity-0 overflow-hidden"
              >
                <ul 
                  v-if="getSubCategories(cat).length && openMobileCategoryIds.includes(cat.id)" 
                  class="pl-3 mt-1.5 border-l-2 border-primary/40 space-y-2 py-1.5 bg-muted/20 rounded-r-lg"
                >
                  <li v-for="subCat in getSubCategories(cat)" :key="subCat.id">
                    <NuxtLink 
                      :to="categoryService.getCategoryUrl(subCat, allCategories)" 
                      class="text-[11px] font-semibold tracking-wide text-muted-foreground hover:text-primary block py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                      @click="uiStore.closeMobileMenu()"
                    >
                      {{ subCat.name }}
                    </NuxtLink>
                  </li>
                </ul>
              </transition>
            </div>
          </div>
        </div>

        <!-- Secondary Support / Corporate Links -->
        <div class="space-y-3 pt-4 border-t border-border/50">
          <NuxtLink 
            v-if="isSuperAdmin"
            to="/admin" 
            class="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2 hover:underline transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <ShieldCheck class="w-4 h-4 text-primary" />
            <span>Admin Panel</span>
          </NuxtLink>
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


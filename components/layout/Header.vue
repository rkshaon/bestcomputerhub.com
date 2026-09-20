<!-- File: /components/layout/Header.vue -->
<script setup lang="ts">
import { navigateTo } from '#app';
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
// TEMPORARILY DISABLED: Storefront Theme Mode Icons (Sun, Moon, Monitor)
import { Handbag, Search, User, Menu, X, /* Sun, Moon, Monitor, */ PackageSearch, Grid2X2, ShieldCheck, Home, Cpu, ArrowLeftRight, ChevronRight, ChevronDown, Tag, Sparkles, Zap, Clock, MapPin, BookOpen } from 'lucide-vue-next';
import { cn, decodeHtmlEntities } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useToast } from '@/composables/useToast';
import type { Category, Product } from '@/types';
import HeaderMegaMenu from '@/components/layout/HeaderMegaMenu.vue';
import HeaderSearchOverlay from '@/components/layout/HeaderSearchOverlay.vue';
import HeaderMobileDrawer from '@/components/layout/HeaderMobileDrawer.vue';
// TEMPORARILY DISABLED: Storefront Top Utility Bar Import
// Restore when the utility bar is required again.
// import HeaderUtilityBar from '@/components/layout/HeaderUtilityBar.vue';

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
const searchContainerRef = ref<HTMLElement | null>(null);
const searchOverlayRef = ref<InstanceType<typeof HeaderSearchOverlay> | null>(null);

const openSearch = () => {
  isSearchExpanded.value = true;
  nextTick(() => {
    searchOverlayRef.value?.focus();
  });
};

const closeSearch = () => {
  isSearchExpanded.value = false;
};

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    navigateTo(`/products?q=${encodeURIComponent(searchQuery.value.trim())}`);
    closeSearch();
  }
};

const handleCompareClick = () => {
  toastInfo('Product comparison coming soon!', {
    description: 'Select products on catalog pages to compare specifications.'
  });
};

const isSuperAdmin = computed(() => {
  return authStore.isLoggedIn && authStore.isAdmin;
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
    const rootRes = await categoryService.getRootCategories({ page: 1, is_menu: true });
    if (rootRes && rootRes.length > 0) {
      // Collect root category IDs that have children
      const rootIdsWithChildren = rootRes
        .filter(c => c.has_children !== false)
        .map(c => c.id);

      // Batched request for direct children across all root categories in a single call
      let childrenList: Category[] = [];
      if (rootIdsWithChildren.length > 0) {
        childrenList = await categoryService.getCategoryChildrenBatch(rootIdsWithChildren, { is_menu: true });
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

// TEMPORARILY DISABLED: Storefront Theme Mode Selection State
// const isThemeMenuOpen = ref(false);

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

  if (cat && cat.has_children !== false) {
    const isLoaded = categoryService.hasChildrenLoaded(cleanId) || (cat.slug ? categoryService.hasChildrenLoaded(cat.slug) : false);
    if (!isLoaded) {
      await categoryService.getCategoryChildrenBatch([cleanId], { is_menu: true });
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
    // TEMPORARILY DISABLED: Storefront Theme Dropdown Click-Outside
    // if (!target.closest('.theme-dropdown')) {
    //   isThemeMenuOpen.value = false;
    // }
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
    class="sticky top-0 z-50 w-full border-b py-0 sm:py-1 bg-background border-border/50 shadow-sm"
  >
    <!-- TEMPORARILY DISABLED: Storefront Top Utility Bar -->
    <!-- Restore when the utility bar is required again. -->
    <!--
    <div>
      <HeaderUtilityBar />
    </div>
    -->

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
          <!-- TEMPORARILY DISABLED: Storefront Theme Mode Selection (Mobile) -->
          <!-- Restore when storefront theme selection is required again. -->
          <!--
          <button 
            @click="isThemeMenuOpen = !isThemeMenuOpen" 
            class="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center"
            aria-label="Toggle theme"
          >
            <Sun v-if="uiStore.themeMode === 'light'" class="w-5 h-5" />
            <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-5 h-5" />
            <Monitor v-else class="w-5 h-5" />
          </button>
          -->

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
        <!-- Live Desktop Search Overlay -->
        <HeaderSearchOverlay
          ref="searchOverlayRef"
          v-model:is-expanded="isSearchExpanded"
          v-model:search-query="searchQuery"
          :categories="categories"
          :all-categories="allCategories"
          @close="closeSearch"
          @submit="handleSearchSubmit"
        />

        <!-- Normal Header Actions (Hidden when Search is Expanded) -->
        <div v-if="!isSearchExpanded" class="flex items-center gap-1 sm:gap-2 shrink-0 transition-opacity duration-200">
          <!-- TEMPORARILY DISABLED: Storefront Theme Mode Selection (Desktop) -->
          <!-- Restore when storefront theme selection is required again. -->
          <!--
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
          -->
          
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
            <!--
            <NuxtLink 
              to="/offers/" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-semibold transition-all shrink-0 group"
              title="Offers"
              aria-label="Offers"
            >
              <Tag class="w-3.5 h-3.5 text-destructive shrink-0 transition-transform group-hover:rotate-12" />
              <span>Offers</span>
            </NuxtLink>
            -->

            <!-- New Arrivals -->
            <!--
            <NuxtLink 
              to="/new-arrivals/" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-amber-500/40 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 text-xs font-semibold transition-all shrink-0"
              title="New Arrivals"
              aria-label="New Arrivals"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>New Arrivals</span>
            </NuxtLink>
            -->

            <!-- Flash Sale -->
            <!--
            <NuxtLink 
              to="/offers/" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs font-semibold transition-all shrink-0"
              title="Flash Sale"
              aria-label="Flash Sale"
            >
              <Zap class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Flash Sale</span>
            </NuxtLink>
            -->

            <!-- Happy Hours -->
            <!--
            <NuxtLink 
              to="/offers/" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-sky-500/40 hover:bg-sky-500/10 text-muted-foreground hover:text-sky-500 text-xs font-semibold transition-all shrink-0"
              title="Happy Hours"
              aria-label="Happy Hours"
            >
              <Clock class="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Happy Hours</span>
            </NuxtLink>
            -->
          </div>

          <!-- PC Builder -->
          <NuxtLink 
            to="/products/"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            title="PC Builder"
            aria-label="PC Builder"
          >
            <Cpu class="w-4 h-4 text-primary shrink-0" />
            <span>PC Builder</span>
          </NuxtLink>

          <!-- TEMPORARILY HIDDEN: Compare Header Action -->
          <!-- Restore when compare functionality in the top header is required again. -->
          <!--
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
          -->

          <!-- Track Your Order -->
          <NuxtLink 
            to="/account/" 
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            title="Track Your Order"
            aria-label="Track Your Order"
          >
            <PackageSearch class="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Track Order</span>
          </NuxtLink>

          <!-- TEMPORARILY HIDDEN: Tech Insights Header Action -->
          <!-- Restore when blog insights link in the top header is required again. -->
          <!--
          <NuxtLink 
            to="/blog/" 
            class="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            title="Tech Insights"
            aria-label="Tech Insights"
          >
            <BookOpen class="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Insights</span>
          </NuxtLink>
          -->

          <!-- TEMPORARILY HIDDEN: Store Location Header Action -->
          <!-- Restore when store location link in the top header is required again. -->
          <!--
          <a 
            href="https://www.google.com/maps/place/G.M+Plaza/@23.7388697,90.386565,17z/data=!3m1!5s0x3755b8c81091d773:0x601a730b2bf4e399!4m16!1m9!3m8!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!2sG.M+Plaza!8m2!3d23.7388697!4d90.386565!9m1!1b1!16s%2Fg%2F11c2p4g0df!3m5!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!8m2!3d23.7388697!4d90.386565!16s%2Fg%2F11c2p4g0df?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgwMi4wIKXMDSoASAFQAw%3D%3D" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            title="Store Location"
            aria-label="Store Location on Google Maps"
          >
            <MapPin class="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Store</span>
          </a>
          -->

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

          <!-- Relocated Login / Account Action -->
          <NuxtLink 
            :to="authStore.isLoggedIn ? '/account/' : '/login/'" 
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shrink-0"
            :title="authStore.isLoggedIn ? 'Account Dashboard' : 'Login or Sign Up'"
            :aria-label="authStore.isLoggedIn ? 'Account Dashboard' : 'Login'"
          >
            <User class="w-4 h-4 text-primary shrink-0" />
            <span>{{ authStore.isLoggedIn ? (authStore.user?.name || 'Account') : 'Hello, Login' }}</span>
          </NuxtLink>

          <button @click="uiStore.toggleMobileMenu()" class="md:hidden p-2 hover:bg-accent rounded-full transition-colors" title="Toggle navigation menu" aria-label="Toggle navigation menu">
            <Menu v-if="!uiStore.isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>

      </div>

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
              {{ decodeHtmlEntities(cat.name) }}
            </NuxtLink>
            
            <!-- Mega Menu Dropdown -->
            <HeaderMegaMenu
              :category="cat"
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
                  <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                  <ChevronRight v-if="hasChildren(cat)" class="w-3.5 h-3.5 text-muted-foreground group-hover/moreitem:text-primary shrink-0 ml-2" />
                </NuxtLink>

                <!-- Nested Mega Menu for overflow items -->
                <HeaderMegaMenu
                  v-if="hasChildren(cat)"
                  :category="cat"
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
          {{ decodeHtmlEntities(cat.name) }}
        </div>

        <div ref="measureMoreRef" class="font-semibold py-1.5 px-1.5 flex items-center gap-1 whitespace-nowrap" :class="isNavUltraCompact ? 'text-[11px]' : (isNavCompact ? 'text-xs' : 'text-xs lg:text-[13px]')">
          <span>More</span>
          <ChevronDown class="w-3.5 h-3.5" />
        </div>
      </div>
    </div>



    <!-- Mobile Navigation Drawer -->
    <HeaderMobileDrawer 
      :categories="categories"
      :all-categories="allCategories"
      :is-menu-loading="isMenuLoading"
    />
  </header>
</template>


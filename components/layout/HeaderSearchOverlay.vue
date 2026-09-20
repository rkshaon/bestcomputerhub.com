<!-- File: /components/layout/HeaderSearchOverlay.vue -->
<script setup lang="ts">
import { navigateTo } from '#app';
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { Search, X, ChevronRight, ArrowRight } from 'lucide-vue-next';
import { cn, decodeHtmlEntities } from '@/utils';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import type { Category, Product } from '@/types';

interface Props {
  isExpanded?: boolean;
  searchQuery?: string;
  categories?: Category[];
  allCategories?: Category[];
}

const props = withDefaults(defineProps<Props>(), {
  isExpanded: false,
  searchQuery: '',
  categories: () => [],
  allCategories: () => []
});

const emit = defineEmits<{
  (e: 'update:isExpanded', value: boolean): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'close'): void;
  (e: 'submit'): void;
}>();

const productService = useProductService();
const categoryService = useCategoryService();

const overlayContainerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const isExpandedModel = computed({
  get: () => props.isExpanded,
  set: (val: boolean) => emit('update:isExpanded', val)
});

const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val: string) => emit('update:searchQuery', val)
});

const searchResults = ref<Product[]>([]);
const isSearching = ref(false);

const popularSearches = [
  'RTX 4090',
  'DDR5 RAM',
  'Intel Core i9',
  'Gaming Laptops',
  'NVMe SSD',
  'Monitors'
];

const openSearch = () => {
  isExpandedModel.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const closeSearch = () => {
  isExpandedModel.value = false;
  searchInputRef.value?.blur();
  emit('close');
};

const handleSearchSubmit = () => {
  if (searchQueryModel.value.trim()) {
    navigateTo(`/products?q=${encodeURIComponent(searchQueryModel.value.trim())}`);
    closeSearch();
    emit('submit');
  }
};

const debouncedSearchQuery = refDebounced(searchQueryModel, 300);

watch(searchQueryModel, (newQuery) => {
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

if (process.client) {
  const handleWindowClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      isExpandedModel.value &&
      overlayContainerRef.value &&
      !overlayContainerRef.value.contains(target) &&
      !target.closest('.header-search-container')
    ) {
      closeSearch();
    }
  };

  const handleWindowKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isExpandedModel.value) {
      closeSearch();
    }
  };

  window.addEventListener('click', handleWindowClick);
  window.addEventListener('keydown', handleWindowKeydown);

  onUnmounted(() => {
    window.removeEventListener('click', handleWindowClick);
    window.removeEventListener('keydown', handleWindowKeydown);
  });
}

defineExpose({
  openSearch,
  closeSearch,
  focus: () => searchInputRef.value?.focus()
});
</script>

<template>
  <div ref="overlayContainerRef" class="flex-1 min-w-0 flex items-center gap-3 z-50 header-search-container">
    <!-- Desktop Search Input Bar -->
    <div 
      :class="cn(
        'hidden md:flex relative group flex-1 min-w-0 transition-all duration-300 ease-in-out',
        isExpandedModel ? 'z-50' : ''
      )"
    >
      <input 
        ref="searchInputRef"
        v-model="searchQueryModel"
        type="text" 
        :placeholder="isExpandedModel ? 'Search products, brands or models...' : 'Search items...'" 
        role="combobox"
        :aria-expanded="isExpandedModel"
        aria-autocomplete="list"
        aria-label="Search items"
        :class="cn(
          'w-full bg-muted/50 border rounded-full outline-none h-11 text-sm px-12 transition-all duration-200',
          isExpandedModel 
            ? 'bg-background border-primary/50 shadow-md ring-2 ring-primary/20' 
            : 'border-input focus:bg-background focus:ring-2 focus:ring-primary/20'
        )"
        @focus="openSearch"
        @keyup.enter="handleSearchSubmit"
      />
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary w-5 h-5 transition-colors" />
      <button 
        v-if="searchQueryModel && isExpandedModel" 
        type="button" 
        @click="searchQueryModel = ''; searchInputRef?.focus()"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted"
        aria-label="Clear search text"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Cancel Action (Shown when Search is Expanded) -->
    <div v-if="isExpandedModel" class="hidden md:flex items-center shrink-0 z-50">
      <button 
        type="button" 
        @click="closeSearch"
        class="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-full hover:bg-accent border border-border/50 transition-all cursor-pointer"
      >
        Cancel
      </button>
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
        v-if="isExpandedModel" 
        class="absolute top-full left-2 right-2 md:left-4 md:right-4 z-50 mt-1 sm:mt-2 bg-background/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden space-y-4 max-h-[75vh] overflow-y-auto"
      >
        <!-- Popular Searches when query is empty -->
        <div v-if="!searchQueryModel.trim()" class="space-y-4">
          <div class="space-y-2">
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Popular Searches
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in popularSearches"
                :key="tag"
                type="button"
                @click="searchQueryModel = tag; searchInputRef?.focus()"
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
                <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
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
              :to="`/product/${product.slug}/`"
              @click="closeSearch"
              class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent border border-transparent hover:border-border/60 transition-all group"
            >
              <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                <img :src="product.images[0]" :alt="decodeHtmlEntities(product.name)" class="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {{ decodeHtmlEntities(product.name) }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs font-extrabold text-primary">${{ product.price }}</span>
                  <span v-if="product.brand" class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {{ decodeHtmlEntities(product.brand) }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>

          <div v-else class="py-8 text-center space-y-1">
            <p class="text-xs font-medium text-muted-foreground">
              No matching products found for "<span class="font-bold text-foreground">{{ searchQueryModel }}</span>"
            </p>
            <p class="text-[11px] text-muted-foreground/80">
              Try searching for GPU models, processors, RAM modules, or brand names.
            </p>
          </div>
        </div>
      </div>
    </transition>

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
        v-if="isExpandedModel" 
        class="fixed inset-0 bg-background/60 backdrop-blur-xs z-40 top-[56px] sm:top-[64px]"
        @click="closeSearch"
      />
    </transition>
  </div>
</template>

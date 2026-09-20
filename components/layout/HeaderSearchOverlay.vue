<!-- File: /components/layout/HeaderSearchOverlay.vue -->
<script setup lang="ts">
import { navigateTo } from '#app';
import { ref, computed, watch, onUnmounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { Search, X, ArrowRight, AlertCircle, Loader2, Package } from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { formatCurrency, decodeHtmlEntities } from '@/utils';
import type { Category, Product } from '@/types';

interface Props {
  searchQuery?: string;
  isExpanded?: boolean;
  categories?: Category[];
  allCategories?: Category[];
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  isExpanded: false,
  categories: () => [],
  allCategories: () => []
});

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:isExpanded', value: boolean): void;
  (e: 'close'): void;
  (e: 'submit'): void;
}>();

const productService = useProductService();

const containerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val: string) => emit('update:searchQuery', val)
});

// Debounce search query input by 300ms
const debouncedSearchQuery = refDebounced(searchQueryModel, 300);

const searchResults = ref<Product[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);
const isOpen = ref(false);

let currentRequestId = 0;

// Watch immediate input changes
watch(searchQueryModel, (newQuery) => {
  const trimmed = newQuery.trim();
  if (trimmed.length < 1) {
    currentRequestId++;
    searchResults.value = [];
    isSearching.value = false;
    searchError.value = null;
    isOpen.value = false;
  } else {
    isSearching.value = true;
    searchError.value = null;
    isOpen.value = true;
  }
});

// Watch debounced query to perform the API request
watch(debouncedSearchQuery, async (newQuery) => {
  const trimmed = newQuery.trim();
  if (trimmed.length < 1) {
    searchResults.value = [];
    isSearching.value = false;
    searchError.value = null;
    return;
  }

  const requestId = ++currentRequestId;
  isSearching.value = true;
  searchError.value = null;

  try {
    const res = await productService.getProductsList({
      search: trimmed,
      page_size: 6
    });

    // Discard stale in-flight responses if a newer search was triggered
    if (requestId !== currentRequestId) {
      return;
    }

    searchResults.value = res?.results || [];
  } catch (err: any) {
    if (requestId !== currentRequestId) {
      return;
    }
    console.error('Header search error:', err);
    searchError.value = 'Failed to load matching products.';
    searchResults.value = [];
  } finally {
    if (requestId === currentRequestId) {
      isSearching.value = false;
    }
  }
});

const closeDropdown = () => {
  isOpen.value = false;
};

const handleInputFocus = () => {
  if (searchQueryModel.value.trim().length >= 1) {
    isOpen.value = true;
  }
};

const handleSearchSubmit = () => {
  if (searchQueryModel.value.trim()) {
    navigateTo(`/products?q=${encodeURIComponent(searchQueryModel.value.trim())}`);
    closeDropdown();
    emit('submit');
  }
};

const handleClear = () => {
  searchQueryModel.value = '';
  closeDropdown();
  searchInputRef.value?.focus();
};

if (process.client) {
  const handleWindowClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      isOpen.value &&
      containerRef.value &&
      !containerRef.value.contains(target)
    ) {
      closeDropdown();
    }
  };

  const handleWindowKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      closeDropdown();
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
  focus: () => searchInputRef.value?.focus()
});
</script>

<template>
  <div ref="containerRef" class="flex-1 min-w-0 flex items-center gap-3 relative">
    <!-- Desktop Search Input Bar -->
    <div class="hidden md:flex relative group flex-1 min-w-0 transition-all duration-300 ease-in-out">
      <input 
        ref="searchInputRef"
        v-model="searchQueryModel"
        type="text" 
        placeholder="Search products, brands or models..." 
        aria-label="Search items"
        class="w-full bg-muted/50 border border-input rounded-full outline-none h-11 text-sm px-12 transition-all duration-200 focus:bg-background focus:ring-2 focus:ring-primary/20"
        @focus="handleInputFocus"
        @keyup.enter="handleSearchSubmit"
      />
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary w-5 h-5 transition-colors" />
      <button 
        v-if="searchQueryModel" 
        type="button" 
        @click="handleClear"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted cursor-pointer"
        aria-label="Clear search text"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Search Results Dropdown Panel -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-[0.99]"
    >
      <div 
        v-if="isOpen && searchQueryModel.trim().length >= 1" 
        class="absolute top-full left-0 right-0 z-50 mt-1.5 bg-background border border-border rounded-2xl p-4 sm:p-5 overflow-hidden space-y-3 max-h-[75vh] overflow-y-auto"
      >
        <!-- Header with matching count label and View all results button -->
        <div class="flex items-center justify-end border-b border-border pb-2.5">
          <button
            type="button"
            @click="handleSearchSubmit"
            class="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all results</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
          <Loader2 class="w-4 h-4 text-primary animate-spin" />
          <span>Searching catalog database...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="searchError" class="py-6 px-4 text-center space-y-1.5 text-muted-foreground">
          <AlertCircle class="w-5 h-5 text-destructive mx-auto" />
          <p class="text-xs font-medium text-destructive">{{ searchError }}</p>
          <p class="text-[11px] text-muted-foreground">Please try again or press Enter to view all results.</p>
        </div>

        <!-- Populated Results Grid -->
        <div v-else-if="searchResults.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <NuxtLink
            v-for="product in searchResults"
            :key="product.id"
            :to="`/product/${product.slug}/`"
            @click="closeDropdown"
            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all group"
          >
            <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
              <img 
                v-if="product.images && product.images.length > 0" 
                :src="product.images[0]" 
                :alt="decodeHtmlEntities(product.name)" 
                class="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
              />
              <Package v-else class="w-6 h-6 text-muted-foreground/50" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {{ decodeHtmlEntities(product.name) }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs font-extrabold text-primary">{{ formatCurrency(product.price) }}</span>
                <span v-if="product.brand" class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
                  {{ decodeHtmlEntities(typeof product.brand === 'object' && product.brand !== null ? (product.brand.name || '') : String(product.brand || '')) }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty Results State -->
        <div v-else class="py-8 text-center space-y-1">
          <p class="text-xs font-medium text-muted-foreground">
            No matching products found for "<span class="font-bold text-foreground">{{ searchQueryModel }}</span>"
          </p>
          <p class="text-[11px] text-muted-foreground/80">
            Try searching for GPU models, processors, RAM modules, or brand names.
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

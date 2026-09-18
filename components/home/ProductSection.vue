<!-- File: /components/home/ProductSection.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, AlertCircle, RefreshCw, Package } from 'lucide-vue-next';
import type { Product } from '@/types';

const props = withDefaults(
  defineProps<{
    title: string;
    titleHighlight?: string;
    subtitle?: string;
    viewAllRoute?: string;
    viewAllText?: string;
    products?: Product[];
    isLoading?: boolean;
    error?: any;
    errorMessage?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    onRetry?: () => void | Promise<void>;
  }>(),
  {
    titleHighlight: '',
    subtitle: '',
    viewAllRoute: '',
    viewAllText: 'View All',
    products: () => [],
    isLoading: false,
    error: undefined,
    errorMessage: '',
    emptyTitle: 'No products available',
    emptyMessage: 'Check back soon for new arrivals and hardware solutions.',
    onRetry: undefined
  }
);

const emit = defineEmits<{
  (e: 'retry'): void;
}>();

const titleParts = computed(() => {
  if (!props.titleHighlight || !props.title.includes(props.titleHighlight)) {
    return { before: props.title, highlight: '', after: '' };
  }
  const index = props.title.indexOf(props.titleHighlight);
  return {
    before: props.title.slice(0, index),
    highlight: props.titleHighlight,
    after: props.title.slice(index + props.titleHighlight.length)
  };
});

const handleRetry = () => {
  if (props.onRetry) {
    props.onRetry();
  }
  emit('retry');
};
</script>

<template>
  <section class="container mx-auto px-4">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
      <div>
        <h2 class="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
          <template v-if="titleParts.highlight">
            {{ titleParts.before }}<span class="text-primary">{{ titleParts.highlight }}</span>{{ titleParts.after }}
          </template>
          <template v-else>
            {{ title }}
          </template>
        </h2>
        <p v-if="subtitle" class="text-muted-foreground mt-1 text-sm">{{ subtitle }}</p>
      </div>

      <NuxtLink 
        v-if="viewAllRoute"
        :to="viewAllRoute" 
        class="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm group shrink-0"
      >
        <span>{{ viewAllText || 'View All' }}</span>
        <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- 1. Loading Skeleton State (8 Placeholders) -->
    <div 
      v-if="isLoading" 
      class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div 
        v-for="i in 8" 
        :key="'product-skeleton-' + i" 
        class="bg-card border border-border/60 rounded-2xl overflow-hidden animate-pulse shadow-2xs flex flex-col"
      >
        <!-- Image Box Skeleton -->
        <div class="aspect-square bg-muted/50 relative flex items-center justify-center">
          <Package class="w-10 h-10 text-muted-foreground/20 stroke-1" />
        </div>
        <!-- Content Box Skeleton -->
        <div class="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <!-- Brand & Rating Row -->
            <div class="flex items-center justify-between mb-2">
              <div class="h-3 w-16 bg-muted/60 rounded-xs"></div>
              <div class="h-3 w-8 bg-muted/60 rounded-xs"></div>
            </div>
            <!-- Title Lines -->
            <div class="space-y-1.5 min-h-[32px] sm:min-h-[40px]">
              <div class="h-3.5 sm:h-4 w-full bg-muted/60 rounded-xs"></div>
              <div class="h-3.5 sm:h-4 w-3/4 bg-muted/60 rounded-xs"></div>
            </div>
          </div>
          <!-- Price & Action Button Row -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <div class="h-5 sm:h-6 w-20 bg-muted/60 rounded-xs"></div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-muted/60 shrink-0"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Error Fallback State -->
    <div 
      v-else-if="error" 
      class="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-muted/20 border border-border/60 text-center"
      role="alert"
    >
      <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3.5">
        <AlertCircle class="w-6 h-6" />
      </div>
      <p class="text-base font-semibold text-foreground mb-1">Failed to load catalog products</p>
      <p class="text-xs sm:text-sm text-muted-foreground mb-5 max-w-md">
        {{ errorMessage || 'An unexpected error occurred while communicating with the catalog service.' }}
      </p>
      <UiButton
        variant="primary"
        size="sm"
        class="inline-flex items-center gap-2 rounded-lg font-semibold"
        @click="handleRetry"
      >
        <RefreshCw class="w-4 h-4" />
        <span>Try Again</span>
      </UiButton>
    </div>

    <!-- 3. Empty State -->
    <div 
      v-else-if="!products || products.length === 0" 
      class="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-muted/20 border border-border/60 text-center"
    >
      <div class="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-3.5">
        <Package class="w-6 h-6 stroke-1" />
      </div>
      <p class="text-base font-semibold text-foreground mb-1">{{ emptyTitle }}</p>
      <p class="text-xs sm:text-sm text-muted-foreground mb-5 max-w-md">{{ emptyMessage }}</p>
      <NuxtLink
        v-if="viewAllRoute"
        :to="viewAllRoute"
        class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
      >
        <span>{{ viewAllText || 'Browse all products' }}</span>
        <ChevronRight class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- 4. Success Product Grid -->
    <div 
      v-else 
      class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
    >
      <CommerceProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </section>
</template>

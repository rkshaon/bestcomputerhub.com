<!-- File: /components/home/FeaturedCategories.vue -->
<script setup lang="ts">
import { useCategoryService } from '@/composables/useCategoryService';
import type { FeaturedCategory } from '@/types';
import { 
  ChevronRight, 
  AlertCircle,
  RefreshCw,
  FolderTree
} from 'lucide-vue-next';
import FeaturedCategoryCard from './FeaturedCategoryCard.vue';

const categoryService = useCategoryService();

// Fetch featured categories with SSR support to avoid duplicate requests during hydration
const { data: featuredCategories, status, error, refresh } = await useAsyncData<FeaturedCategory[]>(
  'storefront-featured-categories',
  () => categoryService.getFeaturedCategories(),
  {
    lazy: false,
    default: () => []
  }
);
</script>

<template>
  <section class="container mx-auto px-4" aria-labelledby="featured-categories-heading">
    <!-- Heading -->
    <div class="mb-6">
        <h2 id="featured-categories-heading" class="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
          Featured Categories
        </h2>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="status === 'pending'" class="flex flex-wrap justify-center gap-2 sm:gap-3">
      <div
        v-for="i in 12"
        :key="'cat-skeleton-' + i"
        class="flex flex-col items-center justify-center p-1.5 rounded-xl bg-card border border-border/40 animate-pulse w-[calc(33.33%-0.33rem)] sm:w-[calc(16.66%-0.625rem)] md:w-[calc(11.11%-0.66rem)] lg:w-[calc(8.33%-0.68rem)]"
      >
        <div class="w-[52px] h-[52px] rounded-xl bg-muted/60 mb-1"></div>
        <div class="w-20 h-3.5 bg-muted/60 rounded-sm"></div>
      </div>
    </div>

    <!-- Error Fallback State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-muted/20 border border-border/60 text-center">
      <div class="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <AlertCircle class="w-5 h-5" />
      </div>
      <p class="text-sm font-semibold text-foreground mb-1">Failed to load featured categories</p>
      <p class="text-xs text-muted-foreground mb-4 max-w-md">An error occurred while connecting to the categories service.</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        @click="refresh()"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!featuredCategories || featuredCategories.length === 0" class="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-muted/20 border border-border/60 text-center">
      <div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-3">
        <FolderTree class="w-5 h-5" />
      </div>
      <p class="text-sm font-semibold text-foreground mb-1">No featured categories available</p>
      <p class="text-xs text-muted-foreground mb-4">Check back soon for featured hardware & infrastructure components.</p>
      <NuxtLink
        to="/shop-now/"
        class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <span>Browse all categories</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>

    <!-- Category Grid - Real Featured Categories -->
    <div v-else class="flex flex-wrap justify-center gap-2 sm:gap-3">
      <FeaturedCategoryCard
        v-for="cat in featuredCategories"
        :key="cat.id"
        :category="cat"
      />
    </div>
  </section>
</template>

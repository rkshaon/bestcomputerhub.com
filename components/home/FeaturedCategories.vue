<!-- File: /components/home/FeaturedCategories.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { decodeHtmlEntities } from '@/utils';
import { useCategoryService } from '@/composables/useCategoryService';
import type { FeaturedCategory } from '@/types';
import { 
  ChevronRight, 
  Cpu, 
  Server, 
  HardDrive, 
  Layers, 
  CircuitBoard, 
  Database, 
  Monitor, 
  ShieldCheck, 
  Zap,
  Box,
  Terminal,
  AlertCircle,
  RefreshCw,
  FolderTree
} from 'lucide-vue-next';
import type { Component } from 'vue';

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

// Map of failed icon URLs to fall back gracefully to default category icons
const imageErrors = ref<Record<string | number, boolean>>({});

const handleImageError = (id: string | number) => {
  imageErrors.value[id] = true;
};

// Centralized icon mapping resolver based on category slug or name (used as fallback)
const getCategoryIcon = (slug: string, name: string): Component => {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('gpu') || n.includes('graphic')) return Monitor;
  if (s.includes('processor') || s.includes('cpu') || n.includes('processor')) return Cpu;
  if (s.includes('server') || n.includes('server')) return Server;
  if (s.includes('memory') || s.includes('ram')) return Layers;
  if (s.includes('storage') || s.includes('ssd') || s.includes('drive')) return HardDrive;
  if (s.includes('motherboard') || s.includes('chassis')) return CircuitBoard;
  if (s.includes('datacenter') || s.includes('accelerator')) return Database;
  if (s.includes('cooling') || s.includes('fan')) return Zap;
  if (s.includes('power') || s.includes('psu')) return ShieldCheck;
  if (s.includes('network') || s.includes('switch')) return Terminal;

  return Box; // Fallback icon
};
</script>

<template>
  <section class="container mx-auto px-4" aria-labelledby="featured-categories-heading">
    <!-- Header Row -->
    <div class="flex items-end justify-between mb-6 pb-4 border-b border-border/40">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
          <span>Explore Infrastructure</span>
        </div>
        <h2 id="featured-categories-heading" class="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
          Featured Categories
        </h2>
      </div>

      <NuxtLink 
        to="/products/" 
        class="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm group"
      >
        <span>View All Categories</span>
        <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="status === 'pending'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <div
        v-for="i in 12"
        :key="'cat-skeleton-' + i"
        class="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/40 h-32 sm:h-36 animate-pulse"
      >
        <div class="w-12 h-12 rounded-xl bg-muted/60 mb-3"></div>
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
        to="/products/"
        class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <span>Browse all categories</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>

    <!-- Category Grid - Real Featured Categories -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <NuxtLink
        v-for="cat in featuredCategories"
        :key="cat.id"
        :to="'/product-category/' + cat.slug + '/'"
        class="group relative flex flex-col items-center justify-center text-center p-4 rounded-xl bg-card border border-border/60 hover:border-primary/60 hover:bg-muted/30 shadow-xs hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-32 sm:h-36"
      >
        <!-- Icon Container -->
        <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-xs overflow-hidden p-1.5">
          <img
            v-if="cat.featured_icon && !imageErrors[cat.id]"
            :src="cat.featured_icon"
            :alt="decodeHtmlEntities(cat.name)"
            class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            @error="handleImageError(cat.id)"
          />
          <component
            v-else
            :is="getCategoryIcon(cat.slug, cat.name)"
            class="w-6 h-6"
            aria-hidden="true"
          />
        </div>

        <!-- Category Name -->
        <h3 class="text-xs sm:text-[13px] font-semibold text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-tight px-1">
          {{ decodeHtmlEntities(cat.name) }}
        </h3>
      </NuxtLink>
    </div>
  </section>
</template>



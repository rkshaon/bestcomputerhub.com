<!-- File: /components/home/FeaturedCategories.vue -->
<script setup lang="ts">
import { ChevronRight, ArrowUpRight } from 'lucide-vue-next';

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  route: string;
  description: string;
  image: string;
  itemCount?: number;
}

// ============================================================================
// MOCK DATA - TEMPORARY DEVELOPMENT DATA
// Note: This mock data is intentionally used for initial component rendering
// before real backend/DRF category API integration is added in a future task.
// ============================================================================
const MOCK_FEATURED_CATEGORIES: FeaturedCategory[] = [
  {
    id: 'cat_gpu',
    name: 'Graphics Processors',
    slug: 'gpus',
    route: '/product-category/gpus/',
    description: 'AI acceleration, deep learning & high-end rendering GPUs.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80',
    itemCount: 42,
  },
  {
    id: 'cat_cpu',
    name: 'Processors & CPUs',
    slug: 'processors',
    route: '/product-category/processors/',
    description: 'Server & workstation multi-core central processing units.',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=600&fit=crop&q=80',
    itemCount: 38,
  },
  {
    id: 'cat_server',
    name: 'Enterprise Servers',
    slug: 'servers',
    route: '/product-category/servers/',
    description: 'High-density rackmount nodes & blade compute enclosures.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop&q=80',
    itemCount: 24,
  },
  {
    id: 'cat_motherboard',
    name: 'NVIDIA RTX Workstations',
    slug: 'nvidia-rtx',
    route: '/product-category/nvidia-rtx/',
    description: 'Enterprise workstation nodes powered by NVIDIA architecture.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
    itemCount: 31,
  },
  {
    id: 'cat_memory',
    name: 'Radeon Accelerators',
    slug: 'amd-radeon',
    route: '/product-category/amd-radeon/',
    description: 'High-throughput compute & rendering hardware from AMD.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&q=80',
    itemCount: 29,
  },
  {
    id: 'cat_datacenter',
    name: 'Data Center Compute',
    slug: 'datacenter-accelerators',
    route: '/product-category/datacenter-accelerators/',
    description: 'AI clusters, FPGA modules & datacenter accelerators.',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop&q=80',
    itemCount: 19,
  },
];
</script>

<template>
  <section class="container mx-auto px-4" aria-labelledby="featured-categories-heading">
    <!-- Header Row -->
    <div class="flex items-end justify-between mb-8 pb-4 border-b border-border/40">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
          <span>Explore Infrastructure</span>
        </div>
        <h2 id="featured-categories-heading" class="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
          Featured Categories
        </h2>
      </div>

      <NuxtLink 
        to="/products" 
        class="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm group"
      >
        <span>View All Categories</span>
        <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Category Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="cat in MOCK_FEATURED_CATEGORIES"
        :key="cat.id"
        :to="cat.route"
        class="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-64"
      >
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 z-0 bg-muted overflow-hidden">
          <img 
            :src="cat.image" 
            :alt="`${cat.name} category illustration`"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 dark:opacity-80"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
        </div>

        <!-- Top Badge / Action Icon -->
        <div class="relative z-20 p-5 flex items-center justify-between">
          <span 
            v-if="cat.itemCount" 
            class="text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-md text-foreground/80 px-2.5 py-1 rounded-full border border-border/40 shadow-xs"
          >
            {{ cat.itemCount }} Products
          </span>
          <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md border border-border/40 text-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 ml-auto shadow-xs">
            <ArrowUpRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </div>
        </div>

        <!-- Bottom Content Area -->
        <div class="relative z-20 p-5 space-y-1">
          <h3 class="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors leading-snug">
            {{ cat.name }}
          </h3>
          <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {{ cat.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

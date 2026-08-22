<!-- File: /components/home/FeaturedCategories.vue -->
<script setup lang="ts">
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
  Terminal
} from 'lucide-vue-next';
import type { Component } from 'vue';

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  route: string;
  description?: string;
  image?: string;
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
  },
  {
    id: 'cat_cpu',
    name: 'Processors & CPUs',
    slug: 'processors',
    route: '/product-category/processors/',
  },
  {
    id: 'cat_server',
    name: 'Enterprise Servers',
    slug: 'servers',
    route: '/product-category/servers/',
  },
  {
    id: 'cat_nvidia',
    name: 'NVIDIA RTX Workstations',
    slug: 'nvidia-rtx',
    route: '/product-category/nvidia-rtx/',
  },
  {
    id: 'cat_amd',
    name: 'Radeon Accelerators',
    slug: 'amd-radeon',
    route: '/product-category/amd-radeon/',
  },
  {
    id: 'cat_datacenter',
    name: 'Data Center Compute',
    slug: 'datacenter-accelerators',
    route: '/product-category/datacenter-accelerators/',
  },
  {
    id: 'cat_memory',
    name: 'Memory & RAM',
    slug: 'memory',
    route: '/product-category/memory/',
  },
  {
    id: 'cat_storage',
    name: 'Enterprise Storage & SSDs',
    slug: 'storage',
    route: '/product-category/storage/',
  },
  {
    id: 'cat_motherboard',
    name: 'Motherboards & Chassis',
    slug: 'motherboards',
    route: '/product-category/motherboards/',
  },
  {
    id: 'cat_cooling',
    name: 'Liquid Cooling & Fans',
    slug: 'cooling',
    route: '/product-category/cooling/',
  },
  {
    id: 'cat_power',
    name: 'Power Supply Units (PSU)',
    slug: 'power-supplies',
    route: '/product-category/power-supplies/',
  },
  {
    id: 'cat_networking',
    name: 'Networking & Switches',
    slug: 'networking',
    route: '/product-category/networking/',
  },
];

// Centralized icon mapping resolver based on category slug or name
const getCategoryIcon = (slug: string, name: string): Component => {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

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

    <!-- Category Grid - Compact Icon Tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <NuxtLink
        v-for="cat in MOCK_FEATURED_CATEGORIES"
        :key="cat.id"
        :to="cat.route"
        class="group relative flex flex-col items-center justify-center text-center p-4 rounded-xl bg-card border border-border/60 hover:border-primary/60 hover:bg-muted/30 shadow-xs hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-32 sm:h-36"
      >
        <!-- Icon Container -->
        <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-xs">
          <component :is="getCategoryIcon(cat.slug, cat.name)" class="w-6 h-6" aria-hidden="true" />
        </div>

        <!-- Category Name -->
        <h3 class="text-xs sm:text-[13px] font-semibold text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-tight px-1">
          {{ cat.name }}
        </h3>
      </NuxtLink>
    </div>
  </section>
</template>


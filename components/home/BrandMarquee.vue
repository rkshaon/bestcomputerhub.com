<!-- File: /components/home/BrandMarquee.vue -->
<script setup lang="ts">
import type { Brand } from '@/types';

defineProps<{
  brands: Brand[];
}>();
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="w-full bg-muted/20 border border-border/60 rounded-2xl py-6 overflow-hidden group shadow-xs">
      <div class="flex whitespace-nowrap animate-marquee">
        <!-- Double the content for seamless looping -->
        <div v-for="i in 2" :key="i" class="flex items-center space-x-16 px-4 select-none">
          <NuxtLink 
            v-for="brand in brands" 
            :key="brand.id + '-' + i" 
            :to="'/products/?brand=' + encodeURIComponent(brand.name)"
            class="flex items-center gap-3.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer py-1.5 group/brand"
          >
            <!-- Logo container -->
            <div class="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center p-1.5 overflow-hidden group-hover/brand:scale-105 group-hover/brand:border-primary/20 transition-all duration-300 shadow-sm">
              <img 
                :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" 
                :alt="brand.name" 
                class="w-full h-full object-contain"
              />
            </div>
            <!-- Brand name -->
            <span class="text-xl font-display font-medium tracking-tight text-foreground group-hover/brand:text-primary transition-colors">{{ brand.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
</style>

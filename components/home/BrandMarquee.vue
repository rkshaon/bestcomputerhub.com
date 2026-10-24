<!-- File: /components/home/BrandMarquee.vue -->
<script setup lang="ts">
import { decodeHtmlEntities } from '@/utils';
import type { Brand } from '@/types';

defineProps<{
  brands: Brand[];
}>();
</script>

<template>
  <section class="container mx-auto px-4" aria-label="Partner Brands">
    <div class="w-full bg-muted/20 border border-border/60 rounded-2xl py-6 overflow-hidden group shadow-xs">
      <div class="flex whitespace-nowrap animate-marquee">
        <!-- Double the content for seamless looping -->
        <div v-for="i in 2" :key="i" class="flex items-center space-x-6 sm:space-x-8 px-3 sm:px-4 select-none shrink-0">
          <NuxtLink 
            v-for="brand in brands" 
            :key="brand.id + '-' + i" 
            :to="`/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}/`"
            :title="decodeHtmlEntities(brand.name)"
            :aria-label="decodeHtmlEntities(brand.name)"
            class="w-32 sm:w-36 md:w-40 h-16 sm:h-20 rounded-xl bg-card border border-border flex items-center justify-center p-2 sm:p-3 overflow-hidden group/brand hover:border-primary/40 hover:scale-105 transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer shrink-0"
          >
            <img 
              :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" 
              :alt="decodeHtmlEntities(brand.name)" 
              class="w-full h-full object-contain filter grayscale-0 opacity-100 group-hover/brand:grayscale group-hover/brand:opacity-60 transition-all duration-300"
              loading="lazy"
            />
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

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;
  }
}
</style>

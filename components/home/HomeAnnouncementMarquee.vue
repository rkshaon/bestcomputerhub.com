<!-- File: /components/home/HomeAnnouncementMarquee.vue -->
<script setup lang="ts">
import { Megaphone } from 'lucide-vue-next';
</script>

<template>
  <section class="container mx-auto px-4 py-3" aria-label="Store Announcement">
    <div class="bg-primary/10 border-y border-primary/20 overflow-hidden rounded-lg flex items-center p-3">
      <div class="flex items-center gap-2 text-primary shrink-0 mr-4 z-10">
        <Megaphone class="w-4 h-4 animate-pulse" aria-hidden="true" />
      </div>
      <div class="overflow-hidden relative w-full flex">
        <div class="animate-marquee whitespace-nowrap flex items-center gap-12 text-sm font-semibold text-foreground">
          <span>Welcome to Bangladeshi's Trusted Retail Store</span>
          <span class="text-primary/40">•</span>
          <span>Welcome to Bangladeshi's Trusted Retail Store</span>
          <span class="text-primary/40">•</span>
          <span>Welcome to Bangladeshi's Trusted Retail Store</span>
          <span class="text-primary/40">•</span>
          <span>Welcome to Bangladeshi's Trusted Retail Store</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  display: inline-flex;
  animation: marquee 30s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;
  }
}
</style>

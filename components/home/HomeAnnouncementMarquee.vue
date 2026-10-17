<!-- File: /components/home/HomeAnnouncementMarquee.vue -->
<script setup lang="ts">
</script>

<template>
  <section class="container mx-auto px-4 py-1" aria-label="Store Announcement">
    <div class="bg-white border-y border-primary/20 overflow-hidden rounded-lg flex items-center p-1">
      <div class="overflow-hidden relative w-full flex">
        <div class="animate-marquee whitespace-nowrap flex items-center gap-12 text-sm font-semibold text-foreground py-1">
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

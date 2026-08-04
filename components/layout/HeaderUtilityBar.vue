<!-- File: /components/layout/HeaderUtilityBar.vue -->
<script setup lang="ts">
import { Tag, Sparkles, MapPin, BookOpen, Construction, User, PackageSearch } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <div 
    class="w-full border-b border-border/40 bg-muted/30 text-muted-foreground text-[11px] font-medium hidden sm:block py-1.5 overflow-hidden"
  >
    <div class="container mx-auto px-4 flex items-center justify-between gap-4">
      <!-- Left/Center: Announcement Marquee -->
      <div 
        class="marquee-container relative flex-1 overflow-hidden py-0.5 select-none"
        aria-label="Announcement"
      >
        <div class="marquee-track whitespace-nowrap inline-flex items-center gap-1.5 text-foreground/80">
          <Construction class="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span class="tracking-wide font-medium">We are under construction</span>
        </div>
      </div>

      <!-- Right side: Quick Shortcuts -->
      <div class="flex items-center gap-3.5 md:gap-5 shrink-0">
        <!-- 1. Track Your Order -->
        <NuxtLink 
          to="/account" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <PackageSearch class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Track Your Order</span>
        </NuxtLink>

        <!-- 2. Offers -->
        <NuxtLink 
          to="/offers" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm group"
        >
          <Tag class="w-3 h-3 text-destructive shrink-0 transition-transform group-hover:rotate-12" aria-hidden="true" />
          <span>Offers</span>
          <span class="bg-destructive/10 text-destructive text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Hot</span>
        </NuxtLink>

        <!-- 3. Insights -->
        <NuxtLink 
          to="/blog" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <BookOpen class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Insights</span>
        </NuxtLink>

        <!-- 4. New Arrivals -->
        <NuxtLink 
          to="/new-arrivals" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <Sparkles class="w-3 h-3 text-amber-500 shrink-0" aria-hidden="true" />
          <span>New Arrivals</span>
        </NuxtLink>

        <!-- 5. Store (Google Maps Location) -->
        <a 
          href="https://www.google.com/maps/place/G.M+Plaza/@23.7388697,90.386565,17z/data=!3m1!5s0x3755b8c81091d773:0x601a730b2bf4e399!4m16!1m9!3m8!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!2sG.M+Plaza!8m2!3d23.7388697!4d90.386565!9m1!1b1!16s%2Fg%2F11c2p4g0df!3m5!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!8m2!3d23.7388697!4d90.386565!16s%2Fg%2F11c2p4g0df?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgwMi4wIKXMDSoASAFQAw%3D%3D" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
          aria-label="Store Location on Google Maps"
        >
          <MapPin class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Store</span>
        </a>

        <!-- 6. Login / Sign Up or Account (Far Right) -->
        <NuxtLink 
          :to="authStore.isLoggedIn ? '/account' : '/login'" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <User class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>{{ authStore.isLoggedIn ? (authStore.user?.name || 'Account') : 'Hello, Login' }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee-container {
  container-type: inline-size;
}

.marquee-track {
  animation: marquee-ltr 10s linear infinite;
  will-change: transform;
}

.marquee-container:hover .marquee-track {
  animation-play-state: paused;
}

@keyframes marquee-ltr {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100cqw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    transform: none;
  }
}
</style>


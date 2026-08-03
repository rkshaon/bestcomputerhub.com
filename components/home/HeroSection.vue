<!-- File: /components/home/HeroSection.vue -->
<script setup lang="ts">
import { Trophy, ChevronRight } from 'lucide-vue-next';
</script>

<template>
  <section class="relative h-[640px] flex items-center overflow-hidden bg-black text-white">
    <div class="absolute inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=2000" 
        alt="Tech hardware hero banner"
        class="w-full h-full object-cover opacity-40 mix-blend-overlay"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
    </div>
    
    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-2xl space-y-8">
        <div class="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold animate-fade-in">
          <Trophy class="w-4 h-4" />
          <span>#1 Tech Retailer 2026</span>
        </div>
        
        <h1 class="text-6xl md:text-8xl font-display font-extrabold tracking-tight leading-[0.9] text-white">
          The Future of <span class="text-primary italic">Hardware</span>
        </h1>
        
        <p class="text-xl text-white/70 max-w-lg leading-relaxed">
          Elevate your digital workflow with exclusive access to top-tier components and enterprise gadgets.
        </p>
        
        <div class="flex flex-wrap gap-4">
          <UiButton size="lg" class="rounded-full gap-2 px-8" to="/products">
            Explore Catalog <ChevronRight class="w-5 h-5" />
          </UiButton>
          <UiButton variant="outline" size="lg" class="rounded-full text-white border-white/20 hover:bg-white/10" to="/offers">
            View Special Offers
          </UiButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.8s ease forwards;
}
</style>

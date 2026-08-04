<!-- File: /components/home/HeroSection.vue -->
<script setup lang="ts">
import { Trophy, ChevronRight, Server, Cpu, ArrowUpRight } from 'lucide-vue-next';
</script>

<template>
  <section class="container mx-auto px-4 pt-2">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[540px]">
      
      <!-- Left: Primary Hero (approx 2/3 width on desktop) -->
      <div class="lg:col-span-8 relative rounded-3xl overflow-hidden bg-black text-white flex items-center p-8 md:p-12 shadow-xl group">
        <div class="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=2000" 
            alt="Tech hardware hero banner"
            class="w-full h-full object-cover opacity-45 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
        </div>
        
        <div class="relative z-10 max-w-xl space-y-6">
          <div class="inline-flex items-center gap-2 bg-primary/15 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border border-primary/20 animate-fade-in">
            <Trophy class="w-3.5 h-3.5" />
            <span>#1 Tech Retailer 2026</span>
          </div>
          
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.05] text-white">
            The Future of <span class="text-primary italic">Hardware</span>
          </h1>
          
          <p class="text-base sm:text-lg text-white/80 leading-relaxed font-normal max-w-lg">
            Elevate your digital workflow with exclusive access to top-tier components, enterprise servers, and precision engineering.
          </p>
          
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <UiButton size="lg" class="rounded-full gap-2 px-7 font-semibold" to="/products">
              Explore Catalog <ChevronRight class="w-4 h-4" />
            </UiButton>
            <UiButton variant="outline" size="lg" class="rounded-full text-white border-white/25 hover:bg-white/15 backdrop-blur-sm font-semibold" to="/offers">
              View Special Offers
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Right: Two Stacked Promotional Banners (approx 1/3 width on desktop) -->
      <div class="lg:col-span-4 flex flex-col gap-4 h-full">
        
        <!-- Secondary Banner 1 -->
        <NuxtLink 
          to="/products"
          class="flex-1 relative rounded-2xl overflow-hidden bg-card border border-border/60 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 min-h-[220px]"
        >
          <div class="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1000" 
              alt="Advanced Server Architecture"
              class="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>

          <div class="relative z-10 flex items-start justify-between">
            <span class="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
              <Server class="w-3 h-3" />
              Enterprise Solution
            </span>
            <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
              <ArrowUpRight class="w-4 h-4" />
            </div>
          </div>

          <div class="relative z-10 space-y-1.5 pt-4">
            <h3 class="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
              Advanced Server Architecture
            </h3>
            <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              Custom-configured enterprise server racks & high-density compute solutions for scale.
            </p>
          </div>
        </NuxtLink>

        <!-- Secondary Banner 2 -->
        <NuxtLink 
          to="/offers"
          class="flex-1 relative rounded-2xl overflow-hidden bg-card border border-border/60 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 min-h-[220px]"
        >
          <div class="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=1000" 
              alt="Workstation Customization"
              class="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>

          <div class="relative z-10 flex items-start justify-between">
            <span class="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
              <Cpu class="w-3 h-3" />
              Featured Rig
            </span>
            <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
              <ArrowUpRight class="w-4 h-4" />
            </div>
          </div>

          <div class="relative z-10 space-y-1.5 pt-4">
            <h3 class="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
              Workstation Customization
            </h3>
            <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              Tailored multi-GPU rigs and precision liquid cooling built for professional creators.
            </p>
          </div>
        </NuxtLink>

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


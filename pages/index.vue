<script setup lang="ts">
import { Sparkles, ArrowRight, ShieldCheck, Database, Cpu, HardDrive } from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import ProductCard from '@/components/commerce/ProductCard.vue';

const productService = useProductService();
const categories = productService.getCategories();
const featuredProducts = productService.getFeaturedProducts();

// Map icons to categories
const categoryIcons: Record<string, any> = {
  cat_gpu: Cpu,
  cat_cpu: Database,
  cat_server: HardDrive
};
</script>

<template>
  <div class="min-h-screen pb-24 space-y-24 bg-background text-foreground">
    <!-- Hero Section -->
    <section class="relative py-28 md:py-36 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70rem] h-[70rem] border border-primary/5 rounded-full animate-[spin_120s_linear_infinite]"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] border border-primary/10 rounded-full border-dashed animate-[spin_80s_linear_infinite_reverse]"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10 text-center space-y-10 max-w-4xl">
        <div class="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mx-auto">
          <Sparkles class="w-3.5 h-3.5 text-primary" /> Enterprise Systems & Silicon
        </div>

        <h1 class="text-5xl md:text-8xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Accelerating <span class="italic text-primary">Intelligence</span><br />
          At Silicon Scale.
        </h1>

        <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Premium high-performance processing hardware, deep learning acceleration nodes, and mission-critical server environments. Curated for reliability.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <UiButton to="/category" class="w-full sm:w-auto h-14 px-8 font-bold rounded-full group">
            Explore Hardware Collections <ArrowRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
          <UiButton to="/new-arrivals" variant="outline" class="w-full sm:w-auto h-14 px-8 font-bold rounded-full">
            View Live Arrivals
          </UiButton>
        </div>
      </div>
    </section>

    <!-- Categories / Collections Bento Grid -->
    <section class="container mx-auto px-6">
      <div class="space-y-4 mb-12">
        <div class="text-[10px] uppercase tracking-widest text-primary font-bold">Hardware Verticals</div>
        <h2 class="text-3xl md:text-5xl font-display font-extrabold tracking-tight">Silicon Collections</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
          v-for="cat in categories" 
          :key="cat.id"
          class="group relative bg-muted/30 border border-border/60 hover:border-primary/40 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[300px] transition-all duration-500 overflow-hidden"
        >
          <!-- Background accent -->
          <div class="absolute -right-16 -bottom-16 w-48 h-48 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>

          <div class="space-y-6 relative z-10">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
              <component :is="categoryIcons[cat.id] || Cpu" class="w-7 h-7" />
            </div>
            
            <div class="space-y-2">
              <h3 class="text-2xl font-display font-bold group-hover:text-primary transition-colors">{{ cat.name }}</h3>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ cat.description }}</p>
            </div>
          </div>

          <div class="pt-8 relative z-10">
            <UiButton :to="`/category/${cat.slug}`" variant="outline" class="rounded-full w-full font-bold group">
              Browse {{ cat.name }} <ArrowRight class="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products Bento Grid -->
    <section class="container mx-auto px-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div class="space-y-2">
          <div class="text-[10px] uppercase tracking-widest text-primary font-bold">Selected Hardware</div>
          <h2 class="text-3xl md:text-5xl font-display font-extrabold tracking-tight">Featured Hardware</h2>
        </div>
        <UiButton to="/category" variant="ghost" class="rounded-full font-bold group">
          View Entire Catalog <ArrowRight class="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </UiButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProductCard 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product" 
        />
      </div>
    </section>

    <!-- Trust Banner -->
    <section class="container mx-auto px-6">
      <div class="bg-primary hover:scale-[1.01] transition-transform duration-500 rounded-[3rem] p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 text-black">
        <div class="space-y-6 max-w-xl">
          <div class="inline-flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck class="w-3.5 h-3.5 text-primary" /> Verified Original Hardware
          </div>
          <h3 class="text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-none">
            TechCore Enterprise Grade Compliance
          </h3>
          <p class="text-black/70 font-medium text-base leading-relaxed">
            Every accelerator, compute node, and high-performance workstation matches extreme rigorous reliability protocols, backed by standard manufacturer warranty policies.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-8 shrink-0">
          <div v-for="stat in [
            { label: 'Uptime target', val: '99.9%' },
            { label: 'Shipment Time', val: '24-48 Hours' }
          ]" :key="stat.label" class="space-y-1">
            <p class="text-3xl font-display font-black text-black leading-none">{{ stat.val }}</p>
            <p class="text-[10px] uppercase tracking-widest text-black/50 font-extrabold">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

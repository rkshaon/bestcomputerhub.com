<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, ShieldCheck, Truck, RefreshCw, Trophy } from 'lucide-vue-next';

// Explicitly use the composable (Nuxt usually auto-imports this)
const productService = useProductService();
const featuredProducts = productService.getFeaturedProducts();
const newArrivals = productService.getNewArrivals();
const homeCategories = computed(() => productService.getCategories().filter(c => !c.parentCategoryId));
</script>

<template>
  <div class="space-y-20 pb-20">
    <!-- Hero Section -->
    <section class="relative h-[640px] flex items-center overflow-hidden bg-black text-white">
      <div class="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=2000" 
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
            <UiButton size="lg" class="rounded-full gap-2 px-8" @click="navigateTo('/category')">
              Explore Collection <ChevronRight class="w-5 h-5" />
            </UiButton>
            <UiButton variant="outline" size="lg" class="rounded-full text-white border-white/20 hover:bg-white/10" @click="navigateTo('/offers')">
              View Special Offers
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Value Propositions -->
    <section class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="(item, idx) in [
          { icon: Truck, title: 'Global Delivery', desc: 'Secure shipping to 120+ countries' },
          { icon: ShieldCheck, title: 'Safe Payments', desc: 'Enterprise-grade encryption' },
          { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free policy' },
          { icon: Trophy, title: 'Quality Guard', desc: '2-year minimum warranty' }
        ]" :key="idx" class="flex gap-4 p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all group">
          <div class="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <component :is="item.icon" class="w-6 h-6 text-primary" />
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-base">{{ item.title }}</h4>
            <p class="text-sm text-muted-foreground">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-display font-bold tracking-tight">Shop by <span class="text-primary">Department</span></h2>
        <NuxtLink to="/category" class="text-sm font-medium hover:underline flex items-center gap-1">
          Explore All <ChevronRight class="w-4 h-4" />
        </NuxtLink>
      </div>
      
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink 
          v-for="cat in homeCategories" 
          :key="cat.id" 
          :to="`/category/${cat.slug}`"
          class="aspect-[4/3] rounded-3xl bg-muted overflow-hidden relative group"
        >
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
          <div class="absolute inset-0 flex flex-col justify-end p-6 z-20">
            <h3 class="text-white text-xl font-bold tracking-tight">{{ cat.name }}</h3>
            <p class="text-white/70 text-xs translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              Browse products &rarr;
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h2 class="text-3xl font-display font-bold tracking-tight">Weekly <span class="text-primary">Headliners</span></h2>
          <p class="text-muted-foreground mt-1">Hand-picked premium selections for enthusiasts.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <CommerceProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
    </section>

    <!-- Special Promo Banner -->
    <section class="container mx-auto px-4">
      <div class="rounded-[2.5rem] bg-primary p-12 text-primary-foreground flex flex-col items-center text-center gap-8 overflow-hidden relative">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
        
        <span class="bg-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Enterprise Offer</span>
        <h2 class="text-4xl md:text-6xl font-display font-bold max-w-3xl">Professional Workstations for Remote Innovation.</h2>
        <p class="text-primary-foreground/70 max-w-xl text-lg">Save up to 40% on bulk enterprise hardware orders. Specialized configuration support included.</p>
        <UiButton variant="secondary" size="lg" class="rounded-full shadow-2xl">Contact Solutions Expert</UiButton>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-display font-bold tracking-tight">Fresh in <span class="text-primary">Stock</span></h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <CommerceProductCard v-for="product in newArrivals" :key="product.id" :product="product" />
      </div>
    </section>
  </div>
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

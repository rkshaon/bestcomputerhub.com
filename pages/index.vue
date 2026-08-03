<!-- File: /pages/index.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ChevronRight, ShieldCheck, Truck, RefreshCw, Trophy } from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import { useCategoryService } from '@/composables/useCategoryService';

// Explicitly use the composables (Nuxt usually auto-imports this)
const productService = useProductService();
const brandService = useBrandService();
const categoryService = useCategoryService();

const featuredProducts = productService.getFeaturedProducts();
const newArrivals = productService.getNewArrivals();
const homeCategories = computed(() => productService.getCategories().filter(c => !c.parentCategoryId));

// Initialize brands with standard defaults from product service mapping for high SSR alignment and zero layout pop
const brandsList = ref<any[]>(
  productService.getBrands().map(b => ({
    ...b,
    is_active: b.is_active !== false
  }))
);

// On mount, poll the dynamic client / mock states to capture newly registered / edited administrative partner nodes
onMounted(async () => {
  try {
    const registry = await brandService.getBrandsList();
    if (registry && registry.length > 0) {
      brandsList.value = registry.filter(b => b.is_active !== false);
    }
  } catch (error) {
    console.error('Core Protocol Exception: Failed to poll partner registry on home page slide render.', error);
  }
});
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

    <!-- Brand Marquee (Dribbble Inspired) -->
    <section class="w-full bg-muted/20 border-y py-10 overflow-hidden group">
      <div class="flex whitespace-nowrap animate-marquee">
        <!-- Double the content for seamless looping -->
        <div v-for="i in 2" :key="i" class="flex items-center space-x-16 px-8 select-none">
          <NuxtLink 
            v-for="brand in brandsList" 
            :key="brand.id + '-' + i" 
            :to="'/products?brand=' + encodeURIComponent(brand.name)"
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
    </section>

    <!-- Value Propositions -->
    <section class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <NuxtLink v-for="(item, idx) in [
          { icon: Truck, title: 'Global Delivery', desc: 'Secure shipping to 120+ countries', url: '/support/shipping' },
          { icon: ShieldCheck, title: 'Safe Payments', desc: 'Enterprise-grade encryption', url: '/support/payments' },
          { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free policy', url: '/support/returns' },
          { icon: Trophy, title: 'Quality Guard', desc: '2-year minimum warranty', url: '/support/warranty' }
        ]" :key="idx" :to="item.url" class="flex gap-4 p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group cursor-pointer">
          <div class="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <component :is="item.icon" class="w-6 h-6 text-primary" />
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-base group-hover:text-primary transition-colors text-foreground">{{ item.title }}</h4>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ item.desc }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-display font-bold tracking-tight">Shop by <span class="text-primary">Department</span></h2>
        <NuxtLink to="/products" class="text-sm font-medium hover:underline flex items-center gap-1">
          Explore All <ChevronRight class="w-4 h-4" />
        </NuxtLink>
      </div>
      
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink 
          v-for="cat in homeCategories" 
          :key="cat.id" 
          :to="categoryService.getCategoryUrl(cat)"
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

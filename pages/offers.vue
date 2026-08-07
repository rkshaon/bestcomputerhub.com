<!-- File: /pages/offers.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Tag, Clock, ArrowRight, Zap, Percent, ShoppingCart } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';
import { useProductService } from '@/composables/useProductService';
import { useCartStore } from '@/stores/cart';

useSeoMeta({
  title: 'Special Offers & Deals',
  description: 'Exclusive discounts, flash sales, and special offers on gaming PCs, laptops, graphics cards, and accessories at Best Computer Hub.'
});

const productService = useProductService();
const cartStore = useCartStore();
const offers = productService.getOnSaleProducts();

const addToCart = (product: any) => {
  cartStore.addToCart(product);
};

// Countdown timer (mock)
const timeLeft = ref({
  hours: 14,
  minutes: 42,
  seconds: 19
});

onMounted(() => {
  const interval = setInterval(() => {
    if (timeLeft.value.seconds > 0) {
      timeLeft.value.seconds--;
    } else {
      if (timeLeft.value.minutes > 0) {
        timeLeft.value.minutes--;
        timeLeft.value.seconds = 59;
      } else {
        if (timeLeft.value.hours > 0) {
          timeLeft.value.hours--;
          timeLeft.value.minutes = 59;
          timeLeft.value.seconds = 59;
        }
      }
    }
  }, 1000);
  
  onUnmounted(() => clearInterval(interval));
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Hero Banner -->
    <section class="bg-black text-white py-20 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"></div>
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-3xl space-y-8">
          <div class="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-black animate-pulse">
            <Zap class="w-4 h-4 fill-current" /> Lightning Deals
          </div>
          
          <h1 class="text-5xl md:text-8xl font-display font-extrabold tracking-tight leading-[0.85]">
            Flash <span class="text-primary italic">Sales</span>.
          </h1>
          
          <p class="text-xl text-white/60 max-w-xl leading-relaxed">
            Exclusive discounts on enterprise-grade hardware. These offers refresh every 24 hours. Don't let your upgrade wait.
          </p>

          <div class="flex items-center gap-8 py-4">
            <div v-for="(val, unit) in timeLeft" :key="unit" class="flex flex-col items-center">
              <span class="text-4xl md:text-5xl font-display font-bold tabular-nums">{{ val.toString().padStart(2, '0') }}</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">{{ unit }}</span>
            </div>
            <div class="h-10 w-px bg-white/10 hidden md:block"></div>
            <div class="hidden md:block">
              <p class="text-sm font-bold uppercase tracking-tighter text-primary">Limited stock available</p>
              <p class="text-xs text-white/40">Across all retail clusters</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Offers Grid -->
    <section class="container mx-auto px-4 py-20">
      <div class="flex items-center justify-between mb-12">
        <div class="space-y-1">
          <h2 class="text-3xl font-display font-bold">Today's Selection</h2>
          <p class="text-muted-foreground">High-performance components at clearance prices.</p>
        </div>
        <div class="hidden md:flex items-center gap-2 text-sm font-bold text-primary">
          <Percent class="w-4 h-4" /> Save up to 40%
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div 
          v-for="product in offers" 
          :key="product.id"
          class="group bg-card border rounded-[2.5rem] overflow-hidden flex flex-col hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
        >
          <NuxtLink :to="`/product/${product.slug}`" class="relative aspect-square overflow-hidden bg-muted p-8 block">
            <img 
              :src="product.images[0]" 
              :alt="product.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
            />
            
            <div class="absolute top-6 left-6">
              <div class="bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                SAVE {{ Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) }}%
              </div>
            </div>

            <div class="absolute top-6 right-6">
              <button class="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <Tag class="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </NuxtLink>

          <div class="p-8 flex-grow flex flex-col gap-4">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-widest text-primary">{{ product.brand }}</span>
              <NuxtLink :to="`/product/${product.slug}`" class="block">
                <h3 class="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {{ product.name }}
                </h3>
              </NuxtLink>
            </div>

            <div class="flex items-baseline gap-3">
              <span class="text-2xl font-bold text-foreground">{{ formatCurrency(product.price) }}</span>
              <span class="text-sm text-muted-foreground line-through decoration-primary/30">{{ formatCurrency(product.originalPrice!) }}</span>
            </div>

            <div class="flex-grow">
              <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {{ product.description }}
              </p>
            </div>

            <div class="pt-6 border-t mt-auto flex items-center justify-between gap-4">
               <UiButton 
                variant="outline" 
                class="rounded-full flex-1 h-12 font-bold"
                @click="addToCart(product)"
              >
                Add to Cart
              </UiButton>
              <NuxtLink 
                :to="`/product/${product.slug}`"
                class="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group/btn"
              >
                <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="offers.length === 0" class="py-32 flex flex-col items-center text-center space-y-6">
        <div class="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center">
          <Zap class="w-10 h-10 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold">No active offers</h3>
          <p class="text-muted-foreground max-w-sm">Current flash sales have concluded. Check back shortly for our next hardware drop.</p>
        </div>
        <UiButton variant="outline" class="rounded-full" to="/">Back to Catalog</UiButton>
      </div>
    </section>

    <!-- Promotional Section -->
    <section class="container mx-auto px-4 py-20">
      <div class="bg-primary rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
        <div class="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl text-white"></div>
        
        <div class="max-w-lg space-y-6 relative z-10">
          <h2 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-black">
            B2B Bulk <span class="italic opacity-50">Discounts</span>.
          </h2>
          <p class="text-lg text-black/70 leading-relaxed font-medium">
            Procuring for an entire team? Our enterprise sales division offers tiered pricing for orders exceeding 10 units.
          </p>
          <UiButton variant="secondary" size="lg" class="rounded-full bg-black text-white border-black hover:bg-black/80 h-14 px-10 font-bold">
            Contact Sales Team
          </UiButton>
        </div>

        <div class="relative w-full md:w-1/2 flex justify-center">
          <div class="grid grid-cols-2 gap-4 w-full max-w-md bg-white/20 p-8 rounded-[2rem] backdrop-blur-md border border-white/30 skew-x-3 -rotate-3 scale-110">
            <div v-for="i in 4" :key="i" class="aspect-square bg-white/80 rounded-2xl flex items-center justify-center">
              <ShoppingCart class="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

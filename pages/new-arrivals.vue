<script setup lang="ts">
import { Sparkles, ArrowRight, Zap, ShoppingCart, Filter } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';
import { useProductService } from '@/composables/useProductService';
import { useCartStore } from '@/stores/cart';

const productService = useProductService();
const cartStore = useCartStore();
const newArrivals = productService.getNewArrivals();

const addToCart = (product: any) => {
  cartStore.addToCart(product);
};
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Hero Banner -->
    <section class="bg-primary py-24 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-black/5 opacity-10"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-black/5 rounded-full animate-[spin_60s_linear_infinite]"></div>
      </div>
      
      <div class="container mx-auto px-4 relative z-10 text-center">
        <div class="max-w-3xl mx-auto space-y-8">
          <div class="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles class="w-4 h-4 fill-current text-primary" /> Just Released
          </div>
          
          <h1 class="text-6xl md:text-8xl font-display font-extrabold tracking-tight leading-[0.85] text-black">
            The <span class="italic opacity-50">Newest</span><br />Standard.
          </h1>
          
          <p class="text-xl text-black/60 max-w-xl mx-auto leading-relaxed font-medium">
            Discover the latest breakthroughs in high-performance hardware, fresh from the factory floor.
          </p>
        </div>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="container mx-auto px-4 py-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div class="space-y-1">
          <h2 class="text-3xl font-display font-bold">New Catalog Drops</h2>
          <p class="text-muted-foreground italic">Updated real-time as inventory arrives.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="text-sm font-bold text-muted-foreground uppercase tracking-widest">{{ newArrivals.length }} Products found</div>
          <div class="h-6 w-px bg-border"></div>
          <UiButton variant="ghost" size="sm" class="rounded-full gap-2 font-bold">
            <Filter class="w-4 h-4" /> Filter
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div 
          v-for="product in newArrivals" 
          :key="product.id"
          class="group bg-card border border-transparent rounded-[2.5rem] overflow-hidden flex flex-col hover:border-border transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
        >
          <NuxtLink :to="`/product/${product.slug}`" class="relative aspect-[4/5] overflow-hidden bg-muted p-12 block">
            <img 
              :src="product.images[0]" 
              :alt="product.name"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
            
            <div class="absolute top-6 left-6">
              <div class="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                NEW ARRIVAL
              </div>
            </div>
          </NuxtLink>

          <div class="p-8 flex-grow flex flex-col gap-6">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-primary">{{ product.brand }}</span>
                <span v-if="product.stock < 10" class="text-[9px] font-bold text-red-500 uppercase tracking-widest">Low Stock</span>
              </div>
              <NuxtLink :to="`/product/${product.slug}`" class="block">
                <h3 class="font-display font-bold text-2xl leading-[1.1] group-hover:text-primary transition-colors line-clamp-2">
                  {{ product.name }}
                </h3>
              </NuxtLink>
            </div>

            <div class="mt-auto pt-6 border-t flex items-center justify-between gap-4">
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Investment</span>
                <span class="text-xl font-bold text-foreground">{{ formatCurrency(product.price) }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <UiButton 
                  size="sm"
                  class="rounded-full h-10 w-10 p-0"
                  @click="addToCart(product)"
                >
                  <ShoppingCart class="w-4 h-4" />
                </UiButton>
                <NuxtLink 
                  :to="`/product/${product.slug}`"
                  class="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  <ArrowRight class="w-4 h-4" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="newArrivals.length === 0" class="py-32 flex flex-col items-center text-center space-y-6">
        <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground opacity-20">
          <Sparkles class="w-10 h-10" />
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold">Checking Inventory...</h3>
          <p class="text-muted-foreground max-w-sm">We are currently receiving new shipments. Check back in a few minutes for the latest drops.</p>
        </div>
        <UiButton variant="outline" class="rounded-full" to="/">Return Home</UiButton>
      </div>
    </section>

    <!-- Featured Feature -->
    <section class="container mx-auto px-4 py-20">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-black text-white p-12 md:p-20 rounded-[3rem] relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-1000">
            <Zap class="w-64 h-64 fill-current" />
          </div>
          <div class="relative z-10 space-y-6">
            <h2 class="text-4xl font-display font-bold leading-tight">Join the Inner Circle</h2>
            <p class="text-white/60 text-lg max-w-md">Be the first to know about upcoming drops and exclusive limited-edition components before they hit the general catalog.</p>
            <div class="flex gap-2">
              <input type="email" placeholder="Enter your email" class="bg-white/10 border-none rounded-full px-6 flex-grow h-14 focus:ring-1 ring-primary outline-none" />
              <UiButton class="rounded-full h-14 px-8 font-bold">Notify Me</UiButton>
            </div>
          </div>
        </div>
        
        <div class="bg-muted p-12 md:p-20 rounded-[3rem] flex flex-col justify-center space-y-6">
          <div class="flex -space-x-4 mb-4">
            <div v-for="i in 5" :key="i" class="w-12 h-12 rounded-full border-4 border-muted bg-primary flex items-center justify-center text-[10px] font-black">
              USER
            </div>
            <div class="w-12 h-12 rounded-full border-4 border-muted bg-white flex items-center justify-center text-[10px] font-black text-black">
              +2k
            </div>
          </div>
          <h2 class="text-3xl font-display font-bold">Trusted by 2,000+ Teams</h2>
          <p class="text-muted-foreground text-lg">From silicon valley startups to enterprise giants, we supply the hardware that powers the next generation of software.</p>
          <div class="pt-4">
            <NuxtLink to="/blog" class="inline-flex items-center gap-2 font-bold group">
              Read Our Vision <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

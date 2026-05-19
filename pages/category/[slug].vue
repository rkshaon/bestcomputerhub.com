<script setup lang="ts">
import { Cpu, Smartphone, Headphones, Watch, Tv, Heart, Star, ChevronLeft, ArrowRight } from 'lucide-vue-next';
import { CATEGORIES, PRODUCTS } from '~/mock/data';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { cn } from '~/utils';

const route = useRoute();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

const slug = computed(() => String(route.params.slug));

const category = computed(() => {
  return CATEGORIES.find(c => c.slug === slug.value) || {
    name: slug.value,
    slug: slug.value,
    description: `curated selection of ${slug.value} options.`,
    image: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=600'
  };
});

const categoryProducts = computed(() => {
  return PRODUCTS.filter(p => p.category === slug.value);
});

const getCategoryIcon = (slugStr: string) => {
  switch (slugStr) {
    case 'laptops': return Cpu;
    case 'smartphones': return Smartphone;
    case 'audio': return Headphones;
    case 'wearables': return Watch;
    default: return Tv;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left animate-in fade-in duration-500">
    
    <!-- Link Back -->
    <NuxtLink to="/products" class="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 mb-8 transition-colors">
      <ChevronLeft class="w-4 h-4" /> Global Catalog
    </NuxtLink>

    <!-- Category Header Card banner with background blur -->
    <div class="relative h-64 rounded-[2.5rem] overflow-hidden border border-slate-200/50 dark:border-slate-800 bg-slate-900 text-white mb-10 flex items-center">
      <img :src="category.image" :alt="category.name" class="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div>

      <div class="relative p-8 md:p-12 space-y-4 max-w-2xl">
        <div class="w-12 h-12 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
          <component :is="getCategoryIcon(slug)" class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <h1 class="text-3xl md:text-4xl font-display font-black uppercase tracking-tight">{{ category.name }} Sector</h1>
          <p class="text-xs text-slate-350 leading-relaxed max-w-lg">{{ category.description }}</p>
        </div>
      </div>
    </div>

    <!-- Product list -->
    <div v-if="categoryProducts.length === 0" class="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <p class="text-xs font-black uppercase text-slate-400">Section Inert</p>
      <p class="text-xs text-slate-500 mt-2">Currently preparing direct import cargo entries for this sector.</p>
      <NuxtLink to="/products" class="mt-6 inline-block">
        <UiButton variant="rose" size="sm">Explore Catalog</UiButton>
      </NuxtLink>
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div 
          v-for="prod in categoryProducts" 
          :key="prod.id"
          class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-[410px] relative hover:border-rose-500/20 dark:hover:border-rose-500/20 hover:scale-[1.01] transition-all duration-300 shadow-sm"
        >
          <!-- Special conditions badging -->
          <div class="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span v-if="prod.isOnSale" class="bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">SALE</span>
            <span v-if="prod.isNew" class="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">NEW</span>
          </div>

          <!-- Product Image -->
          <div class="relative">
            <button 
              @click="wishlistStore.toggleWishlist(prod)"
              class="absolute top-0 right-0 z-10 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Heart :class="cn('w-4 h-4', wishlistStore.isInWishlist(prod.id) && 'text-rose-500 fill-rose-500')" />
            </button>

            <NuxtLink :to="`/products/${prod.slug}`" class="block rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 mt-2">
              <img :src="prod.image" :alt="prod.name" class="w-full h-44 object-cover group-hover:scale-103 transition-transform duration-500" />
            </NuxtLink>
          </div>

          <!-- Description details -->
          <div class="space-y-2 mt-4">
            <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              <span>{{ prod.brand }}</span>
              <span class="flex items-center gap-1"><Star class="w-3 text-amber-400 fill-amber-400 font-bold" /> {{ prod.rating }}</span>
            </div>
            
            <NuxtLink :to="`/products/${prod.slug}`" class="block min-h-[36px]">
              <h3 class="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2 hover:text-rose-500 transition-all">
                {{ prod.name }}
              </h3>
            </NuxtLink>
            
            <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
              {{ prod.description }}
            </p>
          </div>

          <!-- CTA actions -->
          <div class="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-900 pt-4">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-400 tracking-widest uppercase text-[8px] leading-none mb-1">PRICE</span>
              <span class="text-base font-mono font-black text-slate-900 dark:text-white">
                ${{ prod.price }}
                <span v-if="prod.originalPrice" class="text-[10px] text-slate-400 line-through font-normal">${{ prod.originalPrice }}</span>
              </span>
            </div>

            <UiButton 
              size="sm" 
              variant="secondary"
              class="h-8 text-[9px] uppercase font-black px-4 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500"
              @click="cartStore.addToCart(prod)"
            >
              Add to Cart
            </UiButton>
          </div>
        </div>
      </div>

      <div class="pt-6 border-t border-slate-100 dark:border-slate-950 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
        <span>Curated {{ categoryProducts.length }} Active Device Configurations</span>
        <span>Secure ISO Node</span>
      </div>
    </div>

  </div>
</template>

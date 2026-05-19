<script setup lang="ts">
import { Heart, Trash2, ShoppingBag, Star, ArrowRight } from 'lucide-vue-next';
import { useWishlistStore } from '~/stores/wishlist';
import { useCartStore } from '~/stores/cart';
import { cn } from '~/utils';

const wishlistStore = useWishlistStore();
const cartStore = useCartStore();

const handleAddToCartAndRemove = (product: any) => {
  cartStore.addToCart(product, 1);
  wishlistStore.removeFromWishlist(product.id);
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left animate-in fade-in duration-500">
    
    <!-- Top Header -->
    <div class="border-b border-slate-200/50 dark:border-slate-800 pb-6 mb-10">
      <h1 class="text-3xl font-display font-black tracking-tight flex items-center gap-3">
        <Heart class="w-8 h-8 text-rose-500 fill-rose-500" /> Gadget Wishlist Ledger
      </h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Keep track of priority capex items and convert them into hardware allocations when ready.</p>
    </div>

    <!-- Empty Wishlist State -->
    <div v-if="wishlistStore.wishlistCount === 0" class="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-950/30 max-w-xl mx-auto space-y-6">
      <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
        <Heart class="w-8 h-8" />
      </div>
      <div>
        <h3 class="text-sm font-black uppercase tracking-widest">Wishlist Inert</h3>
        <p class="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">No high-spec gadget configurations have been pinned to this terminal yet.</p>
      </div>
      <NuxtLink to="/products">
        <UiButton variant="rose" size="sm">Explore Catalog</UiButton>
      </NuxtLink>
    </div>

    <!-- Wishlist items Grid -->
    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div 
          v-for="prod in wishlistStore.items" 
          :key="prod.id"
          class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-[410px] relative hover:border-rose-500/20 dark:hover:border-rose-500/20 hover:scale-[1.01] transition-all duration-300 shadow-sm"
        >
          <!-- Special conditions badging -->
          <div class="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span v-if="prod.isOnSale" class="bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg leading-none">SALE</span>
            <span v-if="prod.isNew" class="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg leading-none">NEW</span>
          </div>

          <!-- Product Image & Trash Removal action -->
          <div class="relative">
            <button 
              @click="wishlistStore.removeFromWishlist(prod.id)"
              class="absolute top-0 right-0 z-10 p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white border-none cursor-pointer hover:scale-105 active:scale-[0.9] transition-all"
            >
              <Trash2 class="w-4 h-4" />
            </button>

            <NuxtLink :to="`/products/${prod.slug}`" class="block rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 mt-2">
              <img :src="prod.image" :alt="prod.name" class="w-full h-44 object-cover" />
            </NuxtLink>
          </div>

          <!-- Description meta -->
          <div class="space-y-2 mt-4 text-left">
            <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">
              <span>{{ prod.brand }}</span>
              <span class="flex items-center gap-1"><Star class="w-3 text-amber-400 fill-amber-400" /> {{ prod.rating }}</span>
            </div>
            
            <NuxtLink :to="`/products/${prod.slug}`" class="block min-h-[36px]">
              <h3 class="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2 hover:text-rose-500 transition-colors">
                {{ prod.name }}
              </h3>
            </NuxtLink>
            
            <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
              {{ prod.description }}
            </p>
          </div>

          <!-- Price & Convert to Cart actions -->
          <div class="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-900 pt-4">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-400 tracking-widest uppercase text-[8px] leading-none mb-1">PRICE</span>
              <span class="text-base font-mono font-black text-slate-900 dark:text-white">
                ${{ prod.price }}
              </span>
            </div>

            <UiButton 
              size="sm" 
              variant="rose"
              class="h-8 text-[9px] uppercase font-black px-4 rounded-xl shadow-md shadow-rose-500/15"
              @click="handleAddToCartAndRemove(prod)"
            >
              Add & Buy
            </UiButton>
          </div>
        </div>
      </div>

      <div class="pt-6 border-t border-slate-100 dark:border-slate-950 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
        <span>Displaying {{ wishlistStore.wishlistCount }} priority wishes</span>
        <span>TechCore Terminal Node</span>
      </div>
    </div>

  </div>
</template>

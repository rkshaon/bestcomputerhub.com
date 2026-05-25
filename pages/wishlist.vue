<!-- File: /pages/wishlist.vue -->
<script setup lang="ts">
import { Heart, ShoppingCart, Trash2, ArrowRight, PackageSearch } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';

const wishlistStore = useWishlistStore();
const cartStore = useCartStore();

const moveToCart = (product: any) => {
  cartStore.addToCart(product);
  wishlistStore.removeFromWishlist(product.id);
};

const removeFromWishlist = (productId: string) => {
  wishlistStore.removeFromWishlist(productId);
};
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Hero Header -->
    <section class="bg-muted/30 py-20 border-b">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="space-y-4 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
              <Heart class="w-3.5 h-3.5 fill-current" /> Saved for later
            </div>
            <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
              My <span class="italic text-primary">Wishlist</span>
            </h1>
            <p class="text-lg text-muted-foreground">
              Manage your curated list of high-performance components and hardware.
            </p>
          </div>
          
          <div v-if="wishlistStore.items.length > 0" class="flex items-center gap-4">
            <UiButton variant="outline" size="sm" class="rounded-full font-bold" @click="wishlistStore.clearWishlist()">
              Clear All
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Wishlist Grid -->
    <section class="container mx-auto px-4 py-20">
      <div v-if="wishlistStore.items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div 
          v-for="product in wishlistStore.items" 
          :key="product.id"
          class="group bg-card border border-transparent rounded-[2.5rem] overflow-hidden flex flex-col hover:border-border transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
        >
          <NuxtLink :to="`/product/${product.slug}`" class="relative aspect-[4/5] overflow-hidden bg-muted p-12 block">
            <img 
              :src="product.images[0]" 
              :alt="product.name"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
            
            <button 
              @click.prevent="removeFromWishlist(product.id)"
              class="absolute top-6 right-6 w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </NuxtLink>

          <div class="p-8 flex-grow flex flex-col gap-6">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-primary">{{ product.brand }}</span>
              </div>
              <NuxtLink :to="`/product/${product.slug}`" class="block">
                <h3 class="font-display font-bold text-2xl leading-[1.1] group-hover:text-primary transition-colors line-clamp-2">
                  {{ product.name }}
                </h3>
              </NuxtLink>
            </div>

            <div class="mt-auto pt-6 border-t flex items-center justify-between gap-4">
              <div class="flex flex-col">
                <span class="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Price</span>
                <span class="text-xl font-bold text-foreground">{{ formatCurrency(product.price) }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <UiButton 
                  size="sm"
                  class="rounded-full h-10 px-4 font-bold gap-2"
                  @click="moveToCart(product)"
                >
                  <ShoppingCart class="w-4 h-4" /> Add to Cart
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-32 flex flex-col items-center text-center space-y-8">
        <div class="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center text-muted-foreground/20 rotate-12">
          <Heart class="w-16 h-16" />
        </div>
        <div class="space-y-3">
          <h2 class="text-3xl font-display font-bold">Your wishlist is empty</h2>
          <p class="text-muted-foreground max-w-sm mx-auto">
            Explore our collection and save the items you're interested in for quick access later.
          </p>
        </div>
        <UiButton to="/category" variant="primary" class="rounded-full px-10 h-14 font-extrabold shadow-lg shadow-primary/20">
          Start Exploring
        </UiButton>
      </div>
    </section>

    <!-- Recommendations / Featured -->
    <section v-if="wishlistStore.items.length > 0" class="container mx-auto px-4 py-20 border-t">
       <div class="flex items-center justify-between mb-12">
          <h2 class="text-3xl font-display font-bold">Recommended for You</h2>
          <NuxtLink to="/new-arrivals" class="text-sm font-bold flex items-center gap-2 group">
            Browse New <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
       </div>
       <div class="flex items-center justify-center py-20 bg-muted/30 rounded-[3rem] border border-dashed">
          <div class="text-center space-y-4">
            <PackageSearch class="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
            <p class="text-muted-foreground font-medium italic">Personalized recommendations arriving soon.</p>
          </div>
       </div>
    </section>
  </div>
</template>

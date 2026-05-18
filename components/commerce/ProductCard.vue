<script setup lang="ts">
import { Star, ShoppingCart, Heart } from 'lucide-vue-next';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils';

const props = defineProps<{
  product: Product;
}>();

const cartStore = useCartStore();
</script>

<template>
  <div class="group relative bg-card border rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300">
    <!-- Image -->
    <div class="aspect-square overflow-hidden bg-muted/30 relative">
      <img 
        :src="product.images[0]" 
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <span v-if="product.isNew" class="bg-primary text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">New</span>
        <span v-if="product.onSale" class="bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Sale</span>
      </div>

      <!-- Quick Actions -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
        <button class="w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-lg">
          <Heart class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-widest">{{ product.brand }}</span>
        <div class="flex items-center gap-1 text-yellow-500">
          <Star class="w-3 h-3 fill-current" />
          <span class="text-xs font-bold text-foreground">{{ product.rating }}</span>
        </div>
      </div>

      <NuxtLink :to="`/product/${product.slug}`" class="block group/link">
        <h3 class="font-bold text-sm line-clamp-2 min-h-[40px] group-hover/link:text-primary transition-colors mb-3">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span v-if="product.originalPrice" class="text-xs text-muted-foreground line-through decoration-destructive/30">
            {{ formatCurrency(product.originalPrice) }}
          </span>
          <span class="font-display font-bold text-lg text-primary">
            {{ formatCurrency(product.price) }}
          </span>
        </div>
        
        <UiButton size="icon" variant="primary" @click="cartStore.addToCart(product)" class="rounded-xl">
          <ShoppingCart class="w-5 h-5" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

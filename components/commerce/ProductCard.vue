<!-- File: /components/commerce/ProductCard.vue -->
<script setup lang="ts">
import { Star, ShoppingCart, Package } from 'lucide-vue-next';
import type { Product } from '@/types';
import { formatCurrency, decodeHtmlEntities } from '@/utils';
import { useCartStore } from '@/stores/cart';

const props = defineProps<{
  product: Product;
}>();

const cartStore = useCartStore();
</script>

<template>
  <div class="group relative bg-card border rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300">
    <!-- Image -->
    <div class="aspect-square overflow-hidden bg-muted/30 relative flex items-center justify-center">
      <img 
        v-if="product.images && product.images.length > 0 && product.images[0]"
        :src="product.images[0]" 
        :alt="decodeHtmlEntities(product.name)"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center p-6 text-muted-foreground/50">
        <Package class="w-10 h-10 stroke-1 mb-2 text-muted-foreground/40" />
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center line-clamp-1">{{ decodeHtmlEntities(product.brand) || 'Tech Hardware' }}</span>
      </div>
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <span v-if="product.isNew" class="bg-primary text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">New</span>
        <span v-if="product.onSale" class="bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Sale</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3.5 sm:p-5">
      <div class="flex items-center justify-between mb-1.5 sm:mb-2">
        <span class="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[100px] sm:max-w-none">{{ decodeHtmlEntities(product.brand) }}</span>
        <div class="flex items-center gap-1 text-yellow-500 shrink-0">
          <Star class="w-3 h-3 fill-current" />
          <span class="text-[10px] sm:text-xs font-bold text-foreground">{{ product.rating }}</span>
        </div>
      </div>

      <NuxtLink :to="`/product/${product.slug}/`" class="block group/link">
        <h3 class="font-bold text-xs sm:text-sm line-clamp-2 min-h-[32px] sm:min-h-[40px] group-hover/link:text-primary transition-colors mb-2 sm:mb-3 leading-snug">
          {{ decodeHtmlEntities(product.name) }}
        </h3>
      </NuxtLink>

      <div class="flex items-center justify-between gap-1">
        <div class="flex flex-col min-w-0">
          <span v-if="product.originalPrice" class="text-[10px] sm:text-xs text-muted-foreground line-through decoration-destructive/30 truncate">
            {{ formatCurrency(product.originalPrice) }}
          </span>
          <span class="font-display font-bold text-sm sm:text-lg text-primary truncate">
            {{ formatCurrency(product.price) }}
          </span>
        </div>
        
        <UiButton size="icon" variant="primary" @click="cartStore.addToCart(product)" class="rounded-xl h-8 w-8 sm:h-10 sm:w-10 shrink-0" title="Add to cart" aria-label="Add to cart">
          <ShoppingCart class="w-4 h-4 sm:w-5 sm:h-5" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

<!-- File: /components/commerce/ProductCard.vue -->
<script setup lang="ts">
import { Star, ShoppingCart, Package } from 'lucide-vue-next';
import type { Product } from '@/types';
import { formatCurrency, decodeHtmlEntities } from '@/utils';
import { useCartStore } from '@/stores/cart';

const props = withDefaults(defineProps<{
  product: Product;
  compact?: boolean;
}>(), {
  compact: false
});

const cartStore = useCartStore();
</script>

<template>
  <div 
    :class="[
      'group relative bg-card border rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300',
      compact ? 'flex flex-col' : ''
    ]"
  >
    <!-- Image Area -->
    <div 
      :class="[
        'overflow-hidden bg-muted/30 relative flex items-center justify-center',
        compact ? 'h-32 sm:h-36 w-full p-2' : 'aspect-square'
      ]"
    >
      <img 
        v-if="product.images && product.images.length > 0 && product.images[0]"
        :src="product.images[0]" 
        :alt="decodeHtmlEntities(product.name)"
        :class="[
          'group-hover:scale-105 transition-transform duration-500',
          compact ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'
        ]"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center p-4 text-muted-foreground/50">
        <Package :class="[compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2', 'stroke-1 text-muted-foreground/40']" />
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center line-clamp-1">
          {{ decodeHtmlEntities(product.brand) || 'Tech Hardware' }}
        </span>
      </div>
      
      <!-- Badges -->
      <div class="absolute top-2 left-2 flex flex-col gap-1">
        <span v-if="product.isNew" class="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">New</span>
        <span v-if="product.onSale" class="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Sale</span>
      </div>
    </div>

    <!-- Content Area -->
    <div :class="[compact ? 'p-2.5 sm:p-3 flex flex-col flex-grow justify-between' : 'p-3.5 sm:p-5']">
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[100px]">
            {{ decodeHtmlEntities(product.brand) }}
          </span>
          <div v-if="product.rating" class="flex items-center gap-0.5 text-yellow-500 shrink-0">
            <Star class="w-3 h-3 fill-current" />
            <span class="text-[10px] font-bold text-foreground">{{ product.rating }}</span>
          </div>
        </div>

        <NuxtLink :to="`/product/${product.slug}/`" class="block group/link mb-2">
          <h3 :class="[
            'font-bold group-hover/link:text-primary transition-colors line-clamp-2 leading-snug',
            compact ? 'text-xs min-h-[2.1rem]' : 'text-xs sm:text-sm min-h-[32px] sm:min-h-[40px]'
          ]">
            {{ decodeHtmlEntities(product.name) }}
          </h3>
        </NuxtLink>
      </div>

      <div class="flex items-center justify-between gap-1 mt-auto pt-1">
        <div class="flex flex-col min-w-0">
          <span v-if="product.originalPrice && product.originalPrice > product.price" class="text-[10px] text-muted-foreground line-through decoration-destructive/30 truncate">
            {{ formatCurrency(product.originalPrice) }}
          </span>
          <span :class="[
            'font-display font-bold text-primary truncate',
            compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'
          ]">
            {{ formatCurrency(product.price) }}
          </span>
        </div>
        
        <UiButton 
          size="icon" 
          variant="primary" 
          @click="cartStore.addToCart(product)" 
          :class="compact ? 'rounded-lg shrink-0 h-7 w-7 sm:h-8 sm:w-8' : 'rounded-xl shrink-0 h-8 w-8 sm:h-10 sm:w-10'" 
          title="Add to cart" 
          aria-label="Add to cart"
        >
          <ShoppingCart :class="compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

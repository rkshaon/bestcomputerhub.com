<!-- File: /pages/cart.vue -->
<script setup lang="ts">
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck } from 'lucide-vue-next';
import { useCartStore } from '@/stores/cart';
import { formatCurrency } from '@/utils';

useSeoMeta({
  title: 'Shopping Cart',
  description: 'View your shopping cart at Best Computer Hub. Authentic gaming PCs, laptops, computer components, and accessories in Bangladesh.'
});

const cartStore = useCartStore();
const productService = useProductService();

const updateQty = (id: string, delta: number) => {
  const item = cartStore.items.find(i => i.product.id === id);
  if (item) {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      cartStore.removeFromCart(id);
    } else {
      cartStore.updateQuantity(id, newQty);
    }
  }
};
</script>

<template>
  <div class="py-10 sm:py-16 bg-muted/20 min-h-screen">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="flex items-center gap-3 mb-8">
        <NuxtLink to="/products" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft class="w-4 h-4" />
          Continue Shopping
        </NuxtLink>
      </div>

      <h1 class="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-8">Shopping Cart</h1>

      <div v-if="cartStore.items.length === 0" class="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <ShoppingBag class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p class="text-muted-foreground text-sm mb-6">Looks like you haven't added any authentic computer components or laptops to your cart yet.</p>
        <UiButton to="/products" class="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20">
          Browse Products
        </UiButton>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Cart Items List -->
        <div class="lg:col-span-8 space-y-4">
          <div 
            v-for="item in cartStore.items" 
            :key="item.product.id"
            class="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm hover:border-primary/30 transition-all"
          >
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted/50 p-2 shrink-0 flex items-center justify-center overflow-hidden">
              <img :src="item.product.images[0]" :alt="item.product.name" class="max-w-full max-h-full object-contain" />
            </div>

            <div class="flex-1 text-center sm:text-left">
              <NuxtLink :to="`/product/${item.product.slug}/`" class="font-bold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base">
                {{ item.product.name }}
              </NuxtLink>
              <p class="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">SKU: {{ item.product.sku }}</p>
              <div class="text-primary font-black text-base sm:text-lg mt-2">
                {{ formatCurrency(item.product.price) }}
              </div>
            </div>

            <div class="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
              <div class="flex items-center border border-border rounded-xl bg-muted/30 overflow-hidden">
                <button 
                  type="button"
                  class="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  @click="updateQty(item.product.id, -1)"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>
                <span class="w-10 text-center font-bold text-xs sm:text-sm">{{ item.quantity }}</span>
                <button 
                  type="button"
                  class="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  @click="updateQty(item.product.id, 1)"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                type="button" 
                class="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                title="Remove item"
                aria-label="Remove item"
                @click="cartStore.removeFromCart(item.product.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Column -->
        <div class="lg:col-span-4">
          <div class="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
            <h3 class="text-lg font-bold text-foreground border-b border-border/60 pb-4">Order Summary</h3>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span class="font-bold text-foreground">{{ formatCurrency(cartStore.totalPrice) }}</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Estimated Shipping</span>
                <span class="font-semibold text-emerald-600 dark:text-emerald-400">Calculated at Checkout</span>
              </div>
              <div class="border-t border-border/60 pt-3 flex justify-between text-base font-black text-foreground">
                <span>Total</span>
                <span class="text-primary text-xl">{{ formatCurrency(cartStore.totalPrice) }}</span>
              </div>
            </div>

            <UiButton to="/checkout" class="w-full rounded-full h-12 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              Proceed to Checkout
              <ArrowRight class="w-4 h-4" />
            </UiButton>

            <div class="space-y-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <div class="flex items-center gap-2">
                <ShieldCheck class="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Genuine Products with Brand Warranty</span>
              </div>
              <div class="flex items-center gap-2">
                <Truck class="w-4 h-4 text-primary shrink-0" />
                <span>Fast & Safe Nationwide Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

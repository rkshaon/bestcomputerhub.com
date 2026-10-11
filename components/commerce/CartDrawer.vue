<!-- File: /components/commerce/CartDrawer.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { decodeHtmlEntities } from '@/utils';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';

const uiStore = useUIStore();
const cartStore = useCartStore();

const isCheckoutLoading = ref(false);

const handleCheckout = () => {
  isCheckoutLoading.value = true;
  // Simulate checkout redirection
  setTimeout(() => {
    isCheckoutLoading.value = false;
    navigateTo('/checkout');
    uiStore.isCartOpen = false;
  }, 1000);
};
</script>

<template>
  <div 
    v-if="uiStore.isCartOpen" 
    class="fixed inset-0 z-[60] flex justify-end"
  >
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
      @click="uiStore.isCartOpen = false"
    ></div>

    <!-- Drawer Content -->
    <div 
      class="relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-slide-in"
    >
      <!-- Header -->
      <div class="p-4 sm:p-6 border-b flex items-center justify-between bg-card/30">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-5 h-5 shrink-0" />
          <h2 class="font-display font-bold text-lg sm:text-xl truncate">My Bag ({{ cartStore.totalItems }})</h2>
        </div>
        <button 
          @click="uiStore.isCartOpen = false"
          class="p-2 hover:bg-accent rounded-full transition-colors shrink-0"
          title="Close cart"
          aria-label="Close cart"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Items -->
      <div class="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div 
          v-if="cartStore.items.length === 0"
          class="h-full flex flex-col items-center justify-center text-center space-y-4 py-12"
        >
          <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <ShoppingBag class="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 class="font-bold text-lg">Your cart is empty</h3>
          <p class="text-sm text-muted-foreground max-w-xs">It looks like you haven't added any tech to your cart yet.</p>
          <UiButton @click="uiStore.isCartOpen = false">Start Shopping</UiButton>
        </div>

        <div 
          v-for="item in cartStore.items" 
          :key="item.productId || item.id || item.product?.id"
          class="flex gap-3 sm:gap-4 group items-start"
        >
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0 border">
            <img :src="item.product?.images?.[0] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80'" :alt="decodeHtmlEntities(item.product?.name || 'Product')" class="w-full h-full object-cover" />
          </div>
          <div class="flex-grow min-w-0 space-y-1">
            <div class="flex justify-between items-start gap-2">
              <h4 class="font-bold text-xs sm:text-sm line-clamp-2 break-words flex-1 min-w-0">{{ decodeHtmlEntities(item.product?.name || 'Product') }}</h4>
              <button 
                @click="cartStore.removeFromCart(Number(item.productId || item.id || item.product?.id))"
                class="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                title="Remove item"
                aria-label="Remove item"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[11px] sm:text-xs text-muted-foreground truncate">{{ decodeHtmlEntities(item.product?.brand || '') }}</p>
            <div class="flex items-center justify-between mt-2 sm:mt-3 gap-2">
              <div class="flex items-center gap-1 sm:gap-3 bg-muted rounded-lg p-1 shrink-0">
                <button 
                  @click="cartStore.updateQuantity(Number(item.productId || item.id || item.product?.id), item.quantity - 1)"
                  class="p-1 hover:bg-background rounded transition-colors disabled:opacity-30"
                  :disabled="item.quantity <= 1"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <Minus class="w-3 h-3" />
                </button>
                <span class="text-xs font-bold w-4 text-center">{{ item.quantity }}</span>
                <button 
                  @click="cartStore.updateQuantity(Number(item.productId || item.id || item.product?.id), item.quantity + 1)"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <Plus class="w-3 h-3" />
                </button>
              </div>
              <span class="font-bold text-xs sm:text-sm truncate">{{ formatCurrency((item.product?.price || 0) * item.quantity) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="cartStore.items.length > 0" class="p-4 sm:p-6 border-t space-y-3 sm:space-y-4 bg-muted/10 shrink-0">
        <div class="space-y-1.5 sm:space-y-2">
          <div class="flex justify-between text-xs sm:text-sm">
            <span class="text-muted-foreground">Subtotal</span>
            <span>{{ formatCurrency(cartStore.totalPrice) }}</span>
          </div>
          <div class="flex justify-between text-xs sm:text-sm">
            <span class="text-muted-foreground">Estimated Shipping</span>
            <span class="text-green-600 font-medium">Free</span>
          </div>
          <div class="flex justify-between text-base sm:text-lg font-bold pt-1 sm:pt-2 border-t border-border/50">
            <span>Total</span>
            <span>{{ formatCurrency(cartStore.totalPrice) }}</span>
          </div>
        </div>
        
        <UiButton 
          full-width 
          size="lg" 
          class="w-full rounded-xl gap-2 font-bold text-sm sm:text-base py-2.5 sm:py-3"
          @click="handleCheckout"
          :disabled="isCheckoutLoading"
        >
          {{ isCheckoutLoading ? 'Processing...' : 'Complete Checkout' }}
          <ArrowRight v-if="!isCheckoutLoading" class="w-4 h-4 sm:w-5 sm:h-5" />
        </UiButton>
        <p class="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium">
          Taxes calculated at next step
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>

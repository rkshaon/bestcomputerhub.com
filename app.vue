<script setup lang="ts">
import { useUIStore } from '~/stores/ui';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { useAuthStore } from '~/stores/auth';

const uiStore = useUIStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();

// Initialize stores on client mount
onMounted(() => {
  uiStore.initTheme();
  cartStore.initCart();
  wishlistStore.initWishlist();
  authStore.initAuth();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

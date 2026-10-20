<!-- File: /components/layout/BottomNav.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { 
  Home, 
  Cpu, 
  User, 
  ShoppingBag, 
  Menu, 
  X, 
  Sliders, 
  PackageSearch 
} from 'lucide-vue-next';
import { useRoute } from '#app';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { toastInfo } from '@/composables/useToast';


const route = useRoute();
const uiStore = useUIStore();
const authStore = useAuthStore();
const cartStore = useCartStore();

// Hide bottom nav on admin routes
const isVisible = computed(() => {
  return !route.path.startsWith('/admin');
});

// Active route checks
const isHomeActive = computed(() => route.path === '/');
const isAccountActive = computed(() => route.path.startsWith('/my-account') || route.path.startsWith('/login'));
const isCartActive = computed(() => uiStore.isCartOpen || route.path.startsWith('/cart'));
const isTrackActive = computed(() => route.path.startsWith('/my-account'));

const accountLink = computed(() => {
  return authStore.isLoggedIn ? '/my-account/' : '/login/';
});

const accountLabel = computed(() => {
  return authStore.isLoggedIn ? 'Account' : 'Login';
});

const handleToolsClick = () => {
  toastInfo('Tools & utilities coming soon');
};

const handleCartClick = () => {
  uiStore.toggleCart();
};

const handleMenuClick = () => {
  uiStore.toggleMobileMenu();
};
</script>

<template>
  <nav
    v-if="isVisible"
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] md:hidden pb-[env(safe-area-inset-bottom,0px)]"
    aria-label="Mobile Bottom Navigation"
  >
    <div class="grid grid-cols-7 items-center h-14 max-w-lg mx-auto w-full px-1 text-slate-300">
      <!-- 1. Home -->
      <NuxtLink
        to="/"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        :class="isHomeActive ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'"
        title="Home"
        aria-label="Home"
      >
        <Home class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Home</span>
      </NuxtLink>

      <!-- 2. PC Builder (Disabled) -->
      <button
        type="button"
        disabled
        aria-disabled="true"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg text-slate-600 cursor-not-allowed select-none opacity-40 focus:outline-none"
        title="PC Builder coming soon"
        aria-label="PC Builder (coming soon)"
        @click.prevent
      >
        <Cpu class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Builder</span>
      </button>

      <!-- 3. Account / Login -->
      <NuxtLink
        :to="accountLink"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        :class="isAccountActive ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'"
        :title="accountLabel"
        :aria-label="accountLabel"
      >
        <User class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">{{ accountLabel }}</span>
      </NuxtLink>

      <!-- 4. Cart -->
      <button
        type="button"
        @click="handleCartClick"
        class="relative flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
        :class="isCartActive ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'"
        title="Shopping Cart"
        aria-label="Cart"
      >
        <div class="relative shrink-0 mb-1">
          <ShoppingBag class="w-4 h-4" />
          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold h-3.5 min-w-3.5 px-1 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
          </span>
        </div>
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Cart</span>
      </button>

      <!-- 5. Menu -->
      <button
        type="button"
        @click="handleMenuClick"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
        :class="uiStore.isMobileMenuOpen ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'"
        title="Toggle Menu"
        aria-label="Menu"
      >
        <component :is="uiStore.isMobileMenuOpen ? X : Menu" class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Menu</span>
      </button>

      <!-- 6. Tools -->
      <button
        type="button"
        @click="handleToolsClick"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
        title="Tools"
        aria-label="Tools"
      >
        <Sliders class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Tools</span>
      </button>

      <!-- 7. Track Order -->
      <NuxtLink
        to="/my-account/"
        class="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        :class="isTrackActive ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'"
        title="Track Order"
        aria-label="Track Order"
      >
        <PackageSearch class="w-4 h-4 shrink-0 mb-1" />
        <span class="text-[9px] tracking-tight leading-none text-center truncate w-full">Track</span>
      </NuxtLink>
    </div>
  </nav>
</template>

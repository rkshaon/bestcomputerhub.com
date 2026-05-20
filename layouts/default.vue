<script setup lang="ts">
import { 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  ChevronDown, 
  LogOut,
  Settings,
  Trash2,
  ArrowRight,
  Shield,
  HelpCircle,
  Truck,
  RotateCcw,
  Mail
} from 'lucide-vue-next';
import { useUIStore } from '~/stores/ui';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { useAuthStore } from '~/stores/auth';
import { cn } from '~/utils';

const uiStore = useUIStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const route = useRoute();

const isCartOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isThemeMenuOpen = ref(false);
const isProfileOpen = ref(false);

const emailSubscription = ref('');
const showSubscriptionToast = ref(false);

const navigation = [
  { name: 'Shop All', href: '/products' },
  { name: 'Laptops', href: '/category/laptops' },
  { name: 'Smartphones', href: '/category/smartphones' },
  { name: 'Audio', href: '/category/audio' },
  { name: 'Wearables', href: '/category/wearables' },
  { name: 'About Us', href: '/about' },
];

const handleSubscribe = (e: Event) => {
  e.preventDefault();
  if (emailSubscription.value) {
    showSubscriptionToast.value = true;
    emailSubscription.value = '';
    setTimeout(() => {
      showSubscriptionToast.value = false;
    }, 4000);
  }
};

// Close dropdowns on outside clicks
if (process.client) {
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      isThemeMenuOpen.value = false;
    }
    if (!target.closest('.nav-profile-dropdown')) {
      isProfileOpen.value = false;
    }
  });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
    
    <!-- Top Bar Notice -->
    <div class="bg-slate-900 text-white text-center py-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-6">
      <span>🚀 Free express delivery for orders above $500</span>
      <span class="hidden md:inline">🔥 Premium 2-Year warranty on TechCore Zenith Glass edition</span>
    </div>

    <!-- Main Navigation Header -->
    <header class="h-20 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        <!-- Left Side: Burger Menu + Logo Name -->
        <div class="flex items-center gap-4">
          <button 
            @click="isMobileMenuOpen = true"
            class="p-2 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer text-slate-500"
            id="mobile-nav-toggle"
          >
            <Menu class="w-5 h-5" />
          </button>

          <NuxtLink to="/" class="flex items-center gap-2.5 group">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/10 group-hover:scale-[1.03] transition-transform duration-300">
              <ShoppingBag class="w-5 h-5" />
            </div>
            <div class="flex flex-col leading-none">
              <span class="text-sm font-display font-black uppercase tracking-widest bg-gradient-to-r from-rose-600 and to-indigo-600 bg-clip-text text-transparent">
                TechCore
              </span>
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Premium Store</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Center: Desktop Menu Links -->
        <nav class="hidden lg:flex items-center gap-8">
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            :class="cn(
              'text-[10px] uppercase font-black tracking-widest hover:text-rose-500 transition-colors',
              route.path === item.href ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
            )"
          >
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- Right Side Controls (Search link, wishlist, cart count trigger, profile, theme) -->
        <div class="flex items-center gap-1 sm:gap-2">
          
          <!-- Shop items query finder -->
          <NuxtLink to="/products" class="p-2.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors shrink-0">
            <Search class="w-4.5 h-4.5" />
          </NuxtLink>

          <!-- Theme Selector -->
          <div class="relative theme-dropdown">
            <button 
              @click="isThemeMenuOpen = !isThemeMenuOpen"
              class="p-2.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center justify-center h-9.5 w-9.5 cursor-pointer"
            >
              <Sun v-if="uiStore.themeMode === 'light'" class="w-4.5 h-4.5 text-amber-500" />
              <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-4.5 h-4.5 text-indigo-400" />
              <Monitor v-else class="w-4.5 h-4.5" />
            </button>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 m-1"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="isThemeMenuOpen" 
                class="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in"
              >
                <div class="px-3 py-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 dark:border-slate-800/80 mb-1">
                  Lighting Mode
                </div>
                <button 
                  v-for="mode in ['light', 'dark', 'system'] as const" 
                  :key="mode"
                  @click="uiStore.setTheme(mode); isThemeMenuOpen = false"
                  :class="cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer',
                    uiStore.themeMode === mode 
                      ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400' 
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100'
                  )"
                >
                  <Sun v-if="mode === 'light'" class="w-3.5 h-3.5" />
                  <Moon v-else-if="mode === 'dark'" class="w-3.5 h-3.5" />
                  <Monitor v-else class="w-3.5 h-3.5" />
                  <span class="capitalize">{{ mode }}</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- Wishlist trigger -->
          <NuxtLink to="/wishlist" class="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-xl transition-colors relative shrink-0">
            <Heart class="w-4.5 h-4.5" />
            <span 
              v-if="wishlistStore.wishlistCount > 0" 
              class="absolute top-1 right-1 bg-rose-500 text-white font-mono text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950"
            >
              {{ wishlistStore.wishlistCount }}
            </span>
          </NuxtLink>

          <!-- Cart Dynamic Badge + Slideout Toggle -->
          <button 
            @click="isCartOpen = true"
            class="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-xl transition-colors relative cursor-pointer shrink-0"
            id="cart-drawer-toggle"
          >
            <ShoppingBag class="w-4.5 h-4.5" />
            <span 
              v-if="cartStore.itemCount > 0" 
              class="absolute top-1 right-1 bg-indigo-600 text-white font-mono text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950"
            >
              {{ cartStore.itemCount }}
            </span>
          </button>

          <!-- User Account profile -->
          <div class="relative nav-profile-dropdown">
            <button 
              @click="isProfileOpen = !isProfileOpen"
              class="flex items-center gap-1.5 p-1 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                {{ authStore.isLoggedIn ? authStore.user?.name.slice(0,2) : 'G' }}
              </div>
              <ChevronDown class="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 m-1"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="isProfileOpen" 
                class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 text-left animate-in fade-in"
              >
                <div v-if="authStore.isLoggedIn" class="p-3 border-b border-slate-50 dark:border-slate-800/80 mb-2">
                  <p class="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight">{{ authStore.user?.name }}</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{{ authStore.user?.email }}</p>
                </div>
                <div v-else class="p-3 border-b border-slate-50 dark:border-slate-800/80 mb-2">
                  <p class="text-xs font-black uppercase text-slate-950 dark:text-slate-50">Anonymous Visitor</p>
                  <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Not signed in</p>
                </div>

                <NuxtLink 
                  v-if="authStore.isLoggedIn"
                  to="/account" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <UserIcon class="w-4 h-4 text-slate-400" />
                  My Account
                </NuxtLink>
                <NuxtLink 
                  v-else
                  to="/login" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <UserIcon class="w-4 h-4 text-slate-400" />
                  Sign In
                </NuxtLink>

                <NuxtLink 
                  to="/admin" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <Settings class="w-4 h-4 text-slate-400" />
                  Admin Desk
                </NuxtLink>

                <div class="border-t border-slate-50 dark:border-slate-800 my-1.5"></div>
                <button 
                  v-if="authStore.isLoggedIn"
                  @click="authStore.logout(); isProfileOpen = false"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors uppercase tracking-wider border-none text-left cursor-pointer"
                >
                  <LogOut class="w-4 h-4" />
                  Logout
                </button>
                <NuxtLink 
                  v-else
                  to="/signup" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <UserIcon class="w-4 h-4" />
                  Register
                </NuxtLink>
              </div>
            </transition>
          </div>

        </div>
      </div>
    </header>

    <!-- Mobile Navigation Drawer -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden flex"
      @click="isMobileMenuOpen = false"
    >
      <div 
        class="w-80 bg-white dark:bg-slate-950 h-full flex flex-col p-6 animate-in slide-in-from-left duration-300"
        @click.stop
      >
        <div class="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-900">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              <ShoppingBag class="w-4.5 h-4.5" />
            </div>
            <span class="text-xs font-display font-black tracking-widest uppercase">TechCore Store</span>
          </div>
          <button @click="isMobileMenuOpen = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto py-6 space-y-2">
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            @click="isMobileMenuOpen = false"
            class="block px-4 py-3 rounded-xl transition-colors text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {{ item.name }}
          </NuxtLink>
        </nav>

        <div class="pt-6 border-t border-slate-100 dark:border-slate-900 space-y-3">
          <NuxtLink 
            to="/admin" 
            @click="isMobileMenuOpen = false"
            class="flex items-center justify-center gap-2 h-11 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400"
          >
            <Settings class="w-4 h-4" /> Admin Console
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Persistent Slideout Shopping Cart Drawer -->
    <div 
      v-if="isCartOpen" 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      @click="isCartOpen = false"
    >
      <div 
        class="w-full max-w-md bg-white dark:bg-slate-950 h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300"
        @click.stop
      >
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-slate-50">Shopping Ledger</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Review active capex allocation</p>
          </div>
          <button @click="isCartOpen = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Drawer Body: Cart Items -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="cartStore.items.length === 0" class="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 mx-auto">
               <ShoppingBag class="w-8 h-8" />
            </div>
            <div>
              <h4 class="text-xs font-black uppercase tracking-widest">Basket Empty</h4>
              <p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">No hardware assets registered inside ledger buffer. Resume catalog review to populate entries.</p>
            </div>
            <NuxtLink to="/products" @click="isCartOpen = false">
              <UiButton variant="rose" size="sm">Explore Ledger</UiButton>
            </NuxtLink>
          </div>

          <div 
            v-else 
            v-for="item in cartStore.items" 
            :key="item.product.id"
            class="p-4 rounded-2xl border border-slate-100 dark:border-slate-900 flex gap-4 bg-slate-50/20 dark:bg-slate-900/10 hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
          >
            <img :src="item.product.image" :alt="item.product.name" class="w-16 h-16 object-cover rounded-xl shrink-0 border border-slate-200/50 dark:border-slate-800" />
            
            <div class="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex justify-between items-start gap-2">
                  <h4 class="text-xs font-black truncate text-slate-950 dark:text-slate-50">{{ item.product.name }}</h4>
                  <button @click="cartStore.removeFromCart(item.product.id)" class="text-slate-300 hover:text-rose-500 transition-colors border-none cursor-pointer bg-transparent">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ item.product.brand }} • {{ item.product.category }}</p>
              </div>

              <div class="flex items-center justify-between mt-2">
                <!-- Quantity Controls -->
                <div class="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-7">
                  <button 
                    @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                    class="px-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 border-none bg-transparent cursor-pointer"
                  >
                    -
                  </button>
                  <span class="px-2.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{{ item.quantity }}</span>
                  <button 
                    @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                    class="px-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 border-none bg-transparent cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <!-- Price -->
                <span class="text-xs font-mono font-black text-slate-950 dark:text-slate-50">${{ (item.product.price * item.quantity).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer: Billing Calculation -->
        <div v-if="cartStore.items.length > 0" class="p-6 border-t border-slate-100 dark:border-slate-900 space-y-4 bg-slate-50/20 dark:bg-slate-900/5">
          <div class="space-y-2">
            <div class="flex justify-between text-[10px] font-black uppercase text-slate-400">
              <span>Subtotal Assets</span>
              <span class="font-mono text-slate-950 dark:text-slate-50">${{ cartStore.subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-[10px] font-black uppercase text-slate-400">
              <span>Estimated Surcharge Tax (8.25%)</span>
              <span class="font-mono text-slate-950 dark:text-slate-50">${{ cartStore.tax.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-[10px] font-black uppercase text-slate-400">
              <span>Cargo Transportation</span>
              <span class="font-mono text-slate-950 dark:text-slate-50">
                <span v-if="cartStore.shipping === 0" class="text-emerald-500 font-extrabold uppercase">FREE COMPLEMENTARY</span>
                <span v-else>${{ cartStore.shipping.toLocaleString() }}</span>
              </span>
            </div>
            
            <div class="h-px bg-slate-100 dark:bg-slate-900 my-2"></div>
            
            <div class="flex justify-between text-xs font-bold uppercase">
              <span class="text-slate-950 dark:text-slate-50 font-black">Total Ledger</span>
              <span class="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">${{ cartStore.total.toLocaleString() }}</span>
            </div>
          </div>

          <NuxtLink to="/checkout" @click="isCartOpen = false">
            <UiButton variant="rose" class="w-full gap-2 shadow-lg shadow-rose-500/15 mt-2 h-12">
              Pipeline Integration Checkout <ArrowRight class="w-4 h-4" />
            </UiButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Entry Point Page Layout slot -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Comprehensive Premium Footer -->
    <footer class="bg-slate-950 border-t border-slate-900 text-white pt-16 pb-12 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        <!-- Pillar 1: Enterprise Brand Pitch & Socials -->
        <div class="md:col-span-4 space-y-6">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold">
              <ShoppingBag class="w-4.5 h-4.5" />
            </div>
            <span class="text-sm font-display font-black uppercase tracking-widest text-white leading-none">
              TechCore <br />
              <span class="text-[9px] text-slate-500 font-bold tracking-widest block mt-0.5">Premium Gear</span>
            </span>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
            TechCore is a curated hardware store delivering precision silicon configurations, immersive acoustics, and ergonomic desk gear built for modern developers and hardware enthusiasts.
          </p>

          <div class="flex items-center gap-4 text-xs font-black uppercase text-slate-400 tracking-wider">
            <NuxtLink to="/sustainability" class="hover:text-rose-500 transition-colors">Green Policy</NuxtLink>
            <span class="text-slate-800">•</span>
            <NuxtLink to="/careers" class="hover:text-rose-500 transition-colors">Careers</NuxtLink>
          </div>
        </div>

        <!-- Pillar 2: Directories (Shop Categories) -->
        <div class="md:col-span-2 space-y-4">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Categories</h4>
          <ul class="space-y-2.5 text-xs">
            <li><NuxtLink to="/category/laptops" class="text-slate-400 hover:text-white transition-colors">Pristine Laptops</NuxtLink></li>
            <li><NuxtLink to="/category/smartphones" class="text-slate-400 hover:text-white transition-colors">Smartphones</NuxtLink></li>
            <li><NuxtLink to="/category/audio" class="text-slate-400 hover:text-white transition-colors">Hi-Fi Audio Gear</NuxtLink></li>
            <li><NuxtLink to="/category/wearables" class="text-slate-400 hover:text-white transition-colors">Biometric Wearables</NuxtLink></li>
            <li><NuxtLink to="/products" class="text-slate-400 hover:text-white transition-colors">Custom Equipment</NuxtLink></li>
          </ul>
        </div>

        <!-- Pillar 3: Support Desk Directories -->
        <div class="md:col-span-2 space-y-4">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Support Desk</h4>
          <ul class="space-y-2.5 text-xs">
            <li><NuxtLink to="/support/help-center" class="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"><HelpCircle class="w-3.5 h-3.5 text-slate-500" /> Help Directory</NuxtLink></li>
            <li><NuxtLink to="/support/shipping" class="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"><Truck class="w-3.5 h-3.5 text-slate-500" /> Shipping Policy</NuxtLink></li>
            <li><NuxtLink to="/support/returns" class="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"><RotateCcw class="w-3.5 h-3.5 text-slate-500" /> Easy Returns</NuxtLink></li>
            <li><NuxtLink to="/support/warranty" class="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"><Shield class="w-3.5 h-3.5 text-slate-500" /> 2-Year Warranty</NuxtLink></li>
          </ul>
        </div>

        <!-- Pillar 4: Newsletter Dynamic Dispatch -->
        <div class="md:col-span-4 space-y-4">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Dispatch Newsletter</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            Get technical updates, product announcements, and promotional offers directly.
          </p>
          
          <form @submit="handleSubscribe" class="flex flex-col sm:flex-row gap-2 max-w-sm">
            <div class="relative flex-1">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                v-model="emailSubscription"
                type="email" 
                placeholder="you@example.com" 
                required
                class="w-full h-11 pl-9 pr-4 bg-slate-900 border border-slate-800 text-xs rounded-xl outline-none focus:border-rose-500 text-white placeholder:text-slate-600 font-semibold"
              />
            </div>
            <UiButton variant="rose" size="sm" type="submit" class="h-11">
              Subscribe
            </UiButton>
          </form>

          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-250 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform translate-y-2 opacity-0"
          >
            <div v-if="showSubscriptionToast" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] uppercase font-black tracking-widest leading-none">
              Welcome aboard! Welcome voucher dispatching...
            </div>
          </transition>
        </div>

      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">
        <span>&copy; 2026 TechCore Retail & Hardware Solutions, Inc. All rights reserved.</span>
        <div class="flex items-center gap-6">
          <NuxtLink to="/privacy" class="hover:text-white transition-colors">Privacy Charter</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-white transition-colors">Terms of Sale</NuxtLink>
        </div>
      </div>
    </footer>

  </div>
</template>

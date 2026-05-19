<script setup lang="ts">
import { 
  ArrowRight, 
  Cpu, 
  Smartphone, 
  Headphones, 
  Tv, 
  Watch, 
  Zap, 
  Star, 
  Heart, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-vue-next';
import { PRODUCTS, CATEGORIES, BLOG_ARTICLES, type Product } from '~/mock/data';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { useUIStore } from '~/stores/ui';

const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const uiStore = useUIStore();

const featuredProducts = computed(() => PRODUCTS.filter(p => p.isFeatured));

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'laptops': return Cpu;
    case 'smartphones': return Smartphone;
    case 'audio': return Headphones;
    case 'wearables': return Watch;
    default: return Tv;
  }
};
</script>

<template>
  <div class="space-y-16 pb-20 animate-in fade-in duration-700">
    
    <!-- Hero Showcase Section -->
    <section class="relative min-h-[580px] bg-slate-900 text-white flex items-center justify-center overflow-hidden">
      <!-- Decorative Backdrop and Glowing Aura Nodes -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,63,94,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,63,94,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div class="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2.5s"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <!-- Text & Action Promo -->
        <div class="lg:col-span-7 space-y-8 text-left">
          <div class="inline-flex items-center gap-2.5 px-3.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.15em] leading-none">
            <Sparkles class="w-3.5 h-3.5" /> High-Spec Devices Online
          </div>

          <div class="space-y-4">
            <h1 class="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-[1.05]">
              Pragmatic Tech. <br />
              <span class="bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                Powering Compiles.
              </span>
            </h1>
            <p class="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
              We engineer custom computing solutions and high-fidelity sensory gears. Impeccable finishes, bespoke custom silicon, and 100% compliant local standards.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <NuxtLink to="/products">
              <UiButton variant="rose" size="lg" class="gap-3 shadow-xl shadow-rose-500/20">
                Explore Shop All <ArrowRight class="w-4 h-4" />
              </UiButton>
            </NuxtLink>
            <NuxtLink to="/category/laptops">
              <UiButton variant="outline" size="lg" class="border-white/10 text-white hover:bg-white/5">
                Bespoke Notebooks
              </UiButton>
            </NuxtLink>
          </div>
        </div>

        <!-- Highlight Image Carousel Panel -->
        <div class="lg:col-span-5 relative flex justify-center">
          <div class="w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-950/80 p-5 shadow-2xl relative group">
            <div class="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-lg">
              HOT ITEM
            </div>
            
            <img 
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800"
              alt="QuantumBook Pro"
              class="w-full h-56 object-cover rounded-3xl"
            />
            
            <div class="mt-4 space-y-1 text-left">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Silicon Node</p>
              <h3 class="text-base font-black text-white truncate">QuantumBook Pro M3 Max</h3>
              <div class="flex justify-between items-center pt-2">
                <span class="text-sm font-mono font-bold text-rose-400 font-black">$1,899.00 <span class="text-[10px] text-slate-500 line-through font-normal">$2,099</span></span>
                <NuxtLink to="/products/quantumbook-pro-m3-max">
                  <UiButton variant="ghost" size="sm" class="text-white hover:bg-white/5 h-8 font-black text-[9px] p-0 px-3 tracking-widest border border-white/10 rounded-lg">
                    VIEW DETAILS
                  </UiButton>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust indicators section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="flex items-center gap-4 p-6 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl">
          <div class="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
            <Truck class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest">Free Express Shipping</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Complementary on orders above $500</p>
          </div>
        </div>

        <div class="flex items-center gap-4 p-6 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl">
          <div class="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest">Secure 2-Year Warranty</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Coverage for every electronic layout</p>
          </div>
        </div>

        <div class="flex items-center gap-4 p-6 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl">
          <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <RotateCcw class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest">30-Day Easy Returns</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Absolute risk-free buyer charter</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Curated Shop Categories -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      <div class="flex items-end justify-between">
        <div>
          <div class="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
            <Zap class="w-3.5 h-3.5" /> Curated Catalog Categories
          </div>
          <h2 class="text-2xl font-display font-extrabold tracking-tight mt-1">Shop by Hardware Pillar</h2>
        </div>
        <NuxtLink to="/products" class="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest flex items-center gap-1.5 shrink-0">
          Global Catalog <ChevronRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <NuxtLink 
          v-for="cat in CATEGORIES" 
          :key="cat.slug"
          :to="`/category/${cat.slug}`"
          class="relative h-44 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800 group"
        >
          <!-- Background image layer -->
          <img :src="cat.image" :alt="cat.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          <!-- Description overlay -->
          <div class="absolute inset-x-4 bottom-4 flex flex-col justify-end text-left text-white space-y-1.5 z-10">
            <div class="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
              <component :is="getCategoryIcon(cat.slug)" class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-wider leading-none">{{ cat.name }}</p>
              <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{{ cat.count }} items</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Curated Featured Products Showcase -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      <div class="text-center space-y-2">
        <div class="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
          🚀 Flagship Offerings
        </div>
        <h2 class="text-3xl font-display font-extrabold tracking-tight">TechCore Core Featured Gear</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
          Thoroughly inspected, hyper-performing gadget components and systems styled with modern aesthetic profiles.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="prod in featuredProducts" 
          :key="prod.id"
          class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-[410px] relative hover:border-rose-500/20 dark:hover:border-rose-500/20 hover:scale-[1.01] transition-all duration-300 shadow-sm"
        >
          <!-- Absolute Badges -->
          <div class="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
            <span v-if="prod.isOnSale" class="bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg leading-none">SALE</span>
            <span v-if="prod.isNew" class="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg leading-none">NEW</span>
          </div>

          <!-- Wishlist Toggle and Product Image -->
          <div class="relative">
            <button 
              @click="wishlistStore.toggleWishlist(prod)"
              class="absolute top-0 right-0 z-10 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Heart :class="cn('w-4 h-4', wishlistStore.isInWishlist(prod.id) && 'text-rose-500 fill-rose-500')" />
            </button>

            <NuxtLink :to="`/products/${prod.slug}`" class="block rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 mt-2">
              <img :src="prod.image" :alt="prod.name" class="w-full h-44 object-cover group-hover:scale-103 transition-transform duration-500" />
            </NuxtLink>
          </div>

          <!-- Product meta & text details -->
          <div class="space-y-2 mt-4 text-left">
            <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              <span>{{ prod.brand }}</span>
              <span class="flex items-center gap-1"><Star class="w-3 text-amber-400 fill-amber-400" /> {{ prod.rating }} ({{ prod.reviewCount }})</span>
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

          <!-- Pricing & Action Buttons -->
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-900">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-400 tracking-widest uppercase text-[8px] leading-none mb-1">MSRP</span>
              <span class="text-base font-mono font-black text-slate-900 dark:text-white">
                ${{ prod.price }}
                <span v-if="prod.originalPrice" class="text-[10px] text-slate-400 line-through font-normal">${{ prod.originalPrice }}</span>
              </span>
            </div>

            <UiButton 
              size="sm" 
              variant="secondary"
              class="h-8 text-[9px] uppercase font-black px-4 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500"
              @click="cartStore.addToCart(prod, 1)"
            >
              Add to Cart
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- AR Smart Glasses Feature Highlights -->
    <section class="bg-indigo-950 text-white overflow-hidden py-16 relative">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
        <!-- Specs Image -->
        <div class="lg:col-span-5 flex justify-center">
          <div class="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 overflow-hidden bg-slate-950/40 p-4">
            <img 
              src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800" 
              alt="Zenith AR Glasses"
              class="w-full h-80 object-cover rounded-3xl"
            />
            <div class="absolute inset-x-8 bottom-8 p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 space-y-1">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Optical Engine</p>
              <h4 class="text-xs font-bold leading-none">1080p Virtual Viewport Matrix</h4>
            </div>
          </div>
        </div>

        <!-- Spec Breakdown Content -->
        <div class="lg:col-span-7 space-y-8">
          <div class="space-y-4">
            <span class="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em] flex items-center gap-2">
              👾 NEXT-GENERATION OPTICS
            </span>
            <h2 class="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight">
              TechCore Zenith <br />AR Spatial Glasses
            </h2>
            <p class="text-indigo-200 text-xs sm:text-sm max-w-xl leading-relaxed">
              Cast holographic analytics dashboard elements directly onto your field of vision. High-fidelity directional sound, ECG biometric integration chips, and weighing only 72 grams total.
            </p>
          </div>

          <!-- Feature Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div class="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
              <span class="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold">72g</span>
              <div>
                <h4 class="text-xs font-black uppercase leading-none">Aerodynamic Form</h4>
                <p class="text-[10px] text-indigo-200 leading-none mt-1">Slightest tactical chassis weigh.</p>
              </div>
            </div>
            <div class="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
              <span class="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold">14h</span>
              <div>
                <h4 class="text-xs font-black leading-none">Battery Density</h4>
                <p class="text-[10px] text-indigo-200 leading-none mt-1">Multi-cycle charging cradle support.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <NuxtLink to="/products/techcore-zenith-ar-smart-glasses">
              <UiButton variant="rose" size="md">Acquire $499.00</UiButton>
            </NuxtLink>
            <NuxtLink to="/products/techcore-zenith-ar-smart-glasses" class="text-[10px] font-bold text-slate-350 hover:underline uppercase tracking-wide">
              Inspect Specs Breakdown
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Technology Blog Articles -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 text-left">
      <div class="flex items-end justify-between">
        <div>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
            📰 RESEARCH JOURNALS
          </span>
          <h2 class="text-2xl font-display font-extrabold tracking-tight mt-1">The TechCore Research Journal</h2>
        </div>
        <NuxtLink to="/blog" class="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest flex items-center gap-1.5">
          Read All Journals <ChevronRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          v-for="art in BLOG_ARTICLES" 
          :key="art.slug"
          class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col sm:flex-row h-fit sm:h-52"
        >
          <img :src="art.image" :alt="art.title" class="w-full sm:w-48 h-48 sm:h-full object-cover group-hover:scale-103 transition-transform duration-500 shrink-0" />
          
          <div class="p-6 flex flex-col justify-between text-left">
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <span>{{ art.category }}</span>
                <span>•</span>
                <span>{{ art.readTime }}</span>
              </div>
              
              <NuxtLink :to="`/blog/${art.slug}`" class="block">
                <h3 class="text-xs font-black uppercase hover:text-rose-500 transition-colors text-slate-950 dark:text-slate-50 line-clamp-2 tracking-tight">
                  {{ art.title }}
                </h3>
              </NuxtLink>
              
              <p class="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                {{ art.excerpt }}
              </p>
            </div>

            <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-3 mt-3">
              <span class="text-[9px] font-bold text-slate-400 capitalize">{{ art.author.split(',')[0] }}</span>
              <NuxtLink :to="`/blog/${art.slug}`" class="text-[9px] font-black uppercase text-rose-500 flex items-center hover:underline">
                Read Entry <ArrowRight class="w-3 h-3 ml-1" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

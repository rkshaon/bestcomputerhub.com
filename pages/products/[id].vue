<script setup lang="ts">
import { 
  Heart, 
  Star, 
  Trash2, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Cpu, 
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-vue-next';
import { PRODUCTS, REVIEWS, type Product, type Review } from '~/mock/data';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';
import { cn } from '~/utils';

const route = useRoute();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

// Find product by slug or id
const product = computed(() => {
  const param = String(route.params.id);
  return PRODUCTS.find(p => p.slug === param || p.id === param) || PRODUCTS[0];
});

// Image display state
const activeImage = ref('');

// Sync main image on load
watch(product, (p) => {
  if (p) activeImage.value = p.image;
}, { immediate: true });

// Buy config states
const itemQty = ref(1);
const activeTab = ref<'features' | 'specs' | 'reviews'>('features');

// Related products
const relatedProducts = computed(() => {
  if (!product.value) return [];
  return PRODUCTS.filter(p => p.category === product.value.category && p.id !== product.value.id).slice(0, 3);
});

// Get reviews
const productReviews = computed(() => {
  if (!product.value) return [];
  return REVIEWS[product.value.id] || [];
});

const handleQuantityChange = (delta: number) => {
  itemQty.value = Math.max(1, Math.min(product.value.stock, itemQty.value + delta));
};

const handleInstantCheckout = () => {
  cartStore.addToCart(product.value, itemQty.value);
  navigateTo('/checkout');
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left animate-in fade-in duration-500">
    
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-widest mb-10">
      <NuxtLink to="/" class="hover:text-rose-500 transition-colors">Home</NuxtLink>
      <span>/</span>
      <NuxtLink to="/products" class="hover:text-rose-500 transition-colors">Products</NuxtLink>
      <span>/</span>
      <NuxtLink :to="`/category/${product.category}`" class="hover:text-rose-500 transition-colors">{{ product.category }}</NuxtLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100 font-extrabold truncate max-w-[200px]">{{ product.name }}</span>
    </div>

    <!-- Product Profile Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start border-b border-slate-250/20 dark:border-slate-800 pb-12">
      
      <!-- Left side: Image layout gallery -->
      <div class="lg:col-span-6 space-y-4">
        <div class="rounded-3xl overflow-hidden bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-4 aspect-[4/3] flex items-center justify-center">
          <img :src="activeImage || product.image" :alt="product.name" class="max-h-full object-contain rounded-2xl w-full" />
        </div>

        <!-- Thumbnail grid selection mapping -->
        <div class="grid grid-cols-3 gap-4" v-if="product.images && product.images.length > 0">
          <button 
            v-for="(img, idx) in product.images" 
            :key="idx"
            @click="activeImage = img"
            :class="cn(
              'h-24 rounded-2xl overflow-hidden border transition-all cursor-pointer p-1 bg-white dark:bg-slate-950 flex items-center justify-center',
              activeImage === img ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200/50 dark:border-slate-850'
            )"
          >
            <img :src="img" :alt="product.name" class="h-full w-full object-cover rounded-xl" />
          </button>
        </div>
      </div>

      <!-- Right side: Meta descriptions, pricing, active states -->
      <div class="lg:col-span-6 space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="bg-indigo-600/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl">
              {{ product.brand }} Origin Core
            </span>
            <span v-if="product.stock < 10" class="bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl">
              ONLY {{ product.stock }} LEFT IN STOCK
            </span>
          </div>

          <h1 class="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-slate-950 dark:text-slate-50 leading-tight">
            {{ product.name }}
          </h1>

          <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div class="flex items-center text-amber-550 gap-0.5 font-bold">
              <Star 
                v-for="i in 5" 
                :key="i"
                :class="cn('w-4 h-4', i <= Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300')"
              />
              <span class="ml-1.5 text-slate-900 dark:text-white font-black font-mono mt-0.5">{{ product.rating }}</span>
            </div>
            <span>•</span>
            <span class="uppercase tracking-wider font-extrabold">{{ product.reviewCount }} Verified Reviews</span>
          </div>
        </div>

        <div class="text-slate-500 dark:text-slate-400 text-xs sm:text-xs leading-relaxed font-medium">
          {{ product.description }}
        </div>

        <!-- Pricing Card layout -->
        <div class="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Standard Retail MSRP</span>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">${{ product.price.toLocaleString() }}</span>
              <span v-if="product.originalPrice" class="text-sm font-semibold text-slate-400 line-through">${{ product.originalPrice.toLocaleString() }}</span>
            </div>
          </div>
          
          <div class="text-right">
            <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Free Cargo Entry</span>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">Qualified for free shipping</p>
          </div>
        </div>

        <!-- Purchase increments controllers -->
        <div class="space-y-4">
          <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Select Quantity Payload</h4>
          
          <div class="flex flex-wrap items-center gap-4">
            <!-- Selector -->
            <div class="flex items-center border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-12 bg-white dark:bg-slate-900">
              <button 
                @click="handleQuantityChange(-1)"
                class="px-4 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 border-none bg-transparent cursor-pointer h-full"
              >
                -
              </button>
              <span class="px-4 font-mono text-xs font-black text-slate-900 dark:text-white">{{ itemQty }}</span>
              <button 
                @click="handleQuantityChange(1)"
                class="px-4 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 border-none bg-transparent cursor-pointer h-full"
              >
                +
              </button>
            </div>

            <!-- Add to Cart CTA -->
            <UiButton 
              variant="rose" 
              class="flex-1 min-w-[200px] h-12 shadow-lg shadow-rose-500/15"
              @click="cartStore.addToCart(product, itemQty)"
            >
              Add To Basket Payload
            </UiButton>

            <!-- Instant Checkout Trigger -->
            <UiButton 
              variant="primary" 
              class="h-12 border-slate-200 dark:border-slate-800 h-12 px-6"
              @click="handleInstantCheckout"
            >
              Express Checkout
            </UiButton>

            <!-- Wishlist select -->
            <button 
              @click="wishlistStore.toggleWishlist(product)"
              class="h-12 w-12 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer bg-white dark:bg-slate-900 shrink-0"
            >
              <Heart :class="cn('w-5 h-5 text-slate-400', wishlistStore.isInWishlist(product.id) && 'text-rose-500 fill-rose-500')" />
            </button>
          </div>
        </div>

        <!-- Compliance Badges guarantees -->
        <div class="grid grid-cols-3 gap-4 pt-4 text-left border-t border-slate-100 dark:border-slate-900">
          <div class="flex gap-2.5 items-start">
            <Truck class="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <p class="text-[9px] font-black uppercase tracking-wider leading-none text-slate-850 dark:text-slate-100">Express Post</p>
              <p class="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">24-48 Hours</p>
            </div>
          </div>
          <div class="flex gap-2.5 items-start">
            <ShieldCheck class="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <p class="text-[9px] font-black uppercase tracking-wider leading-none text-slate-850 dark:text-slate-100">Secure Warranty</p>
              <p class="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">2-Years Full</p>
            </div>
          </div>
          <div class="flex gap-2.5 items-start">
            <RotateCcw class="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <p class="text-[9px] font-black uppercase tracking-wider leading-none text-slate-850 dark:text-slate-100">Zero Fee Return</p>
              <p class="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">30-Day Policy</p>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Product specification tabs layout block -->
    <div class="py-12 border-b border-slate-200/50 dark:border-slate-800">
      <div class="flex border-b border-slate-150 dark:border-slate-900 gap-6">
        <button 
          v-for="tab in [
            { id: 'features', label: 'Engine Features', icon: Cpu },
            { id: 'specs', label: 'Precise Specification', icon: MessageSquare },
            { id: 'reviews', label: 'Verified Reviews', icon: MessageSquare }
          ] as const"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="cn(
            'pb-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all cursor-pointer leading-none',
            activeTab === tab.id 
              ? 'border-rose-500 text-rose-500' 
              : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab view panes -->
      <div class="py-8 text-left">
        <!-- Engine features list -->
        <div v-if="activeTab === 'features'" class="space-y-4 max-w-3xl animate-in fade-in duration-200">
          <div 
            v-for="(f, i) in product.features" 
            :key="i"
            class="flex items-start gap-3.5"
          >
            <CheckCircle2 class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p class="text-xs text-slate-750 dark:text-slate-300 font-semibold">{{ f }}</p>
          </div>
        </div>

        <!-- Specifications specs map -->
        <div v-else-if="activeTab === 'specs'" class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl animate-in fade-in duration-200">
          <div 
            v-for="(val, label) in product.specs" 
            :key="label"
            class="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-white/50 dark:bg-slate-900/10 text-xs"
          >
            <span class="font-bold text-slate-400 uppercase tracking-wider text-[9px]">{{ label }}</span>
            <span class="font-black text-slate-850 dark:text-slate-100">{{ val }}</span>
          </div>
        </div>

        <!-- Reviews feeds -->
        <div v-else-if="activeTab === 'reviews'" class="space-y-6 max-w-3xl animate-in fade-in duration-200">
          <div v-if="productReviews.length === 0" class="py-8 text-center text-slate-400">
            <p class="text-xs font-black uppercase tracking-widest">No Client Reviews Yet</p>
            <p class="text-[10px] text-slate-500 mt-1 uppercase">Be the first to grade this product configuration</p>
          </div>

          <div 
            v-else 
            v-for="rev in productReviews" 
            :key="rev.id"
            class="p-6 border border-slate-100 dark:border-slate-900 rounded-3xl space-y-4 bg-white/50 dark:bg-slate-900/10"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black uppercase tracking-tight text-slate-905 dark:text-slate-100">{{ rev.title }}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase">{{ rev.author }} • {{ rev.date }}</span>
                  <span v-if="rev.verified" class="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md leading-none">VERIFIED PATRON</span>
                </div>
              </div>

              <div class="flex items-center text-amber-500 gap-0.5">
                <Star 
                  v-for="i in 55" 
                  :key="i"
                  :class="cn('w-3.5 h-3.5', i <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200')"
                />
              </div>
            </div>

            <p class="text-xs text-slate-500 leading-relaxed font-semibold">
              "{{ rev.comment }}"
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- Related items Carousel -->
    <div class="py-12 space-y-8" v-if="relatedProducts.length > 0">
      <div class="text-left space-y-1">
        <span class="text-[9px] font-black uppercase text-rose-500 tracking-[0.2em]">COMPLETE THE RIG</span>
        <h3 class="text-lg font-display font-black tracking-tight uppercase">Complementary Hardware Modules</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          v-for="prod in relatedProducts" 
          :key="prod.id"
          class="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-[390px] relative hover:border-rose-500/20 dark:hover:border-rose-500/20 hover:scale-[1.01] transition-all duration-300"
        >
          <!-- Product image -->
          <NuxtLink :to="`/products/${prod.slug}`" class="block rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
            <img :src="prod.image" :alt="prod.name" class="w-full h-40 object-cover group-hover:scale-103 transition-transform duration-500" />
          </NuxtLink>

          <!-- Label -->
          <div class="space-y-1.5 mt-4 text-left">
            <div class="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              <span>{{ prod.brand }}</span>
              <span class="flex items-center gap-0.5"><Star class="w-3 text-amber-400 fill-amber-400" /> {{ prod.rating }}</span>
            </div>
            
            <NuxtLink :to="`/products/${prod.slug}`" class="block truncate">
              <h4 class="text-xs font-black uppercase text-slate-900 dark:text-white hover:text-rose-500 transition-colors">
                {{ prod.name }}
              </h4>
            </NuxtLink>
            
            <p class="text-[9px] text-slate-400 line-clamp-2 leading-tight">
              {{ prod.description }}
            </p>
          </div>

          <!-- Checkout trigger -->
          <div class="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-900 pt-4">
            <span class="text-sm font-mono font-black text-slate-900 dark:text-white">${{ prod.price }}</span>
            <UiButton 
              size="sm" 
              variant="secondary"
              class="h-7 text-[8px] px-3.5 rounded-lg"
              @click="cartStore.addToCart(prod, 1)"
            >
              Add to Basket
            </UiButton>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

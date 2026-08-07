<!-- File: /pages/product/[slug].vue -->
<script setup lang="ts">
import { ChevronRight, ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, Info, Plus, Minus, Zap, Cpu, Globe } from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';

import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';

const route = useRoute();
const productService = useProductService();
const cartStore = useCartStore();
const categoryService = useCategoryService();

const slug = route.params.slug as string;
const product = productService.getProductBySlug(slug);

if (!product) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' });
}

useSeoMeta({
  title: product.name,
  description: product.description || `Buy ${product.name} at the best price in Bangladesh from Best Computer Hub. Authentic warranty and fast delivery.`,
  ogTitle: product.name,
  ogDescription: product.description || `Buy ${product.name} at the best price in Bangladesh from Best Computer Hub.`,
  ogImage: product.images[0] || '/logo.svg'
});

const selectedImage = ref(product.images[0]);
const quantity = ref(1);
const activeTab = ref('description');

const categoryObject = computed(() => {
  const allCats = productService.getCategories();
  return allCats.find(c => c.id === product.category || c.slug === product.category);
});

const categoryUrl = computed(() => {
  if (!categoryObject.value) return '/products';
  return categoryService.getCategoryUrl(categoryObject.value);
});

const similarProducts = computed(() => {
  return productService.getProducts({ 
    category: product.category 
  }).filter(p => p.id !== product.id).slice(0, 4);
});

const addToCart = () => {
  cartStore.addToCart(product, quantity.value);
  // Optionally open cart drawer
  const uiStore = useUIStore();
  uiStore.isCartOpen = true;
};
</script>

<template>
  <div class="pb-16 sm:pb-20">
    <!-- Breadcrumbs -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-3 sm:py-4">
        <nav class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap custom-submenu-scrollbar">
          <NuxtLink to="/" class="hover:text-primary transition-colors shrink-0">Home</NuxtLink>
          <ChevronRight class="w-3 h-3 shrink-0" />
          <NuxtLink :to="categoryUrl" class="hover:text-primary transition-colors shrink-0">{{ categoryObject?.name || 'Catalog' }}</NuxtLink>
          <ChevronRight class="w-3 h-3 shrink-0" />
          <span class="text-foreground truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">{{ product.name }}</span>
        </nav>
      </div>
    </div>

    <div class="container mx-auto px-4 mt-6 sm:mt-8 lg:mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <!-- Gallery -->
        <div class="space-y-4 sm:space-y-6">
          <div class="aspect-square rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden bg-muted/40 border group relative cursor-zoom-in flex items-center justify-center p-4">
            <img :src="selectedImage" :alt="product.name" class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute top-3 left-3 sm:top-6 sm:left-6 flex flex-col gap-2 sm:gap-3">
              <span v-if="product.isNew" class="bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">New Arrival</span>
              <span v-if="product.onSale" class="bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Promotional Pricing</span>
            </div>
          </div>
          
          <div class="flex gap-2 sm:gap-4 overflow-x-auto pb-2 custom-submenu-scrollbar">
            <button 
              v-for="img in product.images" 
              :key="img" 
              @click="selectedImage = img"
              :class="[
                'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-1 bg-muted/20 cursor-pointer',
                selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-primary/50'
              ]"
              :aria-label="`View product image`"
            >
              <img :src="img" :alt="product.name" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-6 sm:space-y-8 lg:space-y-10">
          <div class="space-y-3 sm:space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">{{ product.brand }}</span>
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-muted/80 rounded-full">
                <Star class="w-3.5 h-3.5 text-yellow-500 fill-current shrink-0" />
                <span class="text-xs sm:text-sm font-bold">{{ product.rating }}</span>
                <span class="text-[11px] sm:text-xs text-muted-foreground">({{ product.reviewCount }} Reviews)</span>
              </div>
            </div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight break-words">
              {{ product.name }}
            </h1>
            <p class="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              {{ product.description }}
            </p>
            
            <!-- Expanded Summary Content -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <ShieldCheck class="w-4 h-4 text-primary shrink-0" /> Compliance Standards
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Fully certified for TAA compliance and SOC2 data environments, ensuring your infrastructure meets global security benchmarks.</p>
              </div>
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Zap class="w-4 h-4 text-primary shrink-0" /> Performance Delta
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Delivers up to 40% higher throughput compared to previous generation components while maintaining 15% lower power consumption.</p>
              </div>
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Cpu class="w-4 h-4 text-primary shrink-0" /> Advanced Fabric
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Integrated with low-latency interconnects (TC-Link Gen 4) for seamless multi-node synchronization across server racks.</p>
              </div>
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Globe class="w-4 h-4 text-primary shrink-0" /> Supply Chain
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Tracked via blockchain-verified procurement, ensuring authentic semiconductor origin and conflict-free mineral sourcing.</p>
              </div>
            </div>
          </div>

          <!-- Pricing & Actions -->
          <div class="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-muted/30 border border-muted space-y-5 sm:space-y-6 lg:space-y-8">
            <div class="flex flex-wrap items-baseline gap-2 sm:gap-4">
              <span class="text-3xl sm:text-4xl font-display font-extrabold">{{ formatCurrency(product.price) }}</span>
              <span v-if="product.originalPrice" class="text-lg sm:text-xl text-muted-foreground line-through decoration-destructive/30">
                {{ formatCurrency(product.originalPrice) }}
              </span>
              <span v-if="product.onSale" class="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-md">
                SAVE {{ Math.round((1 - product.price/product.originalPrice!) * 100) }}%
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div class="flex items-center justify-between sm:justify-start gap-4 bg-background border h-12 sm:h-14 rounded-xl sm:rounded-2xl px-4 py-2 w-full sm:w-auto shrink-0">
                <button @click="quantity = Math.max(1, quantity - 1)" class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" aria-label="Decrease quantity">
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-bold text-center min-w-[2rem] text-sm sm:text-base">{{ quantity }}</span>
                <button @click="quantity++" class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" aria-label="Increase quantity">
                  <Plus class="w-4 h-4" />
                </button>
              </div>
              <UiButton @click="addToCart" class="h-12 sm:h-14 w-full sm:w-auto sm:flex-grow px-6 sm:px-10 gap-3 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold">
                <ShoppingCart class="w-5 h-5" />
                Add to Cart
              </UiButton>
            </div>

            <!-- Trust Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div v-for="(item, idx) in [
                { icon: Truck, text: 'Free Global Express' },
                { icon: ShieldCheck, text: '2-Year Warranty' },
                { icon: RotateCcw, text: '30-Day Return' },
                { icon: Info, text: 'Tax Included' }
              ]" :key="idx" class="flex flex-col items-center text-center gap-1.5 p-1.5 rounded-xl">
                <component :is="item.icon" class="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                <span class="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground leading-tight">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Split Layout: Similar Products Sidebar + Tabs Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 pt-10 sm:pt-14 lg:pt-20 border-t items-start mt-8 sm:mt-12 lg:mt-16">
        <!-- Sidebar: Similar Trending Products -->
        <aside class="lg:col-span-4 xl:col-span-3 space-y-6 sm:space-y-8 lg:sticky lg:top-28">
          <div class="space-y-1.5 sm:space-y-2">
            <h3 class="text-xl sm:text-2xl font-display font-bold">Similar <span class="text-primary italic">Trending</span></h3>
            <p class="text-xs text-muted-foreground leading-relaxed">Other professionals also sourced these components for similar architectural requirements.</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <CommerceProductCard 
              v-for="p in similarProducts" 
              :key="p.id" 
              :product="p" 
            />
          </div>

          <UiButton variant="ghost" class="w-full rounded-full font-bold group h-11 text-xs sm:text-sm" to="/products">
            View All Catalog <ChevronRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
        </aside>

        <!-- Main: Details Tabs -->
        <main class="lg:col-span-8 xl:col-span-9">
          <!-- Tabs Navigation -->
          <div class="flex border-b overflow-x-auto custom-submenu-scrollbar">
            <button 
              v-for="tab in ['description', 'specification', 'reviews']" 
              :key="tab"
              @click="activeTab = tab"
              :class="cn(
                'px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all relative shrink-0 cursor-pointer',
                activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )"
            >
              {{ tab }}
              <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-primary rounded-t-full"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="py-6 sm:py-8 lg:py-12 animate-in fade-in slide-in-from-left-4 duration-500">
            <!-- Description Tab -->
            <div v-if="activeTab === 'description'" class="space-y-8 sm:space-y-12">
              <div class="prose prose-slate dark:prose-invert max-w-none">
                <p class="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-light">
                  {{ product.description }}
                </p>
                <p class="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mt-4 sm:mt-6">
                  Developed specifically for hyperscale cloud providers and enterprise AI workloads, the {{ product.name }} leverages proprietary silicon architecture to maximize bandwidth while minimizing thermal output. Every unit undergoes rigorous stress testing in simulated extreme environments before fulfillment.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Cpu class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Premium Engineering</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">This component is engineered to the highest industry standards, ensuring peak performance under rigorous enterprise workloads. Features military-grade power phase regulators for consistent voltage delivery.</p>
                </div>
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Zap class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Efficiency Focus</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">Tested for over 50,000 hours of continuous operation, providing the reliability your mission-critical infrastructure demands. Optimized for maximum performance-per-watt efficiency in diverse thermal envelopes.</p>
                </div>
              </div>
            </div>

            <!-- Specification Tab -->
            <div v-if="activeTab === 'specification'" class="space-y-6 sm:space-y-10">
              <div class="bg-card border rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <div class="grid grid-cols-1">
                  <div v-for="(val, key, idx) in product.specifications" :key="key" 
                    :class="cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 px-4 sm:px-8 lg:px-10 gap-1 sm:gap-4 transition-colors hover:bg-muted/30',
                      idx !== Object.keys(product.specifications).length - 1 && 'border-b border-muted'
                    )"
                  >
                    <span class="text-muted-foreground font-bold uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{{ key }}</span>
                    <span class="font-bold text-sm sm:text-base lg:text-lg text-foreground sm:text-right break-words">{{ val }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8 bg-primary/5 rounded-2xl sm:rounded-3xl border border-primary/10">
                 <Info class="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
                 <p class="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Specifications are based on laboratory testing at 25°C. Performance may vary depending on system integration and environmental factors.</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="space-y-6 sm:space-y-12">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-muted/20 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border">
                <div class="space-y-1 sm:space-y-2">
                  <h4 class="text-xl sm:text-2xl md:text-3xl font-display font-bold">Professional Feedback</h4>
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="flex">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                    <span class="text-xs sm:text-sm font-bold">{{ product.rating }} Rating Based on {{ product.reviewCount }} Units Deployed</span>
                  </div>
                </div>
                <UiButton variant="outline" class="rounded-full font-bold px-6 sm:px-8 h-10 sm:h-12 border-primary/20 text-primary hover:bg-primary/5 text-xs sm:text-sm w-full sm:w-auto shrink-0">Submit Technical Review</UiButton>
              </div>

              <div class="space-y-4 sm:space-y-6">
                <div v-for="i in 3" :key="i" class="p-5 sm:p-8 bg-card border rounded-2xl sm:rounded-[2.5rem] space-y-4 sm:space-y-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center font-bold text-base sm:text-xl text-primary shrink-0">JD</div>
                      <div class="space-y-0.5 sm:space-y-1">
                        <p class="font-bold text-base sm:text-lg">System Architect {{ i }}</p>
                        <p class="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em]">Verified Enterprise Deployment</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <p class="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed italic border-l-2 sm:border-l-4 border-primary/20 pl-4 sm:pl-6">
                    "Exceptional build quality and rock-solid stability. We integrated these into our edge nodes and saw an immediate improvement in packet processing throughput. The thermal management is impressive even under heavy load."
                  </p>
                  <div class="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                    <span>Helpful?</span>
                    <button class="hover:text-primary transition-colors cursor-pointer">Yes (12)</button>
                    <button class="hover:text-primary transition-colors cursor-pointer">No (0)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>



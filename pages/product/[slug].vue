<script setup lang="ts">
import { ChevronRight, ArrowLeft, Star, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Info, Plus, Minus, Zap, Cpu, Globe } from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';

import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useUIStore } from '@/stores/ui';

const route = useRoute();
const productService = useProductService();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

const slug = route.params.slug as string;
const product = productService.getProductBySlug(slug);

if (!product) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' });
}

const selectedImage = ref(product.images[0]);
const quantity = ref(1);
const activeTab = ref('description');

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
  <div class="pb-20">
    <!-- Breadcrumbs -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-4">
        <nav class="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap">
          <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
          <ChevronRight class="w-3 h-3 shrink-0" />
          <NuxtLink :to="`/category/${product.category}`" class="hover:text-primary transition-colors">Catalog</NuxtLink>
          <ChevronRight class="w-3 h-3 shrink-0" />
          <span class="text-foreground truncate max-w-[200px]">{{ product.name }}</span>
        </nav>
      </div>
    </div>

    <div class="container mx-auto px-4 mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <!-- Gallery -->
        <div class="space-y-6">
          <div class="aspect-square rounded-[2rem] overflow-hidden bg-muted border group relative cursor-zoom-in">
            <img :src="selectedImage" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div class="absolute top-6 left-6 flex flex-col gap-3">
              <span v-if="product.isNew" class="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">New Arrival</span>
              <span v-if="product.onSale" class="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Promotional Pricing</span>
            </div>
          </div>
          
          <div class="grid grid-cols-4 gap-4">
            <button 
              v-for="img in product.images" 
              :key="img" 
              @click="selectedImage = img"
              :class="[
                'aspect-square rounded-2xl overflow-hidden border-2 transition-all',
                selectedImage === img ? 'border-primary' : 'border-muted hover:border-primary/50'
              ]"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-10">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-primary uppercase tracking-widest">{{ product.brand }}</span>
              <div class="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full">
                <Star class="w-4 h-4 text-yellow-500 fill-current" />
                <span class="text-sm font-bold">{{ product.rating }}</span>
                <span class="text-xs text-muted-foreground">({{ product.reviewCount }} Professional Reviews)</span>
              </div>
            </div>
            <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight">
              {{ product.name }}
            </h1>
            <p class="text-lg text-muted-foreground leading-relaxed">
              {{ product.description }}
            </p>
            
            <!-- Expanded Summary Content -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t mt-6">
              <div class="space-y-3">
                <h4 class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <ShieldCheck class="w-4 h-4 text-primary" /> Compliance Standards
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Fully certified for TAA compliance and SOC2 data environments, ensuring your infrastructure meets global security benchmarks.</p>
              </div>
              <div class="space-y-3">
                <h4 class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Zap class="w-4 h-4 text-primary" /> Performance Delta
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Delivers up to 40% higher throughput compared to previous generation components while maintaining 15% lower power consumption.</p>
              </div>
              <div class="space-y-3">
                <h4 class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Cpu class="w-4 h-4 text-primary" /> Advanced Fabric
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Integrated with low-latency interconnects (TC-Link Gen 4) for seamless multi-node synchronization across server racks.</p>
              </div>
              <div class="space-y-3">
                <h4 class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Globe class="w-4 h-4 text-primary" /> Supply Chain
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Tracked via blockchain-verified procurement, ensuring authentic semiconductor origin and conflict-free mineral sourcing.</p>
              </div>
            </div>
          </div>

          <!-- Pricing & Actions -->
          <div class="p-8 rounded-3xl bg-muted/30 border border-muted space-y-8">
            <div class="flex items-baseline gap-4">
              <span class="text-4xl font-display font-extrabold">{{ formatCurrency(product.price) }}</span>
              <span v-if="product.originalPrice" class="text-xl text-muted-foreground line-through decoration-destructive/30">
                {{ formatCurrency(product.originalPrice) }}
              </span>
              <span v-if="product.onSale" class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                SAVE {{ Math.round((1 - product.price/product.originalPrice!) * 100) }}%
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-4">
              <div class="flex items-center gap-4 bg-background border h-14 rounded-2xl px-4 py-2 w-full sm:w-auto">
                <button @click="quantity = Math.max(1, quantity - 1)" class="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-bold w-4 text-center">{{ quantity }}</span>
                <button @click="quantity++" class="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Plus class="w-4 h-4" />
                </button>
              </div>
              <UiButton @click="addToCart" class="h-14 flex-grow px-10 gap-3 rounded-2xl text-lg">
                <ShoppingCart class="w-5 h-5" />
                Add to Cart
              </UiButton>
              <UiButton 
                variant="outline" 
                :class="cn('h-14 w-14 shrink-0 rounded-2xl', wishlistStore.isInWishlist(product.id) && 'bg-primary/10 text-primary border-primary/50')"
                @click="wishlistStore.toggleWishlist(product)"
              >
                <Heart :class="cn('w-6 h-6', wishlistStore.isInWishlist(product.id) && 'fill-current')" />
              </UiButton>
            </div>

            <!-- Trust Badges -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div v-for="(item, idx) in [
                { icon: Truck, text: 'Free Global Express' },
                { icon: ShieldCheck, text: '2-Year Warranty' },
                { icon: RotateCcw, text: '30-Day Return' },
                { icon: Info, text: 'Tax Included' }
              ]" :key="idx" class="flex flex-col items-center text-center gap-2">
                <component :is="item.icon" class="w-5 h-5 text-muted-foreground" />
                <span class="text-[10px] font-bold uppercase text-muted-foreground">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Split Layout: Similar Products Sidebar + Tabs Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-20 border-t items-start">
        <!-- Sidebar: Similar Trending Products -->
        <aside class="lg:col-span-4 xl:col-span-3 space-y-8 sticky top-24">
          <div class="space-y-2">
            <h3 class="text-2xl font-display font-bold">Similar <span class="text-primary italic">Trending</span></h3>
            <p class="text-xs text-muted-foreground">Other professionals also sourced these components for similar architectural requirements.</p>
          </div>
          
          <div class="space-y-6">
            <CommerceProductCard 
              v-for="p in similarProducts" 
              :key="p.id" 
              :product="p" 
              class="scale-90 origin-top-left -mb-10"
            />
          </div>

          <UiButton variant="ghost" class="w-full rounded-full font-bold group" to="/products">
            View All Catalog <ChevronRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
        </aside>

        <!-- Main: Details Tabs -->
        <main class="lg:col-span-8 xl:col-span-9">
          <!-- Tabs Navigation -->
          <div class="flex border-b overflow-x-auto">
            <button 
              v-for="tab in ['description', 'specification', 'reviews']" 
              :key="tab"
              @click="activeTab = tab"
              :class="cn(
                'px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-all relative shrink-0',
                activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )"
            >
              {{ tab }}
              <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="py-12 animate-in fade-in slide-in-from-left-4 duration-700">
            <!-- Description Tab -->
            <div v-if="activeTab === 'description'" class="space-y-12">
              <div class="prose prose-lg prose-slate max-w-none">
                <p class="text-xl text-muted-foreground leading-relaxed font-light">
                  {{ product.description }}
                </p>
                <p class="text-lg text-muted-foreground leading-relaxed mt-6">
                  Developed specifically for hyperscale cloud providers and enterprise AI workloads, the {{ product.name }} leverages proprietary silicon architecture to maximize bandwidth while minimizing thermal output. Every unit undergoes rigorous stress testing in simulated extreme environments before fulfillment.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-muted/30 p-10 rounded-[2.5rem] space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Cpu class="w-6 h-6" />
                  </div>
                  <h4 class="text-xl font-bold">Premium Engineering</h4>
                  <p class="text-sm text-muted-foreground leading-relaxed">This component is engineered to the highest industry standards, ensuring peak performance under rigorous enterprise workloads. Features military-grade power phase regulators for consistent voltage delivery.</p>
                </div>
                <div class="bg-muted/30 p-10 rounded-[2.5rem] space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Zap class="w-6 h-6" />
                  </div>
                  <h4 class="text-xl font-bold">Efficiency Focus</h4>
                  <p class="text-sm text-muted-foreground leading-relaxed">Tested for over 50,000 hours of continuous operation, providing the reliability your mission-critical infrastructure demands. Optimized for maximum performance-per-watt efficiency in diverse thermal envelopes.</p>
                </div>
              </div>
            </div>

            <!-- Specification Tab -->
            <div v-if="activeTab === 'specification'" class="space-y-10">
              <div class="bg-card border rounded-[2.5rem] overflow-hidden">
                <div class="grid grid-cols-1">
                  <div v-for="(val, key, idx) in product.specifications" :key="key" 
                    :class="cn(
                      'flex items-center justify-between p-6 px-10 transition-colors hover:bg-muted/30',
                      idx !== Object.keys(product.specifications).length - 1 && 'border-b border-muted'
                    )"
                  >
                    <span class="text-muted-foreground font-bold uppercase tracking-widest text-xs">{{ key }}</span>
                    <span class="font-bold text-lg">{{ val }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-4 p-8 bg-primary/5 rounded-3xl border border-primary/10">
                 <Info class="w-6 h-6 text-primary shrink-0" />
                 <p class="text-sm text-muted-foreground font-medium">Specifications are based on laboratory testing at 25°C. Performance may vary depending on system integration and environmental factors.</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="space-y-12">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/20 p-8 rounded-[2.5rem] border">
                <div class="space-y-2">
                  <h4 class="text-3xl font-display font-bold">Professional Feedback</h4>
                  <div class="flex items-center gap-2">
                    <div class="flex">
                      <Star v-for="s in 5" :key="s" class="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                    <span class="text-sm font-bold">{{ product.rating }} Rating Based on {{ product.reviewCount }} Units Deployed</span>
                  </div>
                </div>
                <UiButton variant="outline" class="rounded-full font-bold px-8 h-12 border-primary/20 text-primary hover:bg-primary/5">Submit Technical Review</UiButton>
              </div>

              <div class="space-y-6">
                <div v-for="i in 3" :key="i" class="p-8 bg-card border rounded-[2.5rem] space-y-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center font-bold text-xl text-primary">JD</div>
                      <div class="space-y-1">
                        <p class="font-bold text-lg">System Architect {{ i }}</p>
                        <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Verified Enterprise Deployment</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <Star v-for="s in 5" :key="s" class="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <p class="text-muted-foreground leading-relaxed italic text-lg border-l-4 border-primary/20 pl-6">
                    "Exceptional build quality and rock-solid stability. We integrated these into our edge nodes and saw an immediate improvement in packet processing throughput. The thermal management is impressive even under heavy load."
                  </p>
                  <div class="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                    <span>Helpful?</span>
                    <button class="hover:text-primary transition-colors">Yes (12)</button>
                    <button class="hover:text-primary transition-colors">No (0)</button>
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


<script setup lang="ts">
import { ChevronRight, ArrowLeft, Star, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Info, Plus, Minus } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';

const route = useRoute();
const productService = useProductService();
const cartStore = useCartStore();

const slug = route.params.slug as string;
const product = productService.getProductBySlug(slug);

if (!product) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' });
}

const selectedImage = ref(product.images[0]);
const quantity = ref(1);

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
              <UiButton variant="outline" class="h-14 w-14 shrink-0 rounded-2xl">
                <Heart class="w-6 h-6" />
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

          <!-- Specs -->
          <div class="space-y-6">
            <h3 class="text-xl font-bold tracking-tight border-b pb-4">Technical Specifications</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div v-for="(val, key) in product.specifications" :key="key" class="flex justify-between py-2 border-b border-muted/50 text-sm">
                <span class="text-muted-foreground font-medium">{{ key }}</span>
                <span class="font-bold text-right">{{ val }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products Placeholder -->
      <section class="mt-32 space-y-12">
        <div class="flex items-center justify-between">
          <h2 class="text-3xl font-display font-bold tracking-tight text-center">Frequently <span class="text-primary">Bought Together</span></h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           <div v-for="i in 4" :key="i" class="h-80 bg-muted/20 animate-pulse rounded-2xl"></div>
        </div>
      </section>
    </div>
  </div>
</template>

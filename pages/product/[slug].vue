<!-- File: /pages/product/[slug].vue -->
<script setup lang="ts">
import { 
  ChevronRight, 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Info, 
  Plus, 
  Minus, 
  Zap, 
  Cpu, 
  Globe, 
  Heart, 
  Check, 
  Package, 
  AlertCircle, 
  RefreshCw,
  Layers,
  Clock
} from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';
import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { toastSuccess } from '@/composables/useToast';
import type { Product } from '@/types';

const route = useRoute();
const productService = useProductService();
const categoryService = useCategoryService();
const cartStore = useCartStore();
const uiStore = useUIStore();

const slug = computed(() => (route.params.slug as string) || '');

// Fetch product details via async data using the route slug
const { data: product, pending: isLoading, error, refresh } = await useAsyncData(
  `product-detail-${slug.value}`,
  async () => {
    if (!slug.value) return null;
    return await productService.getProductDetails(slug.value);
  },
  {
    watch: [slug]
  }
);

// Quantity & local state
const quantity = ref(1);
const activeTab = ref<'description' | 'specification' | 'reviews'>('description');
const selectedImage = ref<string>('');
const isWishlisted = ref(false);

// Synchronize selected image and wishlist state when product data changes
watch(
  () => product.value,
  (newProd) => {
    if (newProd) {
      if (newProd.images && newProd.images.length > 0 && newProd.images[0]) {
        selectedImage.value = newProd.images[0];
      } else if (newProd.default_image) {
        selectedImage.value = typeof newProd.default_image === 'string'
          ? newProd.default_image
          : (newProd.default_image.image || '');
      } else {
        selectedImage.value = '';
      }
      isWishlisted.value = Boolean(newProd.wishlist);
    }
  },
  { immediate: true }
);

// Dynamic SEO metadata
useSeoMeta({
  title: () => product.value ? `${product.value.name} | Best Computer Hub` : 'Product Details | Best Computer Hub',
  description: () => product.value?.short_description || product.value?.description || 'Authentic hardware and computing components at Best Computer Hub. Official warranty and express fulfillment.',
  ogTitle: () => product.value?.name || 'Product Details',
  ogDescription: () => product.value?.short_description || product.value?.description || 'Shop authentic computer components with official warranty at Best Computer Hub.',
  ogImage: () => selectedImage.value || '/logo.svg'
});

// Category and Origin resolution
const originCategory = computed(() => {
  if (product.value?.origin && typeof product.value.origin === 'object') {
    return product.value.origin;
  }
  return null;
});

// Extract the leaf/actual category from product.categories (the last object in the hierarchical array)
const targetCategoryIdentifier = computed(() => {
  if (!product.value || !Array.isArray(product.value.categories) || product.value.categories.length === 0) {
    return null;
  }

  // Iterate backwards to find the first category that is not the product itself
  for (let i = product.value.categories.length - 1; i >= 0; i--) {
    const cat = product.value.categories[i];
    if (!cat) continue;

    let catId = '';
    let catSlug = '';

    if (typeof cat === 'object') {
      catId = cat.id !== undefined && cat.id !== null ? String(cat.id) : '';
      catSlug = cat.slug ? String(cat.slug) : '';
    } else if (typeof cat === 'number' || typeof cat === 'string') {
      catId = String(cat);
      catSlug = String(cat);
    }

    // Ignore if this category represents the product itself
    if (
      (catSlug && catSlug.toLowerCase() === slug.value.toLowerCase()) ||
      (product.value.slug && catSlug.toLowerCase() === product.value.slug.toLowerCase()) ||
      (product.value.id && catId === String(product.value.id))
    ) {
      continue;
    }

    // Found a valid category that is not the product itself
    if (typeof cat === 'object') {
      if (cat.id !== undefined && cat.id !== null && cat.id !== '') {
        return cat.id;
      }
      if (cat.slug) {
        return cat.slug;
      }
    } else {
      return cat;
    }
  }

  return null;
});

// Category path hierarchy fetched via Category Path API: GET /api/v1/categories/path/
const { data: categoryPath } = await useAsyncData(
  `product-category-path-${slug.value}`,
  async () => {
    const target = targetCategoryIdentifier.value;
    if (!target) return [];
    try {
      return await categoryService.getCategoryPath(target);
    } catch (e) {
      console.warn('Failed to load category path for product:', e);
      return [];
    }
  },
  {
    watch: [targetCategoryIdentifier]
  }
);

interface BreadcrumbItem {
  name: string;
  url: string;
}

const categoryBreadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];
  const path = categoryPath.value;

  if (Array.isArray(path) && path.length > 0) {
    // Render the returned path in its provided order:
    // Parent Category → Sub Category → Current Category
    path.forEach((catItem, idx) => {
      const slugPath = path.slice(0, idx + 1).map(c => c.slug).filter(Boolean).join('/');
      items.push({
        name: catItem.name,
        url: `/product-category/${slugPath}`
      });
    });
  } else if (originCategory.value?.name) {
    items.push({
      name: originCategory.value.name,
      url: originCategory.value.slug ? `/product-category/${originCategory.value.slug}` : '/products'
    });
  } else if (product.value?.category && typeof product.value.category === 'string' && product.value.category !== 'General') {
    items.push({
      name: product.value.category,
      url: '/products'
    });
  }

  return items;
});

const categoryName = computed(() => {
  if (categoryPath.value && categoryPath.value.length > 0) {
    const lastItem = categoryPath.value[categoryPath.value.length - 1];
    if (lastItem?.name) return lastItem.name;
  }
  if (originCategory.value?.name) return originCategory.value.name;
  if (product.value?.category && typeof product.value.category === 'string' && product.value.category !== 'General') {
    return product.value.category;
  }
  return 'Catalog';
});

const categoryUrl = computed(() => {
  if (categoryBreadcrumbs.value.length > 0) {
    const lastBc = categoryBreadcrumbs.value[categoryBreadcrumbs.value.length - 1];
    if (lastBc?.url) return lastBc.url;
  }
  if (originCategory.value?.slug) {
    return `/product-category/${originCategory.value.slug}`;
  }
  return '/products';
});

// Normalized specifications for display
const normalizedSpecs = computed(() => {
  if (!product.value?.specifications) return [];
  const specs = product.value.specifications;
  
  if (Array.isArray(specs)) {
    return specs.map((item: any, idx: number) => ({
      key: item.key || item.name || item.label || `Specification ${idx + 1}`,
      value: String(item.value ?? item.val ?? '')
    }));
  }
  
  if (typeof specs === 'object' && specs !== null) {
    return Object.entries(specs).map(([key, val]) => ({
      key,
      value: typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)
    }));
  }
  
  return [];
});

// Similar Trending Products
const similarProducts = ref<Product[]>([]);
const isSimilarLoading = ref(false);

const loadSimilarProducts = async () => {
  if (!product.value) return;
  isSimilarLoading.value = true;
  try {
    const catFilter = originCategory.value?.id || product.value.category;
    const res = await productService.getProductsList({
      category: catFilter,
      page_size: 4
    });
    similarProducts.value = res.results
      .filter(p => String(p.id) !== String(product.value?.id) && p.slug !== product.value?.slug)
      .slice(0, 4);
  } catch {
    similarProducts.value = [];
  } finally {
    isSimilarLoading.value = false;
  }
};

watch(
  () => product.value?.id,
  () => {
    loadSimilarProducts();
  },
  { immediate: true }
);

// Actions
const addToCart = () => {
  if (!product.value) return;
  cartStore.addToCart(product.value, quantity.value);
  toastSuccess(`Added ${quantity.value} × "${product.value.name}" to cart.`);
  uiStore.isCartOpen = true;
};

const toggleWishlist = () => {
  isWishlisted.value = !isWishlisted.value;
  if (isWishlisted.value) {
    toastSuccess(`Added "${product.value?.name}" to wishlist.`);
  } else {
    toastSuccess(`Removed from wishlist.`);
  }
};

const isItemInCart = computed(() => {
  if (!product.value) return false;
  return cartStore.items.some(item => String(item.productId) === String(product.value?.id));
});
</script>

<template>
  <div class="pb-16 sm:pb-20">
    <!-- Breadcrumbs -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-3 sm:py-4">
        <nav class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap custom-submenu-scrollbar" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-primary transition-colors shrink-0">Home</NuxtLink>

          <template v-for="bc in categoryBreadcrumbs" :key="bc.url">
            <ChevronRight class="w-3 h-3 shrink-0" />
            <NuxtLink :to="bc.url" class="hover:text-primary transition-colors shrink-0">
              {{ bc.name }}
            </NuxtLink>
          </template>

          <ChevronRight class="w-3 h-3 shrink-0" />
          <span class="text-foreground font-semibold truncate max-w-[160px] sm:max-w-[260px] md:max-w-none">
            {{ product?.name || slug }}
          </span>
        </nav>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="container mx-auto px-4 mt-6 sm:mt-8 lg:mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <div class="space-y-4">
          <div class="aspect-square rounded-2xl sm:rounded-3xl bg-muted/40 animate-pulse border"></div>
          <div class="flex gap-3">
            <div v-for="i in 4" :key="i" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted/40 animate-pulse border"></div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="h-4 w-28 bg-muted/60 rounded animate-pulse"></div>
          <div class="h-8 sm:h-12 w-4/5 bg-muted/60 rounded animate-pulse"></div>
          <div class="h-20 w-full bg-muted/40 rounded animate-pulse"></div>
          <div class="h-32 w-full bg-muted/30 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !product" class="container mx-auto px-4 mt-12 sm:mt-16 text-center max-w-lg">
      <div class="p-8 sm:p-12 rounded-3xl bg-card border shadow-sm space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle class="w-8 h-8" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold font-display">Product Specification Unavailable</h1>
          <p class="text-sm text-muted-foreground leading-relaxed">
            The requested product identifier <span class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{{ slug }}</span> could not be loaded from the catalog database.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <UiButton variant="outline" @click="refresh" class="w-full sm:w-auto gap-2">
            <RefreshCw class="w-4 h-4" /> Retry Query
          </UiButton>
          <UiButton to="/products" class="w-full sm:w-auto gap-2">
            <ArrowLeft class="w-4 h-4" /> Browse Catalog
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Product Loaded Content -->
    <div v-else class="container mx-auto px-4 mt-6 sm:mt-8 lg:mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <!-- Gallery / Image View -->
        <div class="space-y-4 sm:space-y-6">
          <div class="aspect-square rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden bg-muted/40 border group relative flex items-center justify-center p-4">
            <img 
              v-if="selectedImage" 
              :src="selectedImage" 
              :alt="product.name" 
              class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground/60 space-y-3">
              <Package class="w-16 h-16 stroke-1 text-muted-foreground/40" />
              <div class="space-y-1">
                <p class="font-bold text-sm text-foreground uppercase tracking-wider">{{ product.brand || 'Authentic Hardware' }}</p>
                <p class="text-xs text-muted-foreground">Standard Specification Unit</p>
              </div>
            </div>

            <!-- Badges -->
            <div class="absolute top-3 left-3 sm:top-6 sm:left-6 flex flex-col gap-2 sm:gap-3">
              <span v-if="product.isNew" class="bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">New Arrival</span>
              <span v-if="product.onSale || (product.originalPrice && product.originalPrice > product.price)" class="bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Promotional Pricing</span>
              <span v-if="isItemInCart || product.in_cart" class="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-1">
                <Check class="w-3 h-3" /> In Cart
              </span>
            </div>

            <!-- Wishlist Action -->
            <button 
              @click="toggleWishlist"
              class="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border flex items-center justify-center text-foreground hover:text-destructive hover:scale-110 transition-all cursor-pointer shadow-md"
              :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
            >
              <Heart :class="cn('w-5 h-5 transition-colors', isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground')" />
            </button>
          </div>
          
          <!-- Image Thumbnails (if multiple images exist) -->
          <div v-if="product.images && product.images.length > 1" class="flex gap-2 sm:gap-4 overflow-x-auto pb-2 custom-submenu-scrollbar">
            <button 
              v-for="(img, idx) in product.images" 
              :key="idx" 
              @click="selectedImage = img"
              :class="[
                'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-1 bg-muted/20 cursor-pointer',
                selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-primary/50'
              ]"
              :aria-label="`View product image ${idx + 1}`"
            >
              <img :src="img" :alt="`${product.name} thumbnail ${idx + 1}`" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <!-- Info & Actions -->
        <div class="space-y-6 sm:space-y-8 lg:space-y-10">
          <div class="space-y-3 sm:space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span v-if="product.brand" class="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">
                {{ product.brand }}
              </span>
              <span v-else class="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {{ categoryName }}
              </span>

              <div v-if="product.rating" class="flex items-center gap-1.5 px-2.5 py-1 bg-muted/80 rounded-full">
                <Star class="w-3.5 h-3.5 text-yellow-500 fill-current shrink-0" />
                <span class="text-xs sm:text-sm font-bold">{{ product.rating }}</span>
                <span v-if="product.reviewCount" class="text-[11px] sm:text-xs text-muted-foreground">({{ product.reviewCount }} Reviews)</span>
              </div>
            </div>

            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight break-words">
              {{ product.name }}
            </h1>

            <!-- Short Description -->
            <p v-if="product.short_description" class="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              {{ product.short_description }}
            </p>
            <p v-else-if="product.description" class="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-3">
              {{ product.description }}
            </p>
            
            <!-- Metadata & Attributes -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t">
              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Availability</span>
                <p class="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {{ product.stock > 0 ? `${product.stock} Units In Stock` : 'Available to Order' }}
                </p>
              </div>

              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Category</span>
                <NuxtLink :to="categoryUrl" class="text-xs font-semibold text-primary hover:underline block truncate">
                  {{ categoryName }}
                </NuxtLink>
              </div>

              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1 col-span-2 sm:col-span-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Product Code</span>
                <p class="text-xs font-mono font-medium text-foreground truncate">
                  {{ product.sku || `ID-${product.id}` }}
                </p>
              </div>
            </div>

            <!-- Value Highlights Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <ShieldCheck class="w-4 h-4 text-primary shrink-0" /> Authentic Hardware
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Sourced through verified commercial distribution channels with full manufacturer technical compliance.</p>
              </div>
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Zap class="w-4 h-4 text-primary shrink-0" /> Enterprise Reliability
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Built for continuous operations, tested against standardized workloads to ensure stable thermal and power envelopes.</p>
              </div>
            </div>
          </div>

          <!-- Pricing & Actions -->
          <div class="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-muted/30 border border-muted space-y-5 sm:space-y-6 lg:space-y-8">
            <div class="flex flex-wrap items-baseline gap-2 sm:gap-4">
              <span class="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
                {{ formatCurrency(product.current_selling_price || product.price) }}
              </span>
              <span v-if="product.originalPrice && product.originalPrice > (product.current_selling_price || product.price)" class="text-lg sm:text-xl text-muted-foreground line-through decoration-destructive/30">
                {{ formatCurrency(product.originalPrice) }}
              </span>
              <span v-if="product.originalPrice && product.originalPrice > (product.current_selling_price || product.price)" class="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-md">
                SAVE {{ Math.round((1 - (product.current_selling_price || product.price) / product.originalPrice) * 100) }}%
              </span>
            </div>

            <!-- Price History Note if available -->
            <div v-if="product.price_histories && product.price_histories.length > 0" class="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/40">
              <Clock class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Verified competitive price indexed against market benchmark records.</span>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div class="flex items-center justify-between sm:justify-start gap-4 bg-background border h-12 sm:h-14 rounded-xl sm:rounded-2xl px-4 py-2 w-full sm:w-auto shrink-0">
                <button 
                  @click="quantity = Math.max(1, quantity - 1)" 
                  class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" 
                  aria-label="Decrease quantity"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-bold text-center min-w-[2rem] text-sm sm:text-base">{{ quantity }}</span>
                <button 
                  @click="quantity++" 
                  class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" 
                  aria-label="Increase quantity"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
              
              <UiButton 
                @click="addToCart" 
                class="h-12 sm:h-14 w-full sm:w-auto sm:flex-grow px-6 sm:px-10 gap-3 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold"
              >
                <ShoppingCart class="w-5 h-5" />
                {{ isItemInCart ? 'Add More to Cart' : 'Add to Cart' }}
              </UiButton>
            </div>

            <!-- Trust Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div v-for="(item, idx) in [
                { icon: Truck, text: 'Express Delivery' },
                { icon: ShieldCheck, text: 'Official Warranty' },
                { icon: RotateCcw, text: 'Return Policy' },
                { icon: Info, text: 'All Taxes Included' }
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
            <h3 class="text-xl sm:text-2xl font-display font-bold">Similar <span class="text-primary italic">Hardware</span></h3>
            <p class="text-xs text-muted-foreground leading-relaxed">Frequently evaluated alongside this component for related deployments.</p>
          </div>
          
          <div v-if="similarProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <CommerceProductCard 
              v-for="p in similarProducts" 
              :key="p.id" 
              :product="p" 
            />
          </div>
          <div v-else class="p-6 bg-muted/20 rounded-2xl border border-dashed text-center">
            <p class="text-xs text-muted-foreground">Browse our full hardware catalog for matching components.</p>
          </div>

          <UiButton variant="ghost" class="w-full rounded-full font-bold group h-11 text-xs sm:text-sm" :to="categoryUrl">
            View Category Products <ChevronRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
        </aside>

        <!-- Main: Details Tabs -->
        <main class="lg:col-span-8 xl:col-span-9">
          <!-- Tabs Navigation -->
          <div class="flex border-b overflow-x-auto custom-submenu-scrollbar">
            <button 
              v-for="tab in (['description', 'specification', 'reviews'] as const)" 
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
                <div v-if="product.description" v-html="product.description" class="text-base sm:text-lg text-muted-foreground leading-relaxed"></div>
                <p v-else class="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Authentic hardware component engineered to rigorous enterprise standards with comprehensive manufacturer validation.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Cpu class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Premium Engineering</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">Engineered to official specifications, ensuring stable operation under continuous workloads.</p>
                </div>
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Zap class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Efficiency Focus</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">Optimized for power-to-performance efficiency and thermal stability across diverse system architectures.</p>
                </div>
              </div>
            </div>

            <!-- Specification Tab -->
            <div v-if="activeTab === 'specification'" class="space-y-6 sm:space-y-10">
              <div v-if="normalizedSpecs.length > 0" class="bg-card border rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <div class="grid grid-cols-1">
                  <div 
                    v-for="(spec, idx) in normalizedSpecs" 
                    :key="spec.key" 
                    :class="cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 px-4 sm:px-8 lg:px-10 gap-1 sm:gap-4 transition-colors hover:bg-muted/30',
                      idx !== normalizedSpecs.length - 1 && 'border-b border-muted'
                    )"
                  >
                    <span class="text-muted-foreground font-bold uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{{ spec.key }}</span>
                    <span class="font-bold text-sm sm:text-base lg:text-lg text-foreground sm:text-right break-words">{{ spec.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty Specs State -->
              <div v-else class="p-8 sm:p-12 text-center bg-card border rounded-2xl sm:rounded-[2.5rem] space-y-3">
                <Layers class="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p class="text-sm font-semibold text-foreground">Detailed technical specifications will be posted shortly.</p>
                <p class="text-xs text-muted-foreground">Contact technical support for specific electrical or dimensional parameters.</p>
              </div>
              
              <div class="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8 bg-primary/5 rounded-2xl sm:rounded-3xl border border-primary/10">
                 <Info class="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
                 <p class="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Specifications are manufacturer certified. Actual system performance may vary with integration topology and environmental parameters.</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="space-y-6 sm:space-y-12">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-muted/20 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border">
                <div class="space-y-1 sm:space-y-2">
                  <h4 class="text-xl sm:text-2xl md:text-3xl font-display font-bold">Customer Feedback</h4>
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="flex">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                    <span class="text-xs sm:text-sm font-bold">
                      {{ product.rating ? `${product.rating} Rating` : 'Verified Product' }}
                      {{ product.reviewCount ? `Based on ${product.reviewCount} Reviews` : '' }}
                    </span>
                  </div>
                </div>
                <UiButton variant="outline" class="rounded-full font-bold px-6 sm:px-8 h-10 sm:h-12 border-primary/20 text-primary hover:bg-primary/5 text-xs sm:text-sm w-full sm:w-auto shrink-0">Submit Review</UiButton>
              </div>

              <div class="space-y-4 sm:space-y-6">
                <div class="p-5 sm:p-8 bg-card border rounded-2xl sm:rounded-[2.5rem] space-y-4 sm:space-y-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center font-bold text-base sm:text-xl text-primary shrink-0">BC</div>
                      <div class="space-y-0.5 sm:space-y-1">
                        <p class="font-bold text-base sm:text-lg">Verified Customer</p>
                        <p class="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em]">Authentic Purchase & Deployment</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <p class="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed italic border-l-2 sm:border-l-4 border-primary/20 pl-4 sm:pl-6">
                    "Authentic product in original retail packaging with valid warranty. Delivered on time and performing exactly as specified."
                  </p>
                  <div class="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                    <span>Helpful?</span>
                    <button class="hover:text-primary transition-colors cursor-pointer">Yes (8)</button>
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

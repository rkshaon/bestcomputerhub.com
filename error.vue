<!-- File: /error.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Home, 
  Search, 
  ArrowLeft, 
  ShoppingBag, 
  Tag, 
  HelpCircle, 
  AlertTriangle, 
  Compass, 
  Server, 
  Cpu, 
  Sparkles 
} from 'lucide-vue-next';

const props = defineProps({
  error: Object
});

const is404 = computed(() => props.error?.statusCode === 404);

const searchQuery = ref('');

const handleSearch = () => {
  if (!searchQuery.value.trim()) return;
  const target = `/products?search=${encodeURIComponent(searchQuery.value.trim())}`;
  clearError({ redirect: target });
};

const handleGoHome = () => {
  clearError({ redirect: '/' });
};

const handleGoBack = () => {
  if (import.meta.client && window.history.length > 1) {
    window.history.back();
  } else {
    clearError({ redirect: '/' });
  }
};

const handleNavigate = (route: string) => {
  clearError({ redirect: route });
};

// Set SEO metadata for error view
useSeoMeta({
  title: is404.value ? '404 — Page Not Found | Best Computer Hub' : 'System Operations Error | Best Computer Hub',
  description: 'The requested resource could not be located on the Best Computer Hub storefront.',
  robots: 'noindex, follow'
});

const quickCategories = [
  { name: 'Graphics Cards', route: '/product-category/gpus/', icon: Cpu },
  { name: 'Processors', route: '/product-category/processors/', icon: Server },
  { name: 'Special Offers', route: '/offers', icon: Tag },
  { name: 'Help Center', route: '/support/help-center', icon: HelpCircle },
];
</script>

<template>
  <NuxtLayout name="default">
    <div class="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      <!-- Decorative Background Grid Accent -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <!-- Subtle Glow Blobs -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div class="max-w-2xl w-full text-center space-y-8 relative z-10">
        
        <!-- Status Indicator Graphic Card -->
        <div class="inline-flex flex-col items-center">
          <div class="relative group">
            <div class="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-2xl shadow-primary/5 flex items-center justify-center relative z-10 backdrop-blur-md">
              <div v-if="is404" class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  HTTP 404 // ROUTE_NOT_FOUND
                </div>
                <div class="text-6xl sm:text-8xl font-display font-black tracking-tighter text-foreground selection:bg-primary selection:text-primary-foreground leading-none">
                  4<span class="text-primary">0</span>4
                </div>
              </div>

              <div v-else class="text-center space-y-3">
                <div class="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <AlertTriangle class="w-8 h-8" />
                </div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-destructive/10 text-destructive border border-destructive/20">
                  HTTP {{ error?.statusCode || 500 }} // SYSTEM_EXCEPTION
                </div>
              </div>
            </div>

            <!-- Outer Decorative Frame Ring -->
            <div class="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary/20 via-primary/5 to-transparent blur-md -z-10 opacity-70"></div>
          </div>
        </div>

        <!-- Text Messaging -->
        <div class="space-y-3 max-w-lg mx-auto">
          <h1 class="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-foreground">
            {{ is404 ? 'Hardware Route Not Found' : 'Operation Interrupted' }}
          </h1>
          <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {{ is404 
              ? "We couldn't locate the requested component, product, or URL node. It may have been relocated, renamed, or discontinued." 
              : "An unexpected processing error occurred on this operation. Our technical team is investigating." 
            }}
          </p>
        </div>

        <!-- Direct Product Search Bar -->
        <div class="max-w-md mx-auto">
          <form @submit.prevent="handleSearch" class="relative flex items-center">
            <Search class="w-4 h-4 absolute left-4 text-muted-foreground pointer-events-none" />
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search products, GPUs, or model numbers..."
              class="w-full h-12 pl-11 pr-24 bg-card border border-input rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
            />
            <button
              type="submit"
              class="absolute right-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Search
            </button>
          </form>
        </div>

        <!-- Primary & Secondary Recovery Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            @click="handleGoHome"
            class="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:bg-primary-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Home class="w-4 h-4" />
            Back to Storefront
          </button>

          <button
            type="button"
            @click="() => handleNavigate('/products')"
            class="w-full sm:w-auto h-11 px-6 rounded-xl bg-card border border-border/80 text-foreground font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <ShoppingBag class="w-4 h-4 text-primary" />
            Browse Catalog
          </button>

          <button
            type="button"
            @click="handleGoBack"
            class="w-full sm:w-auto h-11 px-4 rounded-xl text-muted-foreground hover:text-foreground font-semibold text-sm inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            Previous Page
          </button>
        </div>

        <!-- Quick Destinations List -->
        <div class="pt-6 border-t border-border/40 max-w-lg mx-auto">
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Popular Destinations
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="item in quickCategories"
              :key="item.name"
              type="button"
              @click="() => handleNavigate(item.route)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/40 text-xs font-semibold text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <component :is="item.icon" class="w-3.5 h-3.5" />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </div>

        <!-- Technical Error Code Details -->
        <p class="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-widest">
          ERROR_CODE: {{ error?.statusCode || 500 }} {{ error?.statusMessage ? `// ${error.statusMessage}` : '' }}
        </p>

      </div>
    </div>
  </NuxtLayout>
</template>


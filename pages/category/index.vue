<script setup lang="ts">
import { ChevronRight, LayoutGrid, PackageSearch } from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';

const productService = useProductService();
const categories = productService.getCategories().filter(c => !c.parentCategoryId);
const allProducts = productService.getProducts();

const getSubCategories = (parentId: string) => {
  return productService.getCategories().filter(c => c.parentCategoryId === parentId);
};
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-muted/30 py-16 border-b">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-4">
            Curated <span class="text-primary italic">Collections</span>
          </h1>
          <p class="text-lg text-muted-foreground">
            Explore our comprehensive catalog of high-performance components and enterprise-grade technology.
          </p>
        </div>
      </div>
    </section>

    <!-- Categories list -->
    <section class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          v-for="cat in categories" 
          :key="cat.id"
          class="group bg-card border rounded-[2.5rem] overflow-hidden hover:border-primary/50 transition-all duration-500 flex flex-col md:flex-row"
        >
          <div class="md:w-1/2 aspect-square bg-muted relative overflow-hidden">
            <div class="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
            <div class="absolute inset-0 flex items-center justify-center">
               <div class="w-20 h-20 rounded-3xl bg-background flex items-center justify-center shadow-sm">
                 <LayoutGrid class="w-10 h-10 text-primary" />
               </div>
            </div>
          </div>

          <div class="md:w-1/2 p-8 flex flex-col">
            <div class="mb-6">
              <h2 class="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">{{ cat.name }}</h2>
              <p class="text-sm text-muted-foreground">{{ cat.description }}</p>
            </div>

            <div class="space-y-2 flex-grow">
              <NuxtLink 
                v-for="sub in getSubCategories(cat.id)" 
                :key="sub.id"
                :to="`/category/${sub.slug}`"
                class="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
              >
                {{ sub.name }}
                <ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NuxtLink>
            </div>

            <div class="mt-8">
              <NuxtLink :to="`/category/${cat.slug}`">
                <UiButton class="w-full rounded-full font-bold">
                  View All {{ cat.name }}
                </UiButton>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Global Stats / Features -->
    <section class="container mx-auto px-4 py-16">
      <div class="bg-black text-white p-12 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-12">
        <div class="space-y-4 max-w-sm">
          <h3 class="text-3xl font-display font-bold">Unparalleled Hardware Inventory</h3>
          <p class="text-white/60">From consumer peripherals to enterprise servers, we source only from verified manufacturers.</p>
        </div>
        
        <div class="grid grid-cols-2 gap-8">
          <div v-for="stat in [
            { label: 'Products', val: '2,500+' },
            { label: 'Brands', val: '45+' },
            { label: 'Clusters', val: '12' },
            { label: 'Uptime', val: '99.9%' }
          ]" :key="stat.label">
            <p class="text-3xl font-display font-bold text-primary">{{ stat.val }}</p>
            <p class="text-[10px] uppercase tracking-widest text-white/40 font-bold">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Browse all -->
     <section class="container mx-auto px-4 py-16 border-t mt-16">
        <div class="text-center space-y-6">
          <div class="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <PackageSearch class="w-8 h-8 text-muted-foreground" />
          </div>
          <div class="space-y-2">
            <h3 class="text-2xl font-bold">Can't find what you're looking for?</h3>
            <p class="text-muted-foreground max-w-md mx-auto">Our inventory is constantly expanding. Check out our New Arrivals for the latest tech drops.</p>
          </div>
          <NuxtLink to="/new-arrivals">
            <UiButton variant="outline" class="rounded-full px-8 h-12 font-bold mt-4">
              Browse New Arrivals
            </UiButton>
          </NuxtLink>
        </div>
     </section>
  </div>
</template>

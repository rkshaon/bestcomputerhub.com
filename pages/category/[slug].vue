<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ArrowLeft, SlidersHorizontal, LayoutGrid } from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import ProductCard from '@/components/commerce/ProductCard.vue';

const route = useRoute();
const productService = useProductService();

const slug = route.params.slug as string;

// Find current category
const categories = productService.getCategories();
const currentCategory = categories.find(c => c.slug === slug || c.id === slug);

// Find matching products
const products = productService.getProducts({ category: slug });
</script>

<template>
  <div class="min-h-screen pb-24 bg-background text-foreground">
    <!-- Header banner -->
    <section class="bg-muted/30 border-b py-16">
      <div class="container mx-auto px-6">
        <NuxtLink to="/category" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft class="w-4 h-4" /> All Collections
        </NuxtLink>

        <div class="max-w-2xl space-y-4">
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
            {{ currentCategory ? currentCategory.name : 'Category Catalog' }}
          </h1>
          <p class="text-lg text-muted-foreground">
            {{ currentCategory ? currentCategory.description : 'Browse our high-performance silicon components.' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Catalog body -->
    <section class="container mx-auto px-6 py-16">
      <!-- Controls -->
      <div class="flex items-center justify-between border-b pb-6 mb-12">
        <p class="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {{ products.length }} High-Performance Products
        </p>

        <div class="flex items-center gap-4">
          <UiButton variant="outline" size="sm" class="rounded-full gap-2 text-xs uppercase tracking-widest font-bold">
            <SlidersHorizontal class="w-4 h-4" /> Filter / Sort
          </UiButton>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="products.length === 0" class="py-24 text-center max-w-md mx-auto space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <LayoutGrid class="w-8 h-8 text-muted-foreground/50" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold">No products found</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            There are currently no products associated with the "{{ slug }}" classification segment. Check back shortly.
          </p>
        </div>
        <UiButton to="/category" class="rounded-full font-bold px-6">
          View All Collections
        </UiButton>
      </div>

      <!-- Products grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProductCard 
          v-for="product in products" 
          :key="product.id" 
          :product="product" 
        />
      </div>
    </section>
  </div>
</template>

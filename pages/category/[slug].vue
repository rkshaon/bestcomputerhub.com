<!-- File: /pages/category/[slug].vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCategoryService } from '@/composables/useCategoryService';
import { useProductService } from '@/composables/useProductService';

const route = useRoute();
const router = useRouter();
const productService = useProductService();
const categoryService = useCategoryService();

onMounted(() => {
  const slug = route.params.slug as string;
  const categories = productService.getCategories();
  const category = categories.find(c => c.slug === slug);
  if (category) {
    const targetUrl = categoryService.getCategoryUrl(category, categories);
    router.replace(targetUrl);
  } else {
    router.replace('/products');
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center space-y-4">
      <span class="animate-spin border-4 border-primary/30 border-t-primary rounded-full w-8 h-8 inline-block animate-spin"></span>
      <p class="text-muted-foreground text-sm font-semibold uppercase tracking-widest">Routing to Secure Sub-Catalog Node...</p>
    </div>
  </div>
</template>

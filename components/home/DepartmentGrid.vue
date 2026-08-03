<!-- File: /components/home/DepartmentGrid.vue -->
<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';

defineProps<{
  categories: Category[];
}>();

const categoryService = useCategoryService();
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="flex items-center justify-between mb-10">
      <h2 class="text-3xl font-display font-bold tracking-tight">Shop by <span class="text-primary">Department</span></h2>
      <NuxtLink to="/products" class="text-sm font-medium hover:underline flex items-center gap-1">
        Explore All <ChevronRight class="w-4 h-4" />
      </NuxtLink>
    </div>
    
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink 
        v-for="cat in categories" 
        :key="cat.id" 
        :to="categoryService.getCategoryUrl(cat)"
        class="aspect-[4/3] rounded-3xl bg-muted overflow-hidden relative group"
      >
        <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
        <div class="absolute inset-0 flex flex-col justify-end p-6 z-20">
          <h3 class="text-white text-xl font-bold tracking-tight">{{ cat.name }}</h3>
          <p class="text-white/70 text-xs translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            Browse products &rarr;
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

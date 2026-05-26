<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import type { Category } from '@/types';

const props = defineProps<{
  category: Category;
  allCategories: Category[];
}>();

const getCategoryBySlug = (slug: string) => {
  return props.allCategories.find(c => c.slug === slug);
};

const getSubCategories = (cat: Category): Category[] => {
  if (cat.children && Array.isArray(cat.children) && cat.children.length) {
    return cat.children;
  }
  
  if (cat.subCategories && Array.isArray(cat.subCategories)) {
    return cat.subCategories
      .map(slug => getCategoryBySlug(slug))
      .filter((c): c is Category => !!c);
  }
  
  return [];
};
</script>

<template>
  <div class="absolute top-full left-0 right-0 mx-auto hidden group-hover:block pt-3 z-50 w-[680px]">
    <div class="bg-background/95 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 w-full grid grid-cols-3 gap-8 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top">
      <div v-for="subCat in getSubCategories(category)" :key="subCat.id" class="space-y-4">
        <NuxtLink :to="`/category/${subCat.slug}`" class="font-bold text-[10px] uppercase tracking-widest block text-primary hover:translate-x-1 transition-transform">
          {{ subCat.name }}
        </NuxtLink>
        <ul class="space-y-2 border-l border-muted pl-4">
          <template v-if="getSubCategories(subCat).length">
            <li v-for="subSubCat in getSubCategories(subCat)" :key="subSubCat.id">
              <NuxtLink :to="`/category/${subSubCat.slug}`" class="text-[10px] uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors block whitespace-nowrap">
                {{ subSubCat.name }}
              </NuxtLink>
            </li>
          </template>
          <li v-else>
            <span class="text-[10px] text-muted-foreground italic uppercase tracking-tighter opacity-50">Latest Models</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

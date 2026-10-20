<!-- File: /components/home/FeaturedCategoryCard.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { decodeHtmlEntities, getCategoryIcon } from '@/utils';
import type { FeaturedCategory } from '@/types';

defineProps<{
  category: FeaturedCategory;
}>();

const imageError = ref(false);

const handleImageError = () => {
  imageError.value = true;
};
</script>

<template>
  <NuxtLink
    :to="'/product-category/' + category.slug + '/'"
    class="group relative flex flex-col items-center justify-center text-center p-1.5 rounded-xl bg-card border border-border/60 hover:border-primary/60 hover:bg-muted/30 shadow-xs hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full"
  >
    <!-- Icon Container -->
    <div class="w-[52px] h-[52px] rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-xs overflow-hidden p-1.5">
      <img
        v-if="category.featured_icon && !imageError"
        :src="category.featured_icon"
        :alt="decodeHtmlEntities(category.name)"
        class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
        @error="handleImageError"
      />
      <component
        v-else
        :is="getCategoryIcon(category.slug, category.name)"
        class="w-6 h-6"
        aria-hidden="true"
      />
    </div>

    <!-- Category Name -->
    <h3 class="text-xs sm:text-[13px] font-semibold text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-tight px-1">
      {{ decodeHtmlEntities(category.name) }}
    </h3>
  </NuxtLink>
</template>

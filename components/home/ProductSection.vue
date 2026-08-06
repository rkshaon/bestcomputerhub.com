<!-- File: /components/home/ProductSection.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import type { Product } from '@/types';

const props = defineProps<{
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  viewAllRoute?: string;
  viewAllText?: string;
  products: Product[];
}>();

const titleParts = computed(() => {
  if (!props.titleHighlight || !props.title.includes(props.titleHighlight)) {
    return { before: props.title, highlight: '', after: '' };
  }
  const index = props.title.indexOf(props.titleHighlight);
  return {
    before: props.title.slice(0, index),
    highlight: props.titleHighlight,
    after: props.title.slice(index + props.titleHighlight.length)
  };
});
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
      <div>
        <h2 class="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
          <template v-if="titleParts.highlight">
            {{ titleParts.before }}<span class="text-primary">{{ titleParts.highlight }}</span>{{ titleParts.after }}
          </template>
          <template v-else>
            {{ title }}
          </template>
        </h2>
        <p v-if="subtitle" class="text-muted-foreground mt-1 text-sm">{{ subtitle }}</p>
      </div>

      <NuxtLink 
        v-if="viewAllRoute"
        :to="viewAllRoute" 
        class="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm group shrink-0"
      >
        <span>{{ viewAllText || 'View All' }}</span>
        <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      <CommerceProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>

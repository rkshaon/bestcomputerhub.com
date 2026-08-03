<!-- File: /components/home/ProductSection.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from '@/types';

const props = defineProps<{
  title: string;
  titleHighlight?: string;
  subtitle?: string;
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
    <div class="flex items-center justify-between mb-10">
      <div>
        <h2 class="text-3xl font-display font-bold tracking-tight">
          <template v-if="titleParts.highlight">
            {{ titleParts.before }}<span class="text-primary">{{ titleParts.highlight }}</span>{{ titleParts.after }}
          </template>
          <template v-else>
            {{ title }}
          </template>
        </h2>
        <p v-if="subtitle" class="text-muted-foreground mt-1">{{ subtitle }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <CommerceProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>

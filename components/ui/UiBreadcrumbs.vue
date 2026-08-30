<script setup lang="ts">
import { Home, ChevronRight } from 'lucide-vue-next';
import { decodeHtmlEntities } from '@/utils';

interface BreadcrumbItem {
  name: string;
  url: string;
}

defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap custom-submenu-scrollbar py-1" aria-label="Breadcrumb">
    <NuxtLink to="/" class="hover:text-primary transition-colors shrink-0 flex items-center gap-1.5" aria-label="Home">
      <Home class="w-3.5 h-3.5 shrink-0" />
      <span class="hidden sm:inline">Home</span>
    </NuxtLink>

    <template v-for="(bc, index) in items" :key="bc.url + index">
      <ChevronRight class="w-3 h-3 shrink-0" />
      <NuxtLink 
        v-if="index < items.length - 1" 
        :to="bc.url" 
        class="hover:text-primary transition-colors shrink-0"
      >
        {{ decodeHtmlEntities(bc.name) }}
      </NuxtLink>
      <span v-else class="text-foreground font-semibold truncate max-w-[160px] sm:max-w-[260px] md:max-w-none shrink-0">
        {{ decodeHtmlEntities(bc.name) }}
      </span>
    </template>
  </nav>
</template>

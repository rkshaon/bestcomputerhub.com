<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
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
      <svg
        viewBox="0 0 576 512"
        class="w-3.5 h-3.5 shrink-0"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.31-.22a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.63l25.5-31a12 12 0 0 0-1.7-16.93z"
        />
      </svg>
      <!--
      <span class="hidden sm:inline">Home</span>
      -->
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

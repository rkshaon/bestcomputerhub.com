<script setup lang="ts">
import { cn } from '~/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div 
    :class="cn(
      'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-350',
      props.class
    )"
  >
    <slot />
  </div>
</template>

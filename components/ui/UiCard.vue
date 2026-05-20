<script setup lang="ts">
import { cn } from '@/utils';

const props = defineProps({
  padding: {
    type: String,
    default: 'p-6'
  },
  class: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <div 
    :class="cn(
      'bg-card text-card-foreground border border-border/80 rounded-[2.5rem] transition-all',
      padding === 'none' ? 'p-0' : padding,
      props.class
    )"
  >
    <slot />
  </div>
</template>

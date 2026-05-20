<script setup lang="ts">
import { cn } from '@/utils';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'sm'
  },
  class: {
    type: String,
    default: ''
  }
});

const variantStyles: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-muted text-muted-foreground border-border',
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-500 border-sky-500/20'
};

const sizeStyles: Record<string, string> = {
  xs: 'px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold rounded-lg',
  sm: 'px-2.5 py-1 text-xs font-medium rounded-xl',
  md: 'px-3 py-1.5 text-sm font-medium rounded-2xl'
};
</script>

<template>
  <span 
    :class="cn(
      'inline-flex items-center justify-center border font-display transition-all',
      variantStyles[props.variant] || 'bg-primary/10 text-primary border-primary/20',
      sizeStyles[props.size] || sizeStyles.sm,
      props.class
    )"
  >
    <slot />
  </span>
</template>

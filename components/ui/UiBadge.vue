<!-- File: /components/ui/UiBadge.vue -->
<script setup lang="ts">
import { cn } from '@/utils';

interface Props {
  variant?: 'primary' | 'secondary' | 'success'| 'warning' | 'error' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'xs'
});

const variants = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  ghost: 'bg-transparent text-muted-foreground border-transparent'
};

const sizes = {
  xs: 'px-2.5 py-0.5 text-[10px]',
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm'
};
</script>

<template>
  <span 
    :class="cn(
      'inline-flex items-center font-bold uppercase tracking-widest border rounded-full whitespace-nowrap',
      variants[variant],
      sizes[size]
    )"
  >
    <slot />
  </span>
</template>

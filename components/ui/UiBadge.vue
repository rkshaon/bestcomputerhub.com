<!-- File: /components/ui/UiBadge.vue -->
<script setup lang="ts">
import { cn } from '@/utils';

interface Props {
  variant?: 'primary' | 'secondary' | 'success'| 'warning' | 'error' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'xs'
});

const variants = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900',
  warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-100 dark:border-amber-900',
  error: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-100 dark:border-rose-900',
  ghost: 'bg-transparent text-slate-400 border-transparent'
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

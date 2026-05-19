<script setup lang="ts">
import { cn } from '~/utils';

interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral'
});

const variantClasses = {
  success: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40',
  warning: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40',
  danger: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40',
  info: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40',
  neutral: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800'
};
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none shrink-0 border',
      variantClasses[variant]
    )"
  >
    <slot />
  </span>
</template>

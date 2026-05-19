<script setup lang="ts">
import { cn } from '~/utils';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'rose' | 'indigo' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

const variantClasses = {
  primary: 'bg-slate-900 border border-slate-950 text-white hover:bg-black dark:bg-white dark:border-slate-100 dark:text-slate-950 dark:hover:bg-slate-50',
  secondary: 'bg-slate-100 border border-slate-200/50 text-slate-800 hover:bg-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-50',
  rose: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600',
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
};

const sizeClasses = {
  sm: 'h-9 px-4 text-[10px] rounded-xl font-bold uppercase tracking-widest',
  md: 'h-11 px-6 text-[11px] rounded-2xl font-bold uppercase tracking-widest',
  lg: 'h-13 px-8 text-xs rounded-3xl font-bold uppercase tracking-widest',
  icon: 'h-10 w-10 flex items-center justify-center rounded-xl p-0'
};
</script>

<template>
  <button
    :disabled="disabled"
    :class="cn(
      'inline-flex items-center justify-center gap-2 font-display select-none transition-all duration-200 outline-none focus:ring-4 focus:ring-primary/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
      variantClasses[variant],
      sizeClasses[size]
    )"
  >
    <slot />
  </button>
</template>

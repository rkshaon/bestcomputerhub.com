<script setup lang="ts">
import { cn } from '@/utils';

interface Props {
  variant?: 'default' | 'glass' | 'outline' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false
});

const variantClasses = {
  default: 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm',
  glass: 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20 dark:border-slate-800/50 shadow-2xl',
  outline: 'bg-transparent border-slate-200 dark:border-slate-800 shadow-none',
  flat: 'bg-slate-50 dark:bg-slate-900 border-transparent shadow-none'
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};
</script>

<template>
  <div 
    :class="cn(
      'rounded-[2.5rem] border transition-all duration-300',
      variantClasses[variant],
      paddingClasses[padding],
      hover && 'hover:scale-[1.01] hover:border-primary/30',
      $attrs.class as string
    )"
  >
    <slot />
  </div>
</template>

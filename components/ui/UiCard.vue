<!-- File: /components/ui/UiCard.vue -->
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
  default: 'bg-card text-card-foreground border-border shadow-sm',
  glass: 'bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl',
  outline: 'bg-transparent border-border shadow-none',
  flat: 'bg-muted text-muted-foreground border-transparent shadow-none'
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

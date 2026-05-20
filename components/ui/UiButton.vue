<script setup lang="ts">
import { cn } from '@/utils';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary' | 'secondary' | 'outline' | 'ghost'
  },
  size: {
    type: String,
    default: 'md' // 'sm' | 'md' | 'lg' | 'icon'
  },
  to: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  class: {
    type: String,
    default: ''
  }
});

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-lg shadow-primary/10 active:scale-[0.98]',
  secondary: 'bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 active:scale-[0.98]',
  outline: 'bg-transparent text-foreground border border-border hover:bg-accent/40 hover:border-foreground/25 active:scale-[0.98]',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-4 h-9 text-xs rounded-xl',
  md: 'px-6 h-12 text-sm rounded-2xl',
  lg: 'px-8 h-14 text-base rounded-[1.25rem]',
  icon: 'w-12 h-12 items-center justify-center rounded-2xl p-0'
};
</script>

<template>
  <NuxtLink 
    v-if="props.to" 
    :to="props.to" 
    :class="cn(
      'inline-flex items-center justify-center font-display transition-all duration-300 pointer-events-auto select-none',
      variantStyles[props.variant] || variantStyles.primary,
      sizeStyles[props.size] || sizeStyles.md,
      props.disabled && 'opacity-60 pointer-events-none touch-none',
      props.class
    )"
  >
    <slot />
  </NuxtLink>
  <button 
    v-else 
    :type="'button'"
    :disabled="props.disabled || props.loading"
    :class="cn(
      'inline-flex items-center justify-center font-display transition-all duration-300 select-none outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
      variantStyles[props.variant] || variantStyles.primary,
      sizeStyles[props.size] || sizeStyles.md,
      (props.disabled || props.loading) && 'opacity-65 cursor-not-allowed pointer-events-none',
      props.class
    )"
  >
    <slot />
  </button>
</template>

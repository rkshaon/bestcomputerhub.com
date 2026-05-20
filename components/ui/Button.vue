<script setup lang="ts">
import { computed, resolveComponent } from 'vue';
import { cn } from '@/utils';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  class?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  to?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
});

const isLink = computed(() => !!props.to);
const componentTag = computed(() => isLink.value ? resolveComponent('NuxtLink') : 'button');

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2',
  lg: 'h-12 px-8 text-lg',
  icon: 'h-10 w-10 p-0',
};
</script>

<template>
  <component
    :is="componentTag"
    :to="to"
    :type="isLink ? undefined : type"
    :class="cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shrink-0 cursor-pointer no-underline',
      variants[variant],
      sizes[size],
      props.class
    )"
    :disabled="disabled"
  >
    <slot />
  </component>
</template>

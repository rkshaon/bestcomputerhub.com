<!-- File: /components/ui/UiBrandLogo.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  class?: string;
  imgClass?: string;
  textClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showText: true,
  class: '',
  imgClass: '',
  textClass: '',
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return { img: 'w-7 h-7', text: 'text-sm sm:text-base' };
    case 'lg':
      return { img: 'w-11 h-11', text: 'text-xl sm:text-2xl' };
    case 'xl':
      return { img: 'w-14 h-14', text: 'text-2xl sm:text-3xl' };
    case 'md':
    default:
      return { img: 'w-9 h-9', text: 'text-lg sm:text-xl' };
  }
});
</script>

<template>
  <div :class="cn('flex items-center gap-2.5 select-none shrink-0 group', props.class)">
    <img 
      src="/logo.svg" 
      alt="Best Computer Hub" 
      :class="cn('object-contain transition-transform duration-300 group-hover:scale-105 shrink-0', sizeClasses.img, props.imgClass)"
    />
    <span 
      v-if="showText" 
      :class="cn('font-display font-black tracking-tight text-foreground transition-all duration-300', sizeClasses.text, props.textClass)"
    >
      Best Computer <span class="text-primary">Hub</span>
    </span>
  </div>
</template>

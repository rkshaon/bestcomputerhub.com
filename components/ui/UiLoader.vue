<!-- File: /components/ui/UiLoader.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils';

export type UiLoaderSize = 'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;

interface Props {
  size?: UiLoaderSize;
  centered?: boolean;
  label?: string;
  showLabel?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'auto',
  centered: false,
  label: 'Loading...',
  showLabel: false,
  class: '',
});

const PRESET_SIZE_CLASSES: Record<'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  auto: 'w-[clamp(1.75rem,3.5vw,3rem)] h-[clamp(1.75rem,3.5vw,3rem)] max-w-full max-h-full',
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const isPresetSize = computed(() => {
  return typeof props.size === 'string' && props.size in PRESET_SIZE_CLASSES;
});

const isClassSize = computed(() => {
  if (typeof props.size !== 'string' || isPresetSize.value) return false;
  return /(?:^|\s)(?:w-|h-|size-)/.test(props.size);
});

const sizeClasses = computed(() => {
  if (isPresetSize.value) {
    return PRESET_SIZE_CLASSES[props.size as keyof typeof PRESET_SIZE_CLASSES];
  }
  if (isClassSize.value) {
    return props.size as string;
  }
  return '';
});

const customSizeStyle = computed<Record<string, string> | undefined>(() => {
  if (isPresetSize.value || isClassSize.value) {
    return undefined;
  }
  if (typeof props.size === 'number' && Number.isFinite(props.size) && props.size > 0) {
    const px = `${props.size}px`;
    return { width: px, height: px };
  }
  if (typeof props.size === 'string') {
    const trimmed = props.size.trim();
    if (trimmed) {
      return { width: trimmed, height: trimmed };
    }
  }
  return undefined;
});

const trimmedLabel = computed(() => props.label?.trim() || '');
const hasLabel = computed(() => trimmedLabel.value.length > 0);
</script>

<template>
  <span
    :role="hasLabel ? 'status' : undefined"
    :aria-live="hasLabel ? 'polite' : undefined"
    :aria-hidden="hasLabel ? undefined : 'true'"
    :class="cn(
      'select-none shrink-0 items-center justify-center',
      centered ? 'flex w-full h-full' : 'inline-flex align-middle',
      showLabel && hasLabel ? 'flex-col gap-2.5 text-center' : '',
      props.class
    )"
  >
    <img
      src="/favicon.svg"
      alt=""
      width="200"
      height="200"
      decoding="async"
      draggable="false"
      aria-hidden="true"
      :class="cn(
        'ui-loader-logo block aspect-square shrink-0 object-contain pointer-events-none',
        sizeClasses
      )"
      :style="customSizeStyle"
    />
    <span
      v-if="hasLabel && showLabel"
      class="text-xs sm:text-sm font-medium text-muted-foreground leading-tight"
    >
      {{ trimmedLabel }}
    </span>
    <span v-else-if="hasLabel" class="sr-only">
      {{ trimmedLabel }}
    </span>
  </span>
</template>

<style scoped>
@keyframes ui-loader-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ui-loader-logo {
  transform-origin: center;
  animation: ui-loader-spin 1.4s linear infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .ui-loader-logo {
    animation: none;
  }
}
</style>

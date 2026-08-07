<!-- File: /components/ui/UiInfiniteScroll.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-vue-next';

interface Props {
  hasMore?: boolean;
  isLoading?: boolean;
  error?: string | null;
  rootMargin?: string;
  threshold?: number | number[];
  endText?: string;
  showEndText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasMore: true,
  isLoading: false,
  error: null,
  rootMargin: '150px',
  threshold: 0.1,
  endText: 'All items loaded',
  showEndText: true
});

const emit = defineEmits<{
  (e: 'loadMore'): void;
  (e: 'retry'): void;
}>();

const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const createObserver = () => {
  if (typeof window === 'undefined' || !window.IntersectionObserver) return;
  
  destroyObserver();

  observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry && entry.isIntersecting) {
      if (props.hasMore && !props.isLoading && !props.error) {
        emit('loadMore');
      }
    }
  }, {
    rootMargin: props.rootMargin,
    threshold: props.threshold
  });

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
};

const destroyObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

onMounted(() => {
  createObserver();
});

onBeforeUnmount(() => {
  destroyObserver();
});

// Re-observe if sentinel or loading/hasMore state changes
watch([() => props.hasMore, () => props.isLoading, () => props.error], () => {
  if (sentinelRef.value && observer) {
    observer.unobserve(sentinelRef.value);
    observer.observe(sentinelRef.value);
  }
});
</script>

<template>
  <div class="py-4 text-center text-xs text-muted-foreground w-full">
    
    <!-- Loading Next Page State -->
    <div v-if="isLoading" class="flex items-center justify-center gap-2 py-2">
      <Loader2 class="w-4 h-4 animate-spin text-primary" />
      <span class="font-medium text-foreground">Loading more items...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center gap-2 py-2 text-destructive">
      <div class="flex items-center gap-1.5 font-semibold">
        <AlertCircle class="w-4 h-4" />
        <span>{{ error }}</span>
      </div>
      <button 
        type="button" 
        @click="emit('retry')"
        class="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1"
      >
        <RefreshCw class="w-3 h-3" />
        <span>Tap to retry</span>
      </button>
    </div>

    <!-- End of List Indicator -->
    <div v-else-if="!hasMore && showEndText" class="py-2 text-[11px] font-medium text-muted-foreground/70 tracking-wider uppercase">
      {{ endText }}
    </div>

    <!-- Invisible Intersection Observer Sentinel Target -->
    <div ref="sentinelRef" class="h-2 w-full pointer-events-none opacity-0"></div>

  </div>
</template>

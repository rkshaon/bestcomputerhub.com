<!-- File: /components/layout/NavigationLoader.vue -->
<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useLoadingIndicator, useNuxtApp } from '#app';

const nuxtApp = useNuxtApp();

const { isLoading, finish } = useLoadingIndicator({
  throttle: 0,
  hideDelay: 0,
  resetDelay: 0,
});

const cleanupHooks: Array<() => void> = [];

if (import.meta.client) {
  cleanupHooks.push(
    nuxtApp.hook('app:error', () => {
      finish({ error: true, force: true });
    }),
    nuxtApp.hook('app:error:cleared', () => {
      finish({ force: true });
    }),
  );
}

onBeforeUnmount(() => {
  while (cleanupHooks.length > 0) {
    cleanupHooks.pop()?.();
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLoading"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card/95 backdrop-blur-xl border border-border/80 text-card-foreground shadow-xl">
        <UiLoader size="sm" label="" />
        <span class="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
          Loading page...
        </span>
      </div>
    </div>
  </Transition>
</template>

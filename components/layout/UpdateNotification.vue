<!-- File: /components/layout/UpdateNotification.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { Sparkles, RefreshCw, X } from 'lucide-vue-next';
import { useVersionCheck } from '@/composables/useVersionCheck';

const { hasUpdate, refreshApp, dismissUpdate, startPeriodicCheck } = useVersionCheck();

let cleanup: (() => void) | undefined;

onMounted(() => {
  cleanup = startPeriodicCheck(60000);
});

onBeforeUnmount(() => {
  if (cleanup) {
    cleanup();
  }
});
</script>

<template>
  <transition
    enter-active-class="transform transition ease-out duration-300"
    enter-from-class="-translate-y-4 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transform transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="-translate-y-4 opacity-0 scale-95"
  >
    <div
      v-if="hasUpdate"
      role="alert"
      aria-live="polite"
      class="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto sm:max-w-md z-[110]"
    >
      <div class="bg-card text-card-foreground border border-primary/40 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex items-center justify-between gap-3 backdrop-blur-md">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles class="w-5 h-5 animate-pulse text-primary" />
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-bold text-foreground leading-snug">
              A new version is available. Refresh to update.
            </p>
            <p class="text-[11px] sm:text-xs text-muted-foreground truncate">
              Click refresh to load the latest components and assets.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <UiButton
            size="sm"
            variant="primary"
            class="h-8 px-3 text-xs font-bold gap-1.5 rounded-lg cursor-pointer"
            @click="refreshApp"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>Refresh</span>
          </UiButton>
          <button
            type="button"
            @click="dismissUpdate"
            class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

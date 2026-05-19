<script setup lang="ts">
import { useUIStore } from '~/stores/ui';

const uiStore = useUIStore();

// Initialize theme on client mount
onMounted(() => {
  uiStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

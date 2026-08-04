<!-- File: /app.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useCookieStore } from '@/stores/cookies';
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css';

const uiStore = useUIStore();
const cookieStore = useCookieStore();

// Handle logic
onMounted(() => {
  uiStore.initTheme();
  cookieStore.loadFromStorage();
});
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <LayoutCookieBanner />
    <LayoutFloatingActions />
    <LayoutBackToTop />
    <Toaster position="top-center" :richColors="true" :closeButton="true" />
  </div>
</template>

<style>
/* Global transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

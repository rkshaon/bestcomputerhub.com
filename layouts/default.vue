<!-- File: /layouts/default.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from '#app';

const route = useRoute();
const isAuthRoute = computed(() => {
  const p = route.path;
  return p === '/login' || p === '/login/' || p === '/signup' || p === '/signup/';
});
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <LayoutHeader />
    
    <main
      class="flex-grow pt-24 md:pt-0"
      :class="isAuthRoute ? 'pb-[calc(4.5rem_+_env(safe-area-inset-bottom,0px))] md:pb-0' : ''"
    >
      <slot />
    </main>

    <LayoutFooter />
    <CommerceCartDrawer />
    <LayoutBottomNav class="md:hidden" />
    <LayoutNavigationLoader />
  </div>
</template>

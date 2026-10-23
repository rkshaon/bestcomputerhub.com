<!-- File: /layouts/default.vue -->
<template>
  <div class="flex flex-col min-h-screen">
    <LayoutHeader />
    
    <main class="flex-grow pt-24 md:pt-0 pb-16 md:pb-0">
      <slot />
    </main>

    <LayoutFooter />
    <CommerceCartDrawer />
    <LayoutBottomNav class="md:hidden" />
  </div>
</template>

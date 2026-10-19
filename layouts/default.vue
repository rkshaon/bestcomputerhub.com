<!-- File: /layouts/default.vue -->
<template>
  <div class="flex flex-col min-h-screen">
    <LayoutHeader />
    
    <main class="flex-grow pt-24 md:pt-0 pb-20 md:pb-0">
      <slot />
    </main>

    <LayoutFooter />
    <CommerceCartDrawer />
    <LayoutBottomNav />
  </div>
</template>

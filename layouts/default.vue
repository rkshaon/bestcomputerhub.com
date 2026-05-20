<template>
  <div class="flex flex-col min-h-screen">
    <LayoutHeader />
    
    <main class="flex-grow">
      <slot />
    </main>

    <LayoutFooter />
    <CommerceCartDrawer />
  </div>
</template>

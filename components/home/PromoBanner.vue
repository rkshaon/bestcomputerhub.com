<!-- File: /components/home/PromoBanner.vue -->
<script setup lang="ts">
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="rounded-[2.5rem] bg-primary p-12 text-primary-foreground flex flex-col items-center text-center gap-8 overflow-hidden relative">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
      
      <span class="bg-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Enterprise Offer</span>
      <h2 class="text-4xl md:text-6xl font-display font-bold max-w-3xl">Professional Workstations for Remote Innovation.</h2>
      <p class="text-primary-foreground/70 max-w-xl text-lg">Save up to 40% on bulk enterprise hardware orders. Specialized configuration support included.</p>
      <UiButton variant="secondary" size="lg" class="rounded-full shadow-2xl">Contact Solutions Expert</UiButton>
    </div>
  </section>
</template>

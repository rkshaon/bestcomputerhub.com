<!-- File: /components/home/PromoBanner.vue -->
<script setup lang="ts">
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] bg-primary p-6 sm:p-10 md:p-12 text-primary-foreground flex flex-col items-center text-center gap-6 sm:gap-8 overflow-hidden relative">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
      
      <span class="bg-white/10 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">Enterprise Offer</span>
      <h2 class="text-2xl sm:text-4xl md:text-6xl font-display font-bold max-w-3xl leading-tight">Professional Workstations for Remote Innovation.</h2>
      <p class="text-primary-foreground/80 max-w-xl text-xs sm:text-base md:text-lg leading-relaxed">Save up to 40% on bulk enterprise hardware orders. Specialized configuration support included.</p>
      <UiButton variant="secondary" size="lg" class="rounded-full shadow-2xl font-bold">Contact Solutions Expert</UiButton>
    </div>
  </section>
</template>

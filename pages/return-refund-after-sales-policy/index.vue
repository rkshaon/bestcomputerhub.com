<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBrandService } from '@/composables/useBrandService';
import type { Brand } from '@/types';
import HomeBrandMarquee from '@/components/home/BrandMarquee.vue';

const brandService = useBrandService();
const brandsList = ref<Brand[]>([]);

onMounted(async () => {
  try {
    const registry = await brandService.getBrandsList();
    if (registry && registry.length > 0) {
      brandsList.value = registry.filter(b => b.is_active !== false);
    }
  } catch (error) {
    console.error('Failed to load brands for Return Policy page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">Return, Refund & After-Sales Policy</h1>
    
    <section class="space-y-6 text-muted-foreground leading-relaxed">
      <!-- Bengali Content -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-2">রিটার্ন ও রিফান্ড পলিসি (Bengali)</h2>
        <div v-for="i in 9" :key="'bn-'+i" class="space-y-2">
          <p class="font-semibold text-foreground">{{ i }}. [Bengali Section {{ i }}]</p>
        </div>
      </div>

      <!-- English Content -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-2">Return & Refund Policy (English)</h2>
        <div v-for="i in 9" :key="'en-'+i" class="space-y-2">
          <p class="font-semibold text-foreground">{{ i }}. [English Section {{ i }}]</p>
        </div>
      </div>

      <!-- Final Bengali Contact Line -->
      <p class="font-bold text-foreground border-t pt-4">
        [Final Bengali Contact Number Line]
      </p>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

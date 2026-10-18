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
    console.error('Failed to load brands for Warranty Policy page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">Warranty Policy</h1>
    
    <section class="space-y-4 text-muted-foreground leading-relaxed">
      <p>[Please provide the source Bengali content to replace this placeholder. Ensure all 6 content sections and 16 numbered conditions are included exactly as provided.]</p>
      
      <!-- 16 Numbered Conditions -->
      <div v-for="i in 16" :key="i" class="space-y-2">
        <p class="font-semibold text-foreground">{{ i }}. [Condition {{ i }}]</p>
      </div>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

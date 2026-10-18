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
    console.error('Failed to load brands for Disclaimer page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">Disclaimer</h1>
    
    <section class="space-y-4">
      <p>[Bengali content placeholder]</p>
      <p>[English content placeholder]</p>
      
      <!-- 11 Numbered Sections -->
      <div v-for="i in 11" :key="i" class="space-y-2">
        <h2 class="text-xl font-bold">{{ i }}. Section Heading {{ i }}</h2>
        <p>[Content for section {{ i }}]</p>
      </div>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

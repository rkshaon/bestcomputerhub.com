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
    console.error('Failed to load brands for Delivery Policy page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">Delivery Policy</h1>
    
    <section class="space-y-6 text-muted-foreground leading-relaxed">
      <!-- Bengali Content -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-2">ডেলিভারি পলিসি (Bengali)</h2>
        <p>[Insert complete Bengali delivery policy content here.]</p>
      </div>

      <!-- English Content -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-2">Delivery Policy (English)</h2>
        <p>[Insert complete English delivery policy content here.]</p>
        <p class="mt-4">
          For any inquiries, contact: 
          <a href="mailto:support@bestcomputerhub.com" class="text-primary hover:underline">support@bestcomputerhub.com</a>
        </p>
      </div>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

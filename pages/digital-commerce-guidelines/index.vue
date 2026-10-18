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
    console.error('Failed to load brands:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">ডিজিটাল কমার্স নির্দেশিকা ২০২১</h1>
    
    <section class="space-y-4 text-muted-foreground leading-relaxed">
      <p>[Please insert the exact content for 'ডিজিটাল কমার্স নির্দেশিকা ২০২১' here, maintaining all formatting, headings, and lists as required.]</p>

      <div class="pt-4">
        <a href="https://bestcomputerhub.com/wp-content/uploads/2026/07/40432_35501.pdf" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-bold">
          Download PDF
        </a>
      </div>
      
      <p>Contact: <a href="mailto:support@bestcomputerhub.com" class="text-primary hover:underline">support@bestcomputerhub.com</a></p>
      <p>Website: <a href="http://www.bestcomputerhub.com/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">http://www.bestcomputerhub.com/</a></p>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

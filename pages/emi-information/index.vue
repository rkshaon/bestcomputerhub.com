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
    console.error('Failed to load brands for EMI page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">EMI Information</h1>
    
    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Easy EMI Facility</h2>
      <p class="text-muted-foreground leading-relaxed">
        [Insert Easy EMI Facility introductory paragraph here.]
      </p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">EMI Terms & Conditions</h2>
      <ul class="list-decimal pl-6 space-y-2 text-muted-foreground leading-relaxed">
        <li>[Bengali T&C 1]</li>
        <li>[Bengali T&C 2]</li>
        <li>[Bengali T&C 3]</li>
        <li>[Bengali T&C 4]</li>
        <li>[Bengali T&C 5]</li>
        <li>[Bengali T&C 6]</li>
        <li>[Bengali T&C 7]</li>
        <li>[Bengali T&C 8]</li>
        <li>[Bengali T&C 9]</li>
      </ul>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Participating Banks</h2>
      <p class="text-muted-foreground mb-4">
        [Insert Participating Banks introductory Bengali paragraph here.]
      </p>
      <div class="mb-4">
        <!-- Placeholder for Bank Image -->
        <img src="https://bestcomputerhub.com/wp-content/uploads/2026/07/emi-banks-1024x313.webp" alt="Participating Banks" class="w-full max-w-2xl rounded-lg" />
      </div>
      <p class="font-bold text-foreground bg-amber-50 p-4 rounded-md border border-amber-200">
        [Insert bold Bengali notice about latest EMI charges and banks.]
      </p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Bank EMI Charge Table</h2>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm text-left">
          <thead class="bg-muted text-foreground">
            <tr>
              <th class="p-3">Bank Name</th>
              <th class="p-3">3 Month</th>
              <th class="p-3">6 Month</th>
              <th class="p-3">9 Month</th>
              <th class="p-3">12 Month</th>
              <th class="p-3">18 Month</th>
              <th class="p-3">24 Month</th>
              <th class="p-3">30 Month</th>
              <th class="p-3">36 Month</th>
            </tr>
          </thead>
          <tbody class="text-muted-foreground">
            <tr>
              <td class="p-3 border-t">Example Bank</td>
              <td class="p-3 border-t">0%</td>
              <td class="p-3 border-t">0%</td>
              <td class="p-3 border-t">N/A</td>
              <td class="p-3 border-t">N/A</td>
              <td class="p-3 border-t">N/A</td>
              <td class="p-3 border-t">N/A</td>
              <td class="p-3 border-t">N/A</td>
              <td class="p-3 border-t">N/A</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

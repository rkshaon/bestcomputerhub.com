<!-- File: /pages/index.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import type { Brand } from '@/types';

// Explicitly use the composables
const productService = useProductService();
const brandService = useBrandService();

const featuredProducts = productService.getFeaturedProducts();
const newArrivals = productService.getNewArrivals();
const homeCategories = computed(() => productService.getCategories().filter(c => !c.parentCategoryId));

// Initialize brands with standard defaults from product service mapping for high SSR alignment and zero layout pop
const brandsList = ref<Brand[]>(
  productService.getBrands().map(b => ({
    ...b,
    is_active: b.is_active !== false
  }))
);

// On mount, poll the dynamic client / mock states to capture newly registered / edited administrative partner nodes
onMounted(async () => {
  try {
    const registry = await brandService.getBrandsList();
    if (registry && registry.length > 0) {
      brandsList.value = registry.filter(b => b.is_active !== false);
    }
  } catch (error) {
    console.error('Core Protocol Exception: Failed to poll partner registry on home page slide render.', error);
  }
});
</script>

<template>
  <div class="space-y-20 pb-20">
    <!-- Hero Section -->
    <HomeHeroSection />

    <!-- Quick Links -->
    <HomeQuickLinks />

    <!-- Brand Marquee -->
    <HomeBrandMarquee :brands="brandsList" />

    <!-- Value Propositions -->
    <HomeValuePropositions />

    <!-- Shop by Department -->
    <HomeDepartmentGrid :categories="homeCategories" />

    <!-- Featured Products -->
    <HomeProductSection
      title="Weekly Headliners"
      title-highlight="Headliners"
      subtitle="Hand-picked premium selections for enthusiasts."
      :products="featuredProducts"
    />

    <!-- Special Promo Banner -->
    <HomePromoBanner />

    <!-- New Arrivals -->
    <HomeProductSection
      title="Fresh in Stock"
      title-highlight="Stock"
      :products="newArrivals"
    />
  </div>
</template>

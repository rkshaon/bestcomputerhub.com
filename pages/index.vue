<!-- File: /pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import type { Brand } from '@/types';

// Explicitly use the composables
const productService = useProductService();
const brandService = useBrandService();

const featuredProducts = productService.getFeaturedProducts();
const flashSaleProducts = productService.getOnSaleProducts();
const bestSellerProducts = productService.getBestSellers();

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

    <!-- Featured Categories -->
    <HomeFeaturedCategories />

    <!-- Flash Sale -->
    <HomeProductSection
      title="Flash Sale"
      title-highlight="Sale"
      subtitle="Limited time enterprise hardware deals & promotional prices."
      view-all-route="/offers"
      view-all-text="View All Deals"
      :products="flashSaleProducts"
    />

    <!-- Best Sellers -->
    <HomeProductSection
      title="Best Sellers"
      title-highlight="Sellers"
      subtitle="Top performing hardware & enterprise solutions chosen by our clients."
      view-all-route="/products"
      view-all-text="Explore All Products"
      :products="bestSellerProducts"
    />

    <!-- Brand Marquee -->
    <HomeBrandMarquee :brands="brandsList" />

    <!-- Featured Products -->
    <HomeProductSection
      title="Weekly Headliners"
      title-highlight="Headliners"
      subtitle="Hand-picked premium selections for enthusiasts."
      :products="featuredProducts"
    />

    <!-- Special Promo Banner -->
    <HomePromoBanner />
  </div>
</template>

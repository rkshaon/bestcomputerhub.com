<!-- File: /pages/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import type { Brand, Product } from '@/types';

useSeoMeta({
  title: 'Best Computer Hub | Gaming PC, Laptop & Computer Accessories in Bangladesh',
  description: 'Best Computer Hub is your trusted destination for gaming PCs, laptops, computer components, networking devices, accessories, and enterprise hardware in Bangladesh. Shop authentic products at competitive prices with reliable support.'
});

// Explicitly use the composables
const productService = useProductService();
const brandService = useBrandService();

// Fetch Best Sellers via SSR-safe useAsyncData from real product API
const { 
  data: bestSellersResponse, 
  status: bestSellersStatus, 
  error: bestSellersError, 
  refresh: refreshBestSellers 
} = await useAsyncData(
  'storefront-best-sellers',
  () => productService.getProductsList({ page_size: 8 }),
  {
    lazy: false
  }
);

const bestSellerProducts = computed<Product[]>(() => bestSellersResponse.value?.results || []);

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

    <!-- Best Sellers -->
    <HomeProductSection
      title="Best Sellers"
      title-highlight="Sellers"
      subtitle="Top performing hardware & enterprise solutions chosen by our clients."
      view-all-route="/products/"
      view-all-text="Explore All Products"
      :products="bestSellerProducts"
      :is-loading="bestSellersStatus === 'pending'"
      :error="bestSellersError"
      :error-message="bestSellersError?.message || 'Unable to retrieve catalog products.'"
      :on-retry="() => refreshBestSellers()"
      @retry="() => refreshBestSellers()"
    />

    <!-- Brand Marquee -->
    <HomeBrandMarquee :brands="brandsList" />

    <!-- TEMPORARILY DISABLED: Enterprise Offer Promo Banner -->
    <!--
    <HomePromoBanner />
    -->
  </div>
</template>

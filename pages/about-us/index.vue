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
    console.error('Failed to load brands for About Us page:', error);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-12 space-y-8">
    <h1 class="text-3xl font-display font-bold">About BCHL (Best Computer Hub Ltd.)</h1>
    
    <section>
      <h2 class="text-2xl font-display font-bold mb-2">Trade License (Best Computer Hub Ltd)</h2>
      <p>Trade License Number: <strong>TRAD/DSCC/034174/2023</strong></p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Our Services</h2>
      <p class="mb-4">Best Computer Hub Ltd is a premier e-commerce retailer providing professional hardware and cutting-edge computing components in Bangladesh. We offer a comprehensive range of products including:</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Desktop PCs</li>
        <li>Laptops</li>
        <li>Gaming PCs</li>
        <li>Mobile Phones</li>
        <li>UPS</li>
        <li>Tablet PCs</li>
        <li>Graphics Tablets</li>
        <li>Monitors</li>
        <li>Office Equipment</li>
        <li>Cameras</li>
        <li>Security Cameras</li>
        <li>Televisions</li>
      </ul>
      <p>We ensure that every product passes through strict quality checks, delivering excellence in product reliability and customer satisfaction.</p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Top-Selling Brands</h2>
      <p class="mb-4">We are proud to partner with leading technology brands globally to bring you the best components and hardware solutions.</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Antec, Asrock, Bitfenix, Cryorig, Deli, EKWB, ESET, Galax, Gamdias, GEIL, Infocus, KWG, Lian Li, MaxGreen, Noctua, Razer, RnM, Team, XFX, Zyxel</li>
      </ul>
      <p>Our commitment to product support, seamless return policies, and outstanding customer service ensures a trusted shopping experience.</p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Corporate Sector Engagement</h2>
      <p class="mb-4">We serve a wide variety of corporate clients, educational institutions, and government organizations with tailored IT solutions.</p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Network-based products</li>
        <li>Servers and routers</li>
        <li>Laptops</li>
        <li>Desktops</li>
        <li>Printers</li>
        <li>Other IT-related hardware accessories</li>
      </ul>
      <p>Our dedicated team provides professional guidance and support to meet the specific requirements of our corporate partners.</p>
    </section>

    <section>
      <h2 class="text-2xl font-display font-bold mb-4">Customer Satisfaction</h2>
      <p class="mb-4">At Best Computer Hub Ltd, customer satisfaction is our top priority. We listen closely to our customers' needs to provide the right products and solutions.</p>
      <p class="mb-4">We believe in building long-term relationships through exceptional after-sales service and support. Our goal is to make every interaction seamless, professional, and reliable.</p>
      <p>Our commitment to our customers extends beyond the initial purchase. We are here to support you at every step, ensuring you receive the best value and support for your technology investment.</p>
    </section>

    <HomeBrandMarquee :brands="brandsList" />
  </div>
</template>

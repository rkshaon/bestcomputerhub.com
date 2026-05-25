<!-- File: /pages/support/shipping.vue -->
<script setup lang="ts">
import { Truck, Globe, Zap, ShieldCheck, Clock } from 'lucide-vue-next';

const shippingMethods = [
  {
    name: 'Global Standard',
    time: '5-10 Business Days',
    price: 'Free over $1,000',
    details: 'Reliable ground and air shipping for standard components across 120 countries.'
  },
  {
    name: 'Enterprise Express',
    time: '2-4 Business Days',
    price: '$45.00 Base',
    details: 'Prioritized handling for mission-critical hardware. Full real-time telemetry tracking included.'
  },
  {
    name: 'Next-Flight Out',
    time: 'Under 24 Hours',
    price: 'Variable (Quote Required)',
    details: 'Emergency courier service for data center outages or urgent prototype development.'
  }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header -->
      <div class="space-y-6 text-center mb-16">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Truck class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight">Shipping & <span class="text-primary italic">Logistics</span></h1>
        <p class="text-lg text-muted-foreground">Premium fulfillment engineered for global enterprise infrastructure.</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        <div v-for="stat in [
          { icon: Globe, val: '120+', label: 'Countries Supported' },
          { icon: Zap, val: '2Hr', label: 'Average Prep Time' },
          { icon: ShieldCheck, val: '100%', label: 'Insured Delivery' },
          { icon: Clock, val: '24/7', label: 'Processing' }
        ]" :key="stat.label" class="p-6 bg-muted/20 rounded-3xl text-center space-y-2 border">
          <component :is="stat.icon" class="w-6 h-6 text-primary mx-auto opacity-50" />
          <p class="text-2xl font-display font-bold">{{ stat.val }}</p>
          <p class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Shipping Methods -->
      <div class="space-y-8 mb-20">
        <h2 class="text-3xl font-display font-bold">Fulfillment <span class="text-primary">Options</span></h2>
        <div class="grid gap-6">
          <div v-for="method in shippingMethods" :key="method.name" class="p-8 bg-card border rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 hover:border-primary/30 transition-all group">
            <div class="space-y-2 flex-grow">
              <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold">{{ method.name }}</h3>
                <span v-if="method.name.includes('Enterprise')" class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Recommended</span>
              </div>
              <p class="text-muted-foreground text-sm max-w-lg">{{ method.details }}</p>
            </div>
            <div class="text-center md:text-right shrink-0 min-w-[150px]">
              <p class="text-lg font-bold text-primary">{{ method.time }}</p>
              <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">{{ method.price }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Specialized Handling -->
      <div class="bg-muted rounded-[3rem] p-12 space-y-8">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-display font-bold mb-4">Precision <span class="text-primary">Handling</span></h2>
          <p class="text-muted-foreground">Every TechCore shipment utilizes ESD-safe packaging and environmental temperature monitoring. For sensitive semiconductor shipments, we provide tamper-evident digital seals.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <h4 class="font-bold border-l-4 border-primary pl-4">Customs & Compliance</h4>
            <p class="text-sm text-muted-foreground leading-relaxed">We handle all TAA, RoHS, and local export documentation automatically. Import duties are calculated at checkout for 95% of regions to ensure DDP (Delivered Duty Paid) service.</p>
          </div>
          <div class="space-y-4">
            <h4 class="font-bold border-l-4 border-primary pl-4">Packaging Science</h4>
            <p class="text-sm text-muted-foreground leading-relaxed">Our proprietary foam-in-place nitrogen suspension packaging eliminates 99.9% of kinetic shock during transit, even for heaviest server chassis.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

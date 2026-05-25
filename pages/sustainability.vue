<!-- File: /pages/sustainability.vue -->
<script setup lang="ts">
import { Leaf, Recycle, Wind, Droplets, Sun, ChevronRight, BarChart3 } from 'lucide-vue-next';

const initiatives = [
  { 
    title: 'Zero-Waste Packaging', 
    desc: 'Our new "Bio-Foam" suspension systems are 100% compostable and eliminate all single-use plastics from our supply chain by 2025.',
    icon: Recycle
  },
  { 
    title: 'Circular Component Era', 
    desc: 'We facilitate end-of-life recycling for enterprise systems, ensuring 99% of rare-earth metals are recovered and reused.',
    icon: Leaf
  },
  { 
    title: 'Carbon-Neutral Logistics', 
    desc: 'Powering our global fulfillment centers with 100% renewable energy and carbon-offsetting every air shipment.',
    icon: Wind
  }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-5xl">
      <!-- Hero -->
      <div class="space-y-6 text-center mb-24">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
          <Leaf class="w-3 h-3" /> Impact Report
        </div>
        <h1 class="text-5xl md:text-7xl font-display font-bold tracking-tight">Sustainable <span class="text-emerald-500 italic">High-Performance</span>.</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">TechCore is redefining the relationship between enterprise computation and environmental stewardship.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div v-for="stat in [
          { icon: Droplets, val: '40%', label: 'Water Usage Reduction' },
          { icon: Sun, val: '100%', label: 'Renewable Energy' },
          { icon: BarChart3, val: '0kg', label: 'Net Carbon Target' }
        ]" :key="stat.label" class="p-8 border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] text-center space-y-4">
          <component :is="stat.icon" class="w-8 h-8 text-emerald-600 mx-auto" />
          <p class="text-4xl font-display font-bold text-emerald-700">{{ stat.val }}</p>
          <p class="text-[10px] uppercase font-bold tracking-widest text-emerald-600">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Initiatives -->
      <div class="space-y-12">
        <h2 class="text-3xl md:text-4xl font-display font-bold text-center">Our Core <span class="text-emerald-500">Commitments</span></h2>
        <div class="grid gap-6">
          <div v-for="item in initiatives" :key="item.title" class="p-10 bg-card border rounded-[3rem] flex flex-col md:flex-row items-center gap-10 hover:border-emerald-500/30 transition-all group">
            <div class="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <component :is="item.icon" class="w-10 h-10 text-emerald-600" />
            </div>
            <div class="space-y-4">
              <h3 class="text-2xl font-bold">{{ item.title }}</h3>
              <p class="text-muted-foreground leading-relaxed">{{ item.desc }}</p>
              <button class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 hover:gap-4 transition-all">
                Download Technical Brief <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Partnership Logo Wall (Mock) -->
      <div class="mt-32 pt-20 border-t">
        <p class="text-center text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground mb-12">Partnering for a Greener Future</p>
        <div class="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
           <span v-for="b in ['Energy Star', 'EPEAT GOLD', 'ISO 14001', 'Green Grid', 'EcoVadis Platinum']" :key="b" class="text-xl font-display font-bold italic">{{ b }}</span>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-32 p-12 bg-emerald-600 text-white rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-2">
           <h3 class="text-2xl font-display font-bold">Request a CSR Audit</h3>
           <p class="opacity-80">Our team can provide detailed carbon-footprint reports for your hardware purchases.</p>
        </div>
        <UiButton variant="outline" class="rounded-full bg-white text-emerald-600 border-none font-bold px-10 h-14 hover:bg-white/90">Contact Impact Team</UiButton>
      </div>
    </div>
  </div>
</template>

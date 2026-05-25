<!-- File: /pages/support/warranty.vue -->
<script setup lang="ts">
import { ShieldCheck, Award, Zap, LifeBuoy, FileText } from 'lucide-vue-next';
import { cn } from '@/utils';

const plans = [
  {
    name: 'TechCore Standard',
    price: 'Included',
    features: ['3 Year Hardware Warranty', 'Business Hour Email Support', 'Standard RMA Processing', 'Self-Service Documentation']
  },
  {
    name: 'Pro Support+',
    price: '$199 /Year',
    features: ['5 Year Hardware Warranty', '24/7 Priority Hotline', 'Advanced Replacement (NBD)', 'Dedicated Account Engineer']
  }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header -->
      <div class="space-y-6 text-center mb-16">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight">System <span class="text-primary italic">Protection</span></h1>
        <p class="text-lg text-muted-foreground">Comprehensive coverage for high-utility enterprise hardware ecosystems.</p>
      </div>

      <!-- Core Promises -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div v-for="promise in [
          { icon: Award, title: 'Certified Quality', desc: 'Every component is tech-verified for performance stability.' },
          { icon: Zap, title: 'Rapid Response', desc: 'RMA validation within 24 business hours guaranteed.' },
          { icon: LifeBuoy, title: 'Global Coverage', desc: 'Protection follows your systems across international borders.' }
        ]" :key="promise.title" class="space-y-4">
          <component :is="promise.icon" class="w-10 h-10 text-primary" />
          <h3 class="font-bold text-xl">{{ promise.title }}</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ promise.desc }}</p>
        </div>
      </div>

      <!-- Warranty Plans -->
      <div class="space-y-8 mb-20">
        <div class="text-center">
          <h2 class="text-3xl font-display font-bold">Comprehensive <span class="text-primary">Coverage Plans</span></h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="plan in plans" :key="plan.name" :class="cn('p-10 rounded-[3rem] border-2 space-y-8 transition-all hover:shadow-2xl', plan.name.includes('Pro') ? 'border-primary bg-primary/5' : 'border-muted')">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">{{ plan.name }}</h3>
              <p class="text-3xl font-display font-bold text-primary">{{ plan.price }}</p>
            </div>
            <ul class="space-y-4">
              <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-3 text-sm font-medium">
                <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <ShieldCheck class="w-3 h-3 text-primary" />
                </div>
                {{ feature }}
              </li>
            </ul>
            <UiButton :variant="plan.name.includes('Pro') ? 'primary' : 'outline'" class="w-full rounded-full font-bold h-12">Learn More</UiButton>
          </div>
        </div>
      </div>

      <!-- Technical Documentation Section -->
      <div class="bg-muted p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-12">
        <div class="w-20 h-20 bg-background rounded-3xl flex items-center justify-center shrink-0">
          <FileText class="w-10 h-10 text-primary" />
        </div>
        <div class="space-y-4">
          <h3 class="text-2xl font-display font-bold">Technical Warranty Policy (PDF)</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">Download the full technical disclosure regarding MTBF (Mean Time Between Failures), thermal throttling protection clauses, and our 100% Zero-Pixel policy for display components.</p>
          <div class="flex flex-wrap gap-4 pt-2">
            <UiButton variant="ghost" class="rounded-full text-xs font-bold gap-2 hover:bg-background tracking-widest uppercase">
              <FileText class="w-4 h-4" /> Download v.2024.1
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

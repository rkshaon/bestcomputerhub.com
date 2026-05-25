<!-- File: /pages/support/returns.vue -->
<script setup lang="ts">
import { RefreshCcw, Package, Clock, ShieldAlert, CheckCircle2 } from 'lucide-vue-next';

const steps = [
  { icon: Package, title: 'Initiate Request', desc: 'Login to your dashboard and navigate to "Fulfillment History" to start an RMA.' },
  { icon: ShieldAlert, title: 'QC Validation', desc: 'Our engineers will review the technical diagnostic logs for compatibility or failure confirmation.' },
  { icon: Clock, title: 'Return Pickup', desc: 'For enterprise accounts, we provide complimentary secure courier pickup globally.' },
  { icon: RefreshCcw, title: 'Rapid Swap', desc: 'Once validated, a replacement unit is dispatched within 24 hours (Advanced Replacement).' }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header -->
      <div class="space-y-6 text-center mb-16">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <RefreshCcw class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight">Returns & <span class="text-primary italic">RMA</span></h1>
        <p class="text-lg text-muted-foreground">Streamlined reverse logistics for mission-critical hardware components.</p>
      </div>

      <!-- Policy Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div class="p-8 bg-card border rounded-[2.5rem] space-y-4">
          <CheckCircle2 class="w-8 h-8 text-primary" />
          <h3 class="text-xl font-bold">30-Day Evaluation</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">Standard components can be returned in original condition within 30 days. We waive restocking fees for all Corporate and Enterprise tier accounts.</p>
        </div>
        <div class="p-8 bg-card border rounded-[2.5rem] space-y-4">
          <CheckCircle2 class="w-8 h-8 text-primary" />
          <h3 class="text-xl font-bold">DOA Protection</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">Units identified as Dead-on-Arrival during initial system integration are eligible for immediate white-glove replacement, bypassing standard RMA queues.</p>
        </div>
      </div>

      <!-- Process Steps -->
      <div class="space-y-12 mb-20 text-center">
        <h2 class="text-3xl font-display font-bold">The <span class="text-primary">RMA Process</span></h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <!-- Hidden connecting line for desktop -->
          <div class="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-muted z-0"></div>
          
          <div v-for="(step, idx) in steps" :key="step.title" class="relative z-10 space-y-4">
            <div class="w-24 h-24 bg-background border-4 border-muted rounded-full flex items-center justify-center mx-auto group hover:border-primary transition-all duration-500">
              <component :is="step.icon" class="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <p class="font-bold text-lg">{{ step.title }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Exclusions -->
      <div class="bg-card border rounded-[2.5rem] p-10 space-y-6">
        <h3 class="text-xl font-bold flex items-center gap-2">
           <ShieldAlert class="w-5 h-5 text-destructive" /> Policy Exceptions
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div v-for="item in [
            'Modified hardware or custom firmware flashes',
            'Damage caused by improper thermal management',
            'Overclocked components beyond factory voltage specs',
            'Items missing original holographic security seals'
          ]" :key="item" class="flex items-center gap-3 text-sm text-muted-foreground py-2 border-b">
            <div class="w-1.5 h-1.5 rounded-full bg-destructive/50"></div>
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Building2, Users2, Cpu, Globe2, Trophy } from 'lucide-vue-next';

const stats = [
  { label: 'Founded', value: '2012' },
  { label: 'Countries', value: '120+' },
  { label: 'Product SKUs', value: '15,000+' },
  { label: 'Enterprise Clients', value: '8,000+' }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20 overflow-hidden">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 mb-20">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest animate-fade-in">
          <Building2 class="w-3 h-3" /> Our Vision
        </div>
        <h1 class="text-5xl md:text-7xl font-display font-bold tracking-tight leading-tight">
          Engineering the <span class="text-primary italic">Foundation</span> of Modern Industry.
        </h1>
        <p class="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          TechCore was founded with a single mission: to provide the world's most reliable and high-performance hardware ecosystem for the architects of tomorrow.
        </p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="container mx-auto px-4 mb-32">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-muted/30 p-10 rounded-[2.5rem] border border-muted text-center space-y-2 hover:bg-muted/50 transition-colors">
          <p class="text-4xl md:text-5xl font-display font-bold tracking-tighter">{{ stat.value }}</p>
          <p class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- The TechCore Story -->
    <div class="bg-black text-white py-32 mb-32">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div class="space-y-8">
            <h2 class="text-4xl md:text-5xl font-display font-bold leading-tight">A Decade of <span class="text-primary italic">Hardware Excellence</span></h2>
            <div class="space-y-6 text-lg text-gray-400">
              <p>In 2012, a group of system architects realized that the enterprise hardware market was fragmented and slow. They envisioned a unified portal where performance was the only metric that mattered.</p>
              <p>Today, TechCore serves as the backbone for top-tier data centers, specialized engineering firms, and high-frequency trading floors globally. We don't just sell components; we provide the tools for breakthrough performance.</p>
            </div>
            <div class="flex flex-wrap gap-4">
               <div v-for="item in ['ISO 9001 Certified', 'TAA Compliant', 'Global Support 24/7']" :key="item" class="px-4 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest text-white/60">
                 {{ item }}
               </div>
            </div>
          </div>
          <div class="relative">
            <div class="aspect-square bg-gradient-to-br from-primary/20 to-white/5 rounded-[4rem] border border-white/10 flex items-center justify-center p-12">
               <Cpu class="w-full h-full text-primary opacity-20" />
               <div class="absolute inset-0 flex items-center justify-center">
                 <div class="w-64 h-64 bg-primary rounded-full blur-[120px] opacity-20"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Core Values -->
    <div class="container mx-auto px-4 mb-32">
       <div class="text-center mb-16 space-y-4">
          <h2 class="text-4xl font-display font-bold">Built on <span class="text-primary italic">Integrity</span></h2>
          <p class="text-muted-foreground max-w-xl mx-auto">Our values are etched into every motherboard and every shipping crate we send out.</p>
       </div>
       <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="value in [
            { icon: Users2, title: 'Human Centric', desc: 'Behind every machine is a human being pushing the limits of what is possible.' },
            { icon: Globe2, title: 'Global Impact', desc: 'We operate locally in 120 countries to ensure zero-latency fulfillment and support.' },
            { icon: Trophy, title: 'Unrivaled Performance', desc: 'If it does not meet the benchmark, it does not leave our warehouse.' }
          ]" :key="value.title" class="p-12 bg-card border rounded-[3rem] space-y-6 hover:shadow-2xl transition-all duration-500">
             <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <component :is="value.icon" class="w-8 h-8 text-primary" />
             </div>
             <h3 class="text-2xl font-display font-bold">{{ value.title }}</h3>
             <p class="text-muted-foreground leading-relaxed">{{ value.desc }}</p>
          </div>
       </div>
    </div>
  </div>
</template>

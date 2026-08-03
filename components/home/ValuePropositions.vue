<!-- File: /components/home/ValuePropositions.vue -->
<script setup lang="ts">
import { Truck, ShieldCheck, RefreshCw, Trophy } from 'lucide-vue-next';

interface ValueProp {
  icon: typeof Truck;
  title: string;
  desc: string;
  url: string;
}

const valueProps: ValueProp[] = [
  { icon: Truck, title: 'Global Delivery', desc: 'Secure shipping to 120+ countries', url: '/support/shipping' },
  { icon: ShieldCheck, title: 'Safe Payments', desc: 'Enterprise-grade encryption', url: '/support/payments' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free policy', url: '/support/returns' },
  { icon: Trophy, title: 'Quality Guard', desc: '2-year minimum warranty', url: '/support/warranty' }
];
</script>

<template>
  <section class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <NuxtLink 
        v-for="(item, idx) in valueProps" 
        :key="idx" 
        :to="item.url" 
        class="flex gap-4 p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group cursor-pointer"
      >
        <div class="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
          <component :is="item.icon" class="w-6 h-6 text-primary" />
        </div>
        <div class="space-y-1">
          <h4 class="font-bold text-base group-hover:text-primary transition-colors text-foreground">{{ item.title }}</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ item.desc }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

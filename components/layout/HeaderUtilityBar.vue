<!-- File: /components/layout/HeaderUtilityBar.vue -->
<script setup lang="ts">
import { Phone, Mail, Headphones, Tag, Sparkles, Store, BookOpen } from 'lucide-vue-next';
import { STORE_CONTACT } from '@/constants/contact';

const contactInfo = {
  email: STORE_CONTACT.email,
  phone: STORE_CONTACT.displayPhone
};
</script>

<template>
  <div 
    class="w-full border-b border-border/40 bg-muted/30 text-muted-foreground text-[11px] font-medium hidden sm:block py-1.5"
  >
    <div class="container mx-auto px-4 flex items-center justify-between gap-4">
      <!-- Left side: Contact & Support info -->
      <div class="flex items-center gap-4 md:gap-6 shrink-0">
        <a 
          :href="`tel:${contactInfo.phone.replace(/[^+0-9]/g, '')}`" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
          aria-label="Call Customer Support"
        >
          <Phone class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>{{ contactInfo.phone }}</span>
        </a>

        <a 
          :href="`mailto:${contactInfo.email}`" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm hidden lg:inline-flex"
          aria-label="Email Customer Support"
        >
          <Mail class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>{{ contactInfo.email }}</span>
        </a>

        <NuxtLink 
          to="/support/help-center" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <Headphones class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Customer Service</span>
        </NuxtLink>
      </div>

      <!-- Right side: Quick Shortcuts -->
      <div class="flex items-center gap-4 md:gap-6 shrink-0">
        <NuxtLink 
          to="/offers" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm group"
        >
          <Tag class="w-3 h-3 text-destructive shrink-0 transition-transform group-hover:rotate-12" aria-hidden="true" />
          <span>Offers</span>
          <span class="bg-destructive/10 text-destructive text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Hot</span>
        </NuxtLink>

        <NuxtLink 
          to="/blog" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <BookOpen class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Insights</span>
        </NuxtLink>

        <NuxtLink 
          to="/new-arrivals" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <Sparkles class="w-3 h-3 text-amber-500 shrink-0" aria-hidden="true" />
          <span>New Arrivals</span>
        </NuxtLink>

        <NuxtLink 
          to="/products" 
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          <Store class="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span>Store</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

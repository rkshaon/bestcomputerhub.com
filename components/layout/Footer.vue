<!-- File: /components/layout/Footer.vue -->
<script setup lang="ts">
import { Facebook, Twitter, Instagram, Youtube, Mail, PackageSearch, ArrowRight } from 'lucide-vue-next';

const currentYear = new Date().getFullYear();

const socialLinks = [
  { 
    label: 'Facebook', 
    icon: Facebook, 
    href: '#',
    brandBg: 'bg-[#1877F2]',
    brandBorder: 'border-[#1877F2]'
  },
  { 
    label: 'Twitter', 
    icon: Twitter, 
    href: '#',
    brandBg: 'bg-[#1DA1F2]',
    brandBorder: 'border-[#1DA1F2]'
  },
  { 
    label: 'Instagram', 
    icon: Instagram, 
    href: '#',
    brandBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    brandBorder: 'border-transparent'
  },
  { 
    label: 'Youtube', 
    icon: Youtube, 
    href: '#',
    brandBg: 'bg-[#FF0000]',
    brandBorder: 'border-[#FF0000]'
  }
];
</script>

<template>
  <footer class="bg-card pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-10 border-t">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-10 sm:mb-20">
        <!-- Brand -->
        <div class="sm:col-span-2 space-y-6">
          <NuxtLink to="/" class="flex items-center">
            <UiBrandLogo size="lg" />
          </NuxtLink>
          <p class="text-muted-foreground text-xs sm:text-sm max-w-sm leading-relaxed">
            Premier e-commerce platform dedicated to professional hardware and cutting-edge computing components. Trusted by thousands of tech enthusiasts and engineers.
          </p>
          <div class="flex items-center gap-3.5">
            <a 
              v-for="social in socialLinks" 
              :key="social.label" 
              :href="social.href" 
              :aria-label="social.label"
              :class="[
                'relative overflow-hidden w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary group shadow-xs hover:shadow-md',
                social.brandBorder
              ]"
            >
              <!-- Official Brand Background (fades smoothly on hover) -->
              <span 
                class="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 rounded-full"
                :class="social.brandBg"
              />
              
              <!-- Icon -->
              <component 
                :is="social.icon" 
                class="relative z-10 w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-primary-foreground transition-colors duration-300" 
              />
            </a>
          </div>
        </div>

        <!-- Links Grid -->
        <div v-for="section in [
          { title: 'Categories', links: [
            { name: 'Graphics Cards', url: '/product-category/gpus/' },
            { name: 'New Arrivals', url: '/new-arrivals' },
            { name: 'Special Offers', url: '/offers' },
            { name: 'Processors', url: '/product-category/processors/' }
          ] },
          { title: 'Support', links: [
            { name: 'Help Center', url: '/support/help-center' },
            { name: 'Shipping Info', url: '/support/shipping' },
            { name: 'Returns', url: '/support/returns' },
            { name: 'Warranty', url: '/support/warranty' },
            { name: 'Payments & Billing', url: '/support/payments' }
          ] },
          { title: 'Company', links: [
            { name: 'About Us', url: '/about' },
            { name: 'Tech Blog', url: '/blog' },
            { name: 'Careers', url: '/careers' },
            { name: 'Sustainability', url: '/sustainability' }
          ] }
        ]" :key="section.title" class="space-y-4 sm:space-y-6">
          <h4 class="font-bold text-xs sm:text-sm uppercase tracking-widest text-foreground">{{ section.title }}</h4>
          <ul class="space-y-2.5 sm:space-y-4">
            <li v-for="link in section.links" :key="link.name">
              <NuxtLink :to="link.url" class="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">{{ link.name }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter -->
      <div class="p-6 sm:p-8 md:p-12 bg-muted rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 mb-12 sm:mb-20">
        <div class="space-y-2 text-center md:text-left">
          <h3 class="text-xl sm:text-2xl font-display font-bold">Join Best Computer Hub Insider</h3>
          <p class="text-muted-foreground text-xs sm:text-sm">Expert reviews, early access to hardware drops, and weekly deep dives.</p>
        </div>
        <div class="flex flex-col sm:flex-row w-full md:w-auto max-w-md gap-2.5">
          <div class="relative flex-grow">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input type="email" placeholder="Your work email" class="w-full h-11 sm:h-12 bg-background border rounded-full px-11 sm:px-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-xs sm:text-sm" />
          </div>
          <UiButton class="rounded-full gap-2 px-6 h-11 sm:h-12 font-bold shrink-0">
            Join <ArrowRight class="w-4 h-4" />
          </UiButton>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex flex-wrap justify-center gap-6 text-xs font-medium text-muted-foreground">
          <span>&copy; {{ currentYear }} Best Computer Hub Ltd.</span>
          <NuxtLink to="/privacy" class="hover:text-primary transition-colors">Privacy Policy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-primary transition-colors">Terms of Service</NuxtLink>
          <NuxtLink to="/cookies" class="hover:text-primary transition-colors">Cookie Settings</NuxtLink>
        </div>
        <div class="flex items-center gap-6 opacity-30 grayscale saturate-0">
          <img v-for="i in 5" :key="i" :src="`https://placehold.co/40x24/png?text=Card${i}`" class="h-6" />
        </div>
      </div>
    </div>
  </footer>
</template>

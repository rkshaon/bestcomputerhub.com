<!-- File: /components/layout/Footer.vue -->
<script setup lang="ts">
import { Facebook, Twitter, Instagram, Youtube, Mail, PackageSearch, ArrowRight } from 'lucide-vue-next';

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-card pt-20 pb-10 border-t">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
        <!-- Brand -->
        <div class="lg:col-span-2 space-y-6">
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <PackageSearch class="text-primary-foreground w-6 h-6" />
            </div>
            <span class="font-display font-bold text-2xl tracking-tight">TechCore</span>
          </NuxtLink>
          <p class="text-muted-foreground text-sm max-w-sm leading-relaxed">
            Enterprise e-commerce platform dedicated to professional hardware and cutting-edge digital accessories. Trusted by 250,000+ engineers worldwide.
          </p>
          <div class="flex items-center gap-4">
            <a v-for="social in [
              { icon: Facebook, label: 'Facebook' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Instagram, label: 'Instagram' },
              { icon: Youtube, label: 'Youtube' }
            ]" :key="social.label" href="#" class="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
              <component :is="social.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Links Grid -->
        <div v-for="section in [
          { title: 'Categories', links: [
            { name: 'Laptops', url: '/category/laptops' },
            { name: 'New Arrivals', url: '/new-arrivals' },
            { name: 'Special Offers', url: '/offers' },
            { name: 'Components', url: '/category/components' }
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
        ]" :key="section.title" class="space-y-6">
          <h4 class="font-bold text-sm uppercase tracking-widest">{{ section.title }}</h4>
          <ul class="space-y-4">
            <li v-for="link in section.links" :key="link.name">
              <NuxtLink :to="link.url" class="text-sm text-muted-foreground hover:text-primary transition-colors">{{ link.name }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter -->
      <div class="p-8 md:p-12 bg-muted rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 mb-20">
        <div class="space-y-2">
          <h3 class="text-2xl font-display font-bold">Join the TechCore Insider</h3>
          <p class="text-muted-foreground text-sm">Expert reviews, early access to hardware drops, and weekly deep dives.</p>
        </div>
        <div class="flex w-full md:w-auto max-w-md gap-2">
          <div class="relative flex-grow">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="email" placeholder="Your work email" class="w-full h-12 bg-background border rounded-full px-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
          </div>
          <UiButton class="rounded-full gap-2 px-6">
            Join <ArrowRight class="w-4 h-4" />
          </UiButton>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex flex-wrap justify-center gap-6 text-xs font-medium text-muted-foreground">
          <span>&copy; {{ currentYear }} TechCore Global Ltd.</span>
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

<!-- File: /components/layout/Footer.vue -->
<script setup lang="ts">
// TEMPORARILY DISABLED: Newsletter Icons (Mail, ArrowRight)
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail, MapPin } from 'lucide-vue-next';

const currentYear = new Date().getFullYear();
const route = useRoute();
const isAuthRoute = computed(() => {
  const p = route.path;
  return p === '/login' || p === '/login/' || p === '/signup' || p === '/signup/';
});


const socialLinks = [
  { 
    label: 'Facebook', 
    icon: Facebook, 
    href: 'https://www.facebook.com/bestcomputerhubltd',
    brandBg: 'bg-[#1877F2]',
    brandBorder: 'border-[#1877F2]'
  },
  { 
    label: 'X / Twitter', 
    icon: Twitter, 
    href: 'https://x.com/bestcomhubltd',
    brandBg: 'bg-[#000000]',
    brandBorder: 'border-[#000000]'
  },
  { 
    label: 'LinkedIn', 
    icon: Linkedin, 
    href: 'https://www.linkedin.com/company/best-computer-hub-ltd/home/',
    brandBg: 'bg-[#0A66C2]',
    brandBorder: 'border-[#0A66C2]'
  },
  { 
    label: 'Instagram', 
    icon: Instagram, 
    href: 'https://www.instagram.com/bestcomputerhubltd',
    brandBg: 'bg-[#E4405F]',
    brandBorder: 'border-[#E4405F]'
  },
  { 
    label: 'YouTube', 
    icon: Youtube, 
    href: 'https://www.youtube.com/@bestcomputerhubltd',
    brandBg: 'bg-[#FF0000]',
    brandBorder: 'border-[#FF0000]'
  }
];
</script>

<template>
  <footer v-if="!isAuthRoute" class="bg-card pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-10 border-t">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-10 sm:mb-20">
        <!-- Brand -->
        <div class="sm:col-span-2 space-y-8">
          <div class="space-y-4">
            <h4 class="font-bold text-sm uppercase tracking-widest text-foreground">We're Here to Help</h4>
            <div class="space-y-2.5 text-muted-foreground text-sm">
              <div class="flex items-center gap-2.5 py-0.5">
                <Phone class="w-4 h-4 text-primary" />
                <a href="tel:+8801794062601" class="hover:text-primary transition-colors">(+880) 1794062601</a>
              </div>
              <div class="flex items-center gap-2.5 py-0.5">
                <Phone class="w-4 h-4 text-primary" />
                <a href="tel:+8801783553844" class="hover:text-primary transition-colors">(+880) 1783553844</a>
              </div>
              <div class="flex items-center gap-2.5 py-0.5">
                <Phone class="w-4 h-4 text-primary" />
                <a href="tel:+8801714111479" class="hover:text-primary transition-colors">(+880) 1714111479</a>
              </div>
              <div class="flex items-center gap-2.5 py-0.5">
                <Mail class="w-4 h-4 text-primary" />
                <a href="mailto:support@bestcomputerhub.com" class="hover:text-primary transition-colors">support@bestcomputerhub.com</a>
              </div>
              <div class="flex items-start gap-2.5 py-0.5">
                <MapPin class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>74/1 (1st Floor), Rajonigondha Bhaban, Science Laboratory Road, Dhanmondi, Dhaka 1205, Bangladesh</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <a 
              v-for="social in socialLinks" 
              :key="social.label" 
              :href="social.href" 
              :aria-label="social.label"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 border border-border hover:border-primary rounded-full flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-white group shadow-sm"
            >
              <component 
                :is="social.icon" 
                class="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors duration-300" 
              />
            </a>
          </div>
        </div>

        <!-- Links Grid -->
        <div v-for="section in [
          { title: 'Information', links: [
            { name: 'About Us', url: '/about-us/' },
            { name: 'Contact Us', url: null },
            { name: 'Affiliation', url: null },
            { name: 'EMI Information', url: '/emi-information/' },
            { name: 'Shop Now', url: '/shop-now/' },
            { name: 'Blog', url: '/blog/' },
            { name: 'Repair Hub', url: null }
          ] },
          { title: 'Policy', links: [
            { name: 'Disclaimer', url: '/disclaimer/' },
            { name: 'Privacy Policy', url: '/privacy-policy/' },
            { name: 'Warranty Policy', url: '/warranty-policy/' },
            { name: 'Return, Refund & After-Sales Policy', url: '/return-refund-after-sales-policy/' },
            { name: 'Delivery Policy', url: '/delivery-policy/' },
            { name: 'Terms & Conditions', url: null },
            { name: 'ডিজিটাল কমার্স নির্দেশিকা ২০২১', url: '/digital-commerce-guidelines/' }
          ] },
          { title: 'Support Hub', links: [
            { name: 'My account', url: '/my-account/' },
            { name: 'Cart', url: null },
            { name: 'Compare', url: null },
            { name: 'Wishlist', url: null },
            { name: 'Checkout', url: null },
            { name: 'Track Your Order', url: null }
          ] }
        ]" :key="section.title" class="space-y-4 sm:space-y-6">
          <h4 class="font-bold text-xs sm:text-sm uppercase tracking-widest text-foreground">{{ section.title }}</h4>
          <ul class="space-y-2.5 sm:space-y-4">
            <li v-for="link in section.links" :key="link.name">
              <NuxtLink v-if="link.url" :to="link.url" class="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">{{ link.name }}</NuxtLink>
              <span v-else class="text-xs sm:text-sm text-muted-foreground">{{ link.name }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- TEMPORARILY DISABLED: Footer Newsletter Subscription -->
      <!-- Restore when the newsletter feature is required again. -->
      <!--
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
      -->

      <!-- Bottom Bar -->
      <div class="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex flex-wrap justify-center gap-6 text-xs font-medium text-muted-foreground">
          <span>&copy; {{ currentYear }} Best Computer Hub Ltd.</span>
          <NuxtLink to="/privacy/" class="hover:text-primary transition-colors">Privacy Policy</NuxtLink>
          <NuxtLink to="/terms/" class="hover:text-primary transition-colors">Terms of Service</NuxtLink>
          <NuxtLink to="/cookies/" class="hover:text-primary transition-colors">Cookie Settings</NuxtLink>
        </div>
        <div class="flex items-center gap-6 opacity-30 grayscale saturate-0">
          <img v-for="i in 5" :key="i" :src="`https://placehold.co/40x24/png?text=Card${i}`" class="h-6" alt="" />
        </div>
      </div>
    </div>
  </footer>
</template>

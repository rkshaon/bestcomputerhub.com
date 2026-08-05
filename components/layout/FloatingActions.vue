<!-- File: /components/layout/FloatingActions.vue -->
<script setup lang="ts">
import { Phone } from 'lucide-vue-next';
import { STORE_CONTACT } from '@/constants/contact';
</script>

<template>
  <div 
    class="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 flex flex-col gap-3 items-end"
    aria-label="Quick contact and utility actions"
  >
    <!-- 1. Call Button -->
    <div class="group relative flex items-center">
      <span 
        class="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-popover/95 backdrop-blur-md border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 hidden sm:block"
      >
        Call {{ STORE_CONTACT.displayPhone }}
      </span>
      <a 
        :href="`tel:${STORE_CONTACT.telPhone}`"
        class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="`Call ${STORE_CONTACT.displayPhone}`"
      >
        <Phone class="w-5 h-5" />
      </a>
    </div>

    <!-- 2. WhatsApp Button -->
    <div class="group relative flex items-center">
      <span 
        class="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-popover/95 backdrop-blur-md border border-border text-popover-foreground text-xs font-semibold whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 hidden sm:block"
      >
        Chat on WhatsApp
      </span>
      <a 
        :href="STORE_CONTACT.whatsappLink"
        target="_blank"
        rel="noopener noreferrer"
        class="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/25 hover:bg-[#20ba5a] transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
        aria-label="Chat on WhatsApp"
      >
        <!-- WhatsApp Icon SVG -->
        <svg 
          class="w-6 h-6 fill-current" 
          viewBox="0 0 24 24" 
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  </div>
</template>

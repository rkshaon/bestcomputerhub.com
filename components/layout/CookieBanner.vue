<!-- File: /components/layout/CookieBanner.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Cookie, X, ChevronRight } from 'lucide-vue-next';
import { useCookieStore } from '@/stores/cookies';

const cookieStore = useCookieStore();
const route = useRoute();

const showBanner = computed(() => {
  return !route.path.startsWith('/admin') && cookieStore.isBannerVisible;
});
</script>

<template>
  <transition
    enter-active-class="transform transition ease-out duration-500"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transform transition ease-in duration-300"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div v-if="showBanner" class="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-[100] md:left-auto md:max-w-md">
      <div class="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white space-y-4 sm:space-y-6">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Cookie class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-display font-bold">Cookie Policy</h3>
          </div>
          <button @click="cookieStore.isBannerVisible = false" class="p-1.5 hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
          We use enterprise-grade cookies to enhance your navigation, analyze site usage, and assist in our marketing efforts.
        </p>

        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-3">
            <UiButton 
              size="sm" 
              variant="outline" 
              class="rounded-full font-bold border-white/20 text-white hover:bg-white/10"
              @click="cookieStore.acceptEssential()"
            >
              Essential Only
            </UiButton>
            <UiButton 
              size="sm" 
              class="rounded-full font-bold shadow-lg shadow-primary/20"
              @click="cookieStore.acceptAll()"
            >
              Accept All
            </UiButton>
          </div>
          
          <NuxtLink 
            to="/cookies" 
            class="text-[10px] uppercase font-bold tracking-widest text-center text-white/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5 group"
            @click="cookieStore.isBannerVisible = false"
          >
            Customize Preferences <ChevronRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next';
import { cn } from '@/utils';

const isVisible = ref(false);

const checkScroll = () => {
  isVisible.value = window.scrollY > 400;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', checkScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll);
});
</script>

<template>
  <transition
    enter-active-class="transform transition ease-out duration-500"
    enter-from-class="translate-x-full opacity-0 scale-90"
    enter-to-class="translate-x-0 opacity-100 scale-100"
    leave-active-class="transform transition ease-in duration-300"
    leave-from-class="translate-x-0 opacity-100 scale-100"
    leave-to-class="translate-x-full opacity-0 scale-90"
  >
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 text-white px-5 py-3 rounded-full shadow-2xl hover:bg-primary transition-all duration-500 hover:scale-105 active:scale-95"
      aria-label="Back to Top"
    >
      <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
        <ArrowUp class="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-500" />
      </div>
      <span class="font-bold text-[10px] uppercase tracking-[0.2em] pr-2">Return to Top</span>
    </button>
  </transition>
</template>

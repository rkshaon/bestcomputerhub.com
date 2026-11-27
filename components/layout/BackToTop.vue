<!-- File: /components/layout/BackToTop.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from '#app';
import { ArrowUp } from 'lucide-vue-next';

const route = useRoute();
const isScrolled = ref(false);

const isVisible = computed(() => {
  if (route.path.startsWith('/admin')) {
    return false;
  }
  return isScrolled.value;
});

const checkScroll = () => {
  const threshold = window.innerWidth < 768 ? 200 : 400;
  isScrolled.value = window.scrollY > threshold;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', checkScroll);
  window.addEventListener('resize', checkScroll);
  checkScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll);
  window.removeEventListener('resize', checkScroll);
});
</script>

<template>
  <transition
    enter-active-class="transform transition ease-out duration-500"
    enter-from-class="translate-y-4 opacity-0 scale-90"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transform transition ease-in duration-300"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-4 opacity-0 scale-90"
  >
    <button
      v-if="isVisible"
      type="button"
      @click="scrollToTop"
      class="pointer-events-auto md:fixed md:bottom-6 md:right-6 md:z-40 group flex items-center justify-center w-12 h-12 md:w-auto md:h-auto md:gap-3 bg-card/95 backdrop-blur-xl border border-border/80 text-card-foreground p-0 md:px-5 md:py-3 rounded-full shadow-xl hover:bg-primary hover:text-primary-foreground hover:border-primary active:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Back to Top"
    >
      <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors shrink-0">
        <ArrowUp class="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-300" />
      </div>
      <span class="hidden md:inline font-bold text-[10px] uppercase tracking-[0.2em] pr-2">Return to Top</span>
    </button>
  </transition>
</template>

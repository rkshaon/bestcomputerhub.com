<!-- File: /components/home/HeroSection.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next';
import { useIntervalFn, useSwipe, usePreferredReducedMotion } from '@vueuse/core';
import { HERO_SLIDES } from '@/data/heroSlides';
import type { HeroSlideData } from '@/types/hero';
import HeroSlide from './HeroSlide.vue';
import { cn } from '@/utils';

const slides = HERO_SLIDES;
const currentIndex = ref(0);
const direction = ref<'next' | 'prev'>('next');
const isPaused = ref(false);
const sliderRef = ref<HTMLElement | null>(null);

const prefersReducedMotion = usePreferredReducedMotion();

const currentSlide = computed<HeroSlideData>(() => slides[currentIndex.value] ?? slides[0]!);

// Navigation methods
const nextSlide = () => {
  direction.value = 'next';
  currentIndex.value = (currentIndex.value + 1) % slides.length;
};

const prevSlide = () => {
  direction.value = 'prev';
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length;
};

const goToSlide = (index: number) => {
  if (index === currentIndex.value) return;
  direction.value = index > currentIndex.value ? 'next' : 'prev';
  currentIndex.value = index;
};

// Autoplay interval (6 seconds)
const { pause: stopAutoplay, resume: startAutoplay } = useIntervalFn(() => {
  if (!isPaused.value && prefersReducedMotion.value !== 'reduce') {
    nextSlide();
  }
}, 6000);

// Mouse hover pause handlers
const handleMouseEnter = () => {
  isPaused.value = true;
};

const handleMouseLeave = () => {
  isPaused.value = false;
};

// Touch / Swipe support
const { isSwiping, direction: swipeDirection } = useSwipe(sliderRef, {
  onSwipeEnd() {
    if (swipeDirection.value === 'left') {
      nextSlide();
    } else if (swipeDirection.value === 'right') {
      prevSlide();
    }
  }
});

// Keyboard navigation when focused
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') {
    prevSlide();
  } else if (event.key === 'ArrowRight') {
    nextSlide();
  }
};
</script>

<template>
  <section 
    class="container mx-auto px-4 pt-2"
    role="region"
    aria-roledescription="carousel"
    aria-label="Promotional Hero Slider"
    aria-live="polite"
  >
    <div 
      ref="sliderRef"
      class="relative group/slider rounded-3xl"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focusin="handleMouseEnter"
      @focusout="handleMouseLeave"
      @keydown="handleKeyDown"
      tabindex="0"
    >
      <!-- Slide Container with fixed height matching slide compositions -->
      <div class="relative overflow-hidden rounded-3xl min-h-[540px]">
        <Transition :name="prefersReducedMotion === 'reduce' ? 'fade' : `slide-${direction}`">
          <HeroSlide 
            :key="currentSlide.id"
            :slide="currentSlide"
            :is-first-slide="currentIndex === 0"
          />
        </Transition>
      </div>

      <!-- Navigation Arrows (Subtle overlay controls) -->
      <button 
        @click="prevSlide" 
        class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/60 dark:bg-black/50 hover:bg-background/90 dark:hover:bg-black/80 backdrop-blur-md text-foreground border border-border/50 flex items-center justify-center transition-all duration-200 shadow-md opacity-80 group-hover/slider:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Previous slide"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>

      <button 
        @click="nextSlide" 
        class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/60 dark:bg-black/50 hover:bg-background/90 dark:hover:bg-black/80 backdrop-blur-md text-foreground border border-border/50 flex items-center justify-center transition-all duration-200 shadow-md opacity-80 group-hover/slider:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Next slide"
      >
        <ChevronRight class="w-5 h-5" />
      </button>

      <!-- Bottom Controls: Indicators + Pause Status -->
      <div class="absolute bottom-4 left-6 md:left-12 z-20 flex items-center gap-3">
        <!-- Slide Indicators -->
        <div class="flex items-center gap-2 bg-black/40 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
          <button 
            v-for="(slide, index) in slides" 
            :key="slide.id" 
            @click="goToSlide(index)" 
            :class="cn(
              'h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              currentIndex === index 
                ? 'w-7 bg-primary shadow-sm' 
                : 'w-2 bg-white/40 hover:bg-white/70'
            )" 
            :aria-label="`Go to slide ${index + 1}: ${slide.primary.titlePrefix}${slide.primary.titleHighlight}`"
            :aria-current="currentIndex === index ? 'true' : undefined" 
          />
        </div>

        <!-- Pause Indicator badge (subtle feedback when hovering) -->
        <span 
          v-if="isPaused" 
          class="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 animate-fade-in"
        >
          <Pause class="w-3 h-3 text-primary" />
          <span>Paused</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Slide animations */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.slide-next-enter-from {
  transform: translateX(100%);
  opacity: 0.8;
}

.slide-next-leave-to {
  transform: translateX(-100%);
  opacity: 0.8;
}

.slide-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0.8;
}

.slide-prev-leave-to {
  transform: translateX(100%);
  opacity: 0.8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

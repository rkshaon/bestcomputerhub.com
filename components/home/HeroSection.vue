<!-- File: /components/home/HeroSection.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight, Pause, ArrowUpRight } from 'lucide-vue-next';
import { useIntervalFn, useSwipe, usePreferredReducedMotion } from '@vueuse/core';
import { useBannerService } from '@/composables/useBannerService';
import type { BannerStorefront } from '@/types';
import { cn } from '@/utils';

interface HomepageBannersState {
  heroBanners: BannerStorefront[];
  rightTopBanners: BannerStorefront[];
  rightBottomBanners: BannerStorefront[];
}

const bannerService = useBannerService();

// Fetch homepage available banners with SSR support to avoid duplicate hydration requests
const { data: bannerData, status, error } = await useAsyncData<HomepageBannersState>(
  'storefront-homepage-banners',
  async () => {
    try {
      // 1. Resolve placements dynamically via Placement API
      const placementsRes = await bannerService.getPlacementsList({ page_size: 100 });
      const placements = placementsRes.results || [];

      const heroPlacement = placements.find(p => p.code === 'homepage_hero');
      const rightTopPlacement = placements.find(p => p.code === 'homepage_right_top');
      const rightBottomPlacement = placements.find(p => p.code === 'homepage_right_bottom');

      // 2. Fetch available active banners for each placement zone
      const [heroBanners, rightTopBanners, rightBottomBanners] = await Promise.all([
        heroPlacement
          ? bannerService.getAvailableBanners({ placement: heroPlacement.id }).catch(() => [])
          : bannerService.getAvailableBanners({ placement_code: 'homepage_hero' }).catch(() => []),
        rightTopPlacement
          ? bannerService.getAvailableBanners({ placement: rightTopPlacement.id }).catch(() => [])
          : bannerService.getAvailableBanners({ placement_code: 'homepage_right_top' }).catch(() => []),
        rightBottomPlacement
          ? bannerService.getAvailableBanners({ placement: rightBottomPlacement.id }).catch(() => [])
          : bannerService.getAvailableBanners({ placement_code: 'homepage_right_bottom' }).catch(() => [])
      ]);

      return {
        heroBanners: heroBanners || [],
        rightTopBanners: rightTopBanners || [],
        rightBottomBanners: rightBottomBanners || []
      };
    } catch (err) {
      console.error('Storefront Banner Protocol Exception: Failed to load homepage banners.', err);
      return {
        heroBanners: [],
        rightTopBanners: [],
        rightBottomBanners: []
      };
    }
  },
  {
    lazy: false,
    default: () => ({
      heroBanners: [],
      rightTopBanners: [],
      rightBottomBanners: []
    })
  }
);

// Banners collections
const heroBanners = computed<BannerStorefront[]>(() => bannerData.value?.heroBanners || []);
const rightTopBanners = computed<BannerStorefront[]>(() => bannerData.value?.rightTopBanners || []);
const rightBottomBanners = computed<BannerStorefront[]>(() => bannerData.value?.rightBottomBanners || []);

const hasHeroBanners = computed(() => heroBanners.value.length > 0);
const hasRightTopBanners = computed(() => rightTopBanners.value.length > 0);
const hasRightBottomBanners = computed(() => rightBottomBanners.value.length > 0);
const hasRightBanners = computed(() => hasRightTopBanners.value || hasRightBottomBanners.value);
const hasAnyBanners = computed(() => hasHeroBanners.value || hasRightBanners.value);

// Active Index and Slider State
const heroCurrentIndex = ref(0);
const rightTopCurrentIndex = ref(0);
const rightBottomCurrentIndex = ref(0);
const direction = ref<'next' | 'prev'>('next');
const isPaused = ref(false);
const sliderRef = ref<HTMLElement | null>(null);

const prefersReducedMotion = usePreferredReducedMotion();

const currentHeroBanner = computed<BannerStorefront | null>(() => {
  if (heroBanners.value.length === 0) return null;
  return heroBanners.value[heroCurrentIndex.value] || heroBanners.value[0] || null;
});

const currentRightTopBanner = computed<BannerStorefront | null>(() => {
  if (rightTopBanners.value.length === 0) return null;
  return rightTopBanners.value[rightTopCurrentIndex.value] || rightTopBanners.value[0] || null;
});

const currentRightBottomBanner = computed<BannerStorefront | null>(() => {
  if (rightBottomBanners.value.length === 0) return null;
  return rightBottomBanners.value[rightBottomCurrentIndex.value] || rightBottomBanners.value[0] || null;
});

// Navigation methods
const nextSlide = () => {
  direction.value = 'next';
  if (heroBanners.value.length > 1) {
    heroCurrentIndex.value = (heroCurrentIndex.value + 1) % heroBanners.value.length;
  }
  if (rightTopBanners.value.length > 1) {
    rightTopCurrentIndex.value = (rightTopCurrentIndex.value + 1) % rightTopBanners.value.length;
  }
  if (rightBottomBanners.value.length > 1) {
    rightBottomCurrentIndex.value = (rightBottomCurrentIndex.value + 1) % rightBottomBanners.value.length;
  }
};

const prevSlide = () => {
  direction.value = 'prev';
  if (heroBanners.value.length > 1) {
    heroCurrentIndex.value = (heroCurrentIndex.value - 1 + heroBanners.value.length) % heroBanners.value.length;
  }
  if (rightTopBanners.value.length > 1) {
    rightTopCurrentIndex.value = (rightTopCurrentIndex.value - 1 + rightTopBanners.value.length) % rightTopBanners.value.length;
  }
  if (rightBottomBanners.value.length > 1) {
    rightBottomCurrentIndex.value = (rightBottomCurrentIndex.value - 1 + rightBottomBanners.value.length) % rightBottomBanners.value.length;
  }
};

const goToHeroSlide = (index: number) => {
  if (index === heroCurrentIndex.value || index < 0 || index >= heroBanners.value.length) return;
  direction.value = index > heroCurrentIndex.value ? 'next' : 'prev';
  heroCurrentIndex.value = index;
};

// Autoplay interval (6 seconds) for zones with multiple banners
useIntervalFn(() => {
  if (
    !isPaused.value &&
    prefersReducedMotion.value !== 'reduce' &&
    (heroBanners.value.length > 1 || rightTopBanners.value.length > 1 || rightBottomBanners.value.length > 1)
  ) {
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
const { direction: swipeDirection } = useSwipe(sliderRef, {
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

const isExternalUrl = (url?: string) => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};
</script>

<template>
  <!-- Loading Skeleton State -->
  <section v-if="status === 'pending'" class="container mx-auto px-4 pt-2" aria-label="Loading hero banners">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[540px] w-full">
      <div class="lg:col-span-8 rounded-3xl bg-muted/60 animate-pulse min-h-[360px] lg:min-h-[540px] p-8 md:p-12 flex flex-col justify-end space-y-4">
        <div class="w-1/3 h-6 bg-muted rounded-full"></div>
        <div class="w-2/3 h-10 bg-muted rounded-lg"></div>
        <div class="w-1/2 h-5 bg-muted rounded-lg"></div>
        <div class="w-32 h-11 bg-muted rounded-full"></div>
      </div>
      <div class="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
        <div class="flex-1 rounded-2xl bg-muted/60 animate-pulse min-h-[200px] p-6 flex flex-col justify-end space-y-2">
          <div class="w-3/4 h-6 bg-muted rounded-md"></div>
          <div class="w-1/2 h-4 bg-muted rounded-md"></div>
        </div>
        <div class="flex-1 rounded-2xl bg-muted/60 animate-pulse min-h-[200px] p-6 flex flex-col justify-end space-y-2">
          <div class="w-3/4 h-6 bg-muted rounded-md"></div>
          <div class="w-1/2 h-4 bg-muted rounded-md"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Real Banner Section -->
  <section
    v-else-if="hasAnyBanners"
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
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 lg:min-h-[540px] w-full">
        <!-- Primary Hero Area (homepage_hero) -->
        <div
          v-if="hasHeroBanners && currentHeroBanner"
          :class="[
            'relative rounded-3xl overflow-hidden bg-muted flex items-center p-8 md:p-12 shadow-xl group/primary min-h-[360px] lg:min-h-[540px]',
            hasRightBanners ? 'lg:col-span-8' : 'lg:col-span-12'
          ]"
        >
          <!-- Banner Image with Responsive Picture Support -->
          <Transition :name="prefersReducedMotion === 'reduce' ? 'fade' : `slide-${direction}`">
            <div :key="currentHeroBanner.id" class="absolute inset-0 z-0">
              <picture class="w-full h-full block">
                <source v-if="currentHeroBanner.mobile_image" media="(max-width: 639px)" :srcset="currentHeroBanner.mobile_image" />
                <img
                  :src="currentHeroBanner.image"
                  :alt="currentHeroBanner.title || 'Promotional Banner'"
                  :loading="heroCurrentIndex === 0 ? 'eager' : 'lazy'"
                  :fetchpriority="heroCurrentIndex === 0 ? 'high' : 'auto'"
                  class="w-full h-full object-cover group-hover/primary:scale-105 transition-transform duration-700"
                />
              </picture>
            </div>
          </Transition>

          <!-- Banner Copy and CTA -->
          <div v-if="currentHeroBanner.title || currentHeroBanner.subtitle || currentHeroBanner.cta_text || currentHeroBanner.cta_url" class="relative z-10 max-w-xl space-y-6">
            <h1 v-if="currentHeroBanner.title" class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.05] text-white">
              {{ currentHeroBanner.title }}
            </h1>

            <p v-if="currentHeroBanner.subtitle" class="text-base sm:text-lg text-white/80 leading-relaxed font-normal max-w-lg">
              {{ currentHeroBanner.subtitle }}
            </p>

            <div v-if="currentHeroBanner.cta_text || currentHeroBanner.cta_url" class="flex flex-wrap items-center gap-3 pt-2">
              <a
                v-if="isExternalUrl(currentHeroBanner.cta_url)"
                :href="currentHeroBanner.cta_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-7 text-sm font-semibold gap-2 transition-colors shadow-md"
              >
                <span>{{ currentHeroBanner.cta_text || 'Explore Now' }}</span>
                <ChevronRight class="w-4 h-4" />
              </a>
              <UiButton
                v-else
                size="lg"
                class="rounded-full gap-2 px-7 font-semibold"
                :to="currentHeroBanner.cta_url || '/products/'"
              >
                <span>{{ currentHeroBanner.cta_text || 'Explore Now' }}</span>
                <ChevronRight class="w-4 h-4" />
              </UiButton>
            </div>
          </div>

          <!-- Carousel Controls (Only rendered when > 1 hero banner) -->
          <template v-if="heroBanners.length > 1">
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

            <!-- Bottom Indicators -->
            <div class="absolute bottom-4 left-6 md:left-12 z-20 flex items-center gap-3">
              <div class="flex items-center gap-2 bg-black/40 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                <button
                  v-for="(b, idx) in heroBanners"
                  :key="b.id"
                  @click="goToHeroSlide(idx)"
                  :class="cn(
                    'h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    heroCurrentIndex === idx
                      ? 'w-7 bg-primary shadow-sm'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  )"
                  :aria-label="`Go to hero slide ${idx + 1}`"
                  :aria-current="heroCurrentIndex === idx ? 'true' : undefined"
                />
              </div>

              <span
                v-if="isPaused"
                class="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10"
              >
                <Pause class="w-3 h-3 text-primary" />
                <span>Paused</span>
              </span>
            </div>
          </template>
        </div>

        <!-- Right Stacked Secondary Banners (homepage_right_top & homepage_right_bottom) -->
        <div
          v-if="hasRightBanners"
          :class="[
            'flex flex-col sm:flex-row lg:flex-col gap-4 h-full',
            hasHeroBanners ? 'lg:col-span-4' : 'lg:col-span-12'
          ]"
        >
          <!-- Right Top Banner -->
          <component
            :is="isExternalUrl(currentRightTopBanner?.cta_url) ? 'a' : 'NuxtLink'"
            v-if="currentRightTopBanner"
            :[isExternalUrl(currentRightTopBanner?.cta_url)?'href':'to']="currentRightTopBanner.cta_url || '/products/'"
            :target="isExternalUrl(currentRightTopBanner?.cta_url) ? '_blank' : undefined"
            :rel="isExternalUrl(currentRightTopBanner?.cta_url) ? 'noopener noreferrer' : undefined"
            class="flex-1 relative rounded-2xl overflow-hidden bg-card border border-border/60 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] lg:min-h-0"
          >
            <picture class="absolute inset-0 z-0">
              <source v-if="currentRightTopBanner.mobile_image" media="(max-width: 639px)" :srcset="currentRightTopBanner.mobile_image" />
              <img
                :src="currentRightTopBanner.image"
                :alt="currentRightTopBanner.title || 'Promotional Banner'"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </picture>

            <div class="relative z-10 flex items-start justify-between">
              <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors ml-auto">
                <ArrowUpRight class="w-4 h-4" />
              </div>
            </div>

            <div v-if="currentRightTopBanner.title || currentRightTopBanner.subtitle || currentRightTopBanner.cta_text" class="relative z-10 space-y-1.5 pt-4">
              <h3 v-if="currentRightTopBanner.title" class="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                {{ currentRightTopBanner.title }}
              </h3>
              <p v-if="currentRightTopBanner.subtitle" class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {{ currentRightTopBanner.subtitle }}
              </p>
              <div v-if="currentRightTopBanner.cta_text" class="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline pt-1">
                <span>{{ currentRightTopBanner.cta_text }}</span>
                <ChevronRight class="w-3 h-3" />
              </div>
            </div>
          </component>

          <!-- Right Bottom Banner -->
          <component
            :is="isExternalUrl(currentRightBottomBanner?.cta_url) ? 'a' : 'NuxtLink'"
            v-if="currentRightBottomBanner"
            :[isExternalUrl(currentRightBottomBanner?.cta_url)?'href':'to']="currentRightBottomBanner.cta_url || '/products/'"
            :target="isExternalUrl(currentRightBottomBanner?.cta_url) ? '_blank' : undefined"
            :rel="isExternalUrl(currentRightBottomBanner?.cta_url) ? 'noopener noreferrer' : undefined"
            class="flex-1 relative rounded-2xl overflow-hidden bg-card border border-border/60 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] lg:min-h-0"
          >
            <picture class="absolute inset-0 z-0">
              <source v-if="currentRightBottomBanner.mobile_image" media="(max-width: 639px)" :srcset="currentRightBottomBanner.mobile_image" />
              <img
                :src="currentRightBottomBanner.image"
                :alt="currentRightBottomBanner.title || 'Promotional Banner'"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </picture>

            <div class="relative z-10 flex items-start justify-between">
              <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors ml-auto">
                <ArrowUpRight class="w-4 h-4" />
              </div>
            </div>

            <div v-if="currentRightBottomBanner.title || currentRightBottomBanner.subtitle || currentRightBottomBanner.cta_text" class="relative z-10 space-y-1.5 pt-4">
              <h3 v-if="currentRightBottomBanner.title" class="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                {{ currentRightBottomBanner.title }}
              </h3>
              <p v-if="currentRightBottomBanner.subtitle" class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {{ currentRightBottomBanner.subtitle }}
              </p>
              <div v-if="currentRightBottomBanner.cta_text" class="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline pt-1">
                <span>{{ currentRightBottomBanner.cta_text }}</span>
                <ChevronRight class="w-3 h-3" />
              </div>
            </div>
          </component>
        </div>
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


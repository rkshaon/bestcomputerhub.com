<!-- File: /components/home/HeroSlide.vue -->
<script setup lang="ts">
import { 
  Trophy, 
  ChevronRight, 
  Server, 
  Cpu, 
  ArrowUpRight, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Layers 
} from 'lucide-vue-next';
import type { HeroSlideData } from '@/types/hero';
import { cn } from '@/utils';

const props = withDefaults(defineProps<{
  slide: HeroSlideData;
  isFirstSlide?: boolean;
}>(), {
  isFirstSlide: false
});

// Icon mapping helper
const getIcon = (name?: string) => {
  switch (name) {
    case 'Trophy': return Trophy;
    case 'Server': return Server;
    case 'Cpu': return Cpu;
    case 'Zap': return Zap;
    case 'Sparkles': return Sparkles;
    case 'ShieldCheck': return ShieldCheck;
    case 'Layers': return Layers;
    default: return Trophy;
  }
};

const getBadgeClasses = (variant?: string) => {
  switch (variant) {
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'blue':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'primary':
    default:
      return 'bg-primary/10 text-primary';
  }
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[540px] w-full shrink-0">
    <!-- Left: Primary Hero (approx 2/3 width on desktop) -->
    <div class="lg:col-span-8 relative rounded-3xl overflow-hidden bg-black text-white flex items-center p-8 md:p-12 shadow-xl group/primary min-h-[360px] lg:min-h-0">
      <div class="absolute inset-0 z-0">
        <img 
          :src="slide.primary.image" 
          :alt="slide.primary.titlePrefix + slide.primary.titleHighlight"
          :loading="isFirstSlide ? 'eager' : 'lazy'"
          :fetchpriority="isFirstSlide ? 'high' : 'auto'"
          class="w-full h-full object-cover opacity-45 mix-blend-overlay group-hover/primary:scale-105 transition-transform duration-700"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
      </div>
      
      <div class="relative z-10 max-w-xl space-y-6">
        <div class="inline-flex items-center gap-2 bg-primary/15 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border border-primary/20">
          <component :is="getIcon(slide.primary.badgeIcon)" class="w-3.5 h-3.5" />
          <span>{{ slide.primary.badgeText }}</span>
        </div>
        
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.05] text-white">
          {{ slide.primary.titlePrefix }}<span class="text-primary italic">{{ slide.primary.titleHighlight }}</span>{{ slide.primary.titleSuffix || '' }}
        </h1>
        
        <p class="text-base sm:text-lg text-white/80 leading-relaxed font-normal max-w-lg">
          {{ slide.primary.description }}
        </p>
        
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <UiButton size="lg" class="rounded-full gap-2 px-7 font-semibold" :to="slide.primary.primaryAction.href">
            {{ slide.primary.primaryAction.label }} <ChevronRight class="w-4 h-4" />
          </UiButton>
          <UiButton 
            v-if="slide.primary.secondaryAction"
            variant="outline" 
            size="lg" 
            class="rounded-full text-white border-white/25 hover:bg-white/15 backdrop-blur-sm font-semibold" 
            :to="slide.primary.secondaryAction.href"
          >
            {{ slide.primary.secondaryAction.label }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Right: Two Stacked Promotional Banners (approx 1/3 width on desktop) -->
    <div class="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 h-full">
      <NuxtLink 
        v-for="(card, idx) in slide.secondary"
        :key="idx"
        :to="card.href"
        class="flex-1 relative rounded-2xl overflow-hidden bg-card border border-border/60 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] lg:min-h-0"
      >
        <div class="absolute inset-0 z-0">
          <img 
            :src="card.image" 
            :alt="card.title"
            :loading="isFirstSlide ? 'eager' : 'lazy'"
            class="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>

        <div class="relative z-10 flex items-start justify-between">
          <span :class="cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase', getBadgeClasses(card.badgeVariant))">
            <component :is="getIcon(card.badgeIcon)" class="w-3 h-3" />
            {{ card.badgeText }}
          </span>
          <div class="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
            <ArrowUpRight class="w-4 h-4" />
          </div>
        </div>

        <div class="relative z-10 space-y-1.5 pt-4">
          <h3 class="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
            {{ card.title }}
          </h3>
          <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {{ card.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

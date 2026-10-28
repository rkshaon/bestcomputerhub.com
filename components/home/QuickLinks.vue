<!-- File: /components/home/QuickLinks.vue -->
<script setup lang="ts">
import { 
  Wrench, 
  Sliders, 
  Settings, 
  AlertCircle,
  Headphones, 
  Sparkles 
} from 'lucide-vue-next';

interface QuickLinkItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'destructive' | 'primary' | 'amber';
}

const quickLinks: QuickLinkItem[] = [
  {
    id: 'repair-hub',
    title: 'Repair Hub',
    description: 'Expert hardware repair & component diagnostics',
    icon: Wrench,
  },
  {
    id: 'tools',
    title: 'Tools',
    description: 'System utilities & diagnostic software',
    icon: Sliders,
  },
  {
    id: 'servicing-center',
    title: 'Servicing Center',
    description: 'Professional maintenance & cleaning',
    icon: Settings,
  },
  {
    id: 'raise-complain',
    title: 'Raise a Complain',
    description: 'Report issues & get resolution support',
    icon: AlertCircle,
  },
  {
    id: 'help-center',
    title: 'Help Center',
    description: 'Customer service & technical support',
    icon: Headphones,
  },
  {
    id: 'ai-mode',
    title: 'AI Mode',
    description: 'Intelligent hardware recommendations',
    icon: Sparkles,
    badge: 'New',
    badgeVariant: 'amber',
  },
];
</script>

<template>
  <section class="container mx-auto px-4" aria-label="Quick Access Navigation">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <div
        v-for="item in quickLinks"
        :key="item.id"
        class="group relative flex flex-col justify-between p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 select-none"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
              <component :is="item.icon" class="w-5 h-5" aria-hidden="true" />
            </div>

            <span
              v-if="item.badge"
              :class="[
                'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                item.badgeVariant === 'destructive' ? 'bg-destructive/10 text-destructive' : '',
                item.badgeVariant === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : '',
                item.badgeVariant === 'primary' ? 'bg-primary/10 text-primary' : '',
              ]"
            >
              {{ item.badge }}
            </span>
          </div>

          <h3 class="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
            {{ item.title }}
          </h3>
          <p class="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-normal">
            {{ item.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

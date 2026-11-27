<!-- File: /features/admin/components/DashboardStatCard.vue -->
<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next';
import { cn } from '@/utils';
import UiCard from '@/components/ui/UiCard.vue';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: string;
  cardClass?: string;
  iconBoxClass?: string;
  iconClass?: string;
  valueClass?: string;
}

const props = defineProps<Props>();

defineSlots<{
  background?: () => unknown;
  footer?: () => unknown;
}>();
</script>

<template>
  <UiCard :class="cn('relative overflow-hidden flex flex-col justify-center gap-2.5 p-5 sm:p-6 xl:p-3 rounded-xl', cardClass)">
    <div
      v-if="$slots.background"
      aria-hidden="true"
      class="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden"
    >
      <slot name="background" />
    </div>
    <div class="relative z-10 flex items-center gap-3 w-full">
      <div :class="cn('w-12 h-12 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center shrink-0', color || 'bg-primary/10 text-primary', iconBoxClass)">
        <component :is="icon" :class="cn('w-6 h-6 xl:w-5 xl:h-5', iconClass)" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 leading-tight">{{ label }}</p>
        <div class="flex items-baseline gap-2 flex-wrap">
          <h3 :class="cn('text-2xl sm:text-3xl xl:text-xl font-display font-black tracking-tight break-words', valueClass)">{{ value }}</h3>
          <span
            v-if="typeof trend === 'number' && Number.isFinite(trend)"
            :class="cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
              trend > 0
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                : trend < 0
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                  : 'bg-muted text-muted-foreground'
            )"
          >
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </span>
        </div>
      </div>
    </div>
    <div v-if="$slots.footer" class="relative z-10 w-full">
      <slot name="footer" />
    </div>
  </UiCard>
</template>

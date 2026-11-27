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
  sparklineClass?: string;
}

const props = defineProps<Props>();

defineSlots<{
  footer?: () => unknown;
}>();

const getSparklinePath = (series: number[]) => {
  if (!series || series.length === 0) return '';
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  return series.map((val, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

// Series data placeholder if none provided
const defaultSeries = [10, 15, 8, 22, 18, 25, 30];
</script>

<template>
  <UiCard :class="cn('flex flex-col justify-center gap-2.5 p-5 sm:p-6 xl:p-3 rounded-xl', cardClass)">
    <div class="flex items-center gap-3 w-full">
      <div :class="cn('w-12 h-12 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center shrink-0', color || 'bg-primary/10 text-primary', iconBoxClass)">
        <component :is="icon" :class="cn('w-6 h-6 xl:w-5 xl:h-5', iconClass)" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 leading-tight">{{ label }}</p>
        <div class="flex items-baseline gap-2 flex-wrap">
          <h3 :class="cn('text-2xl sm:text-3xl xl:text-xl font-display font-black tracking-tight break-words', valueClass)">{{ value }}</h3>
          <span v-if="trend !== undefined" :class="cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')">
            {{ trend >= 0 ? '+' : '' }}{{ trend }}%
          </span>
        </div>
      </div>
      <div :class="cn('w-20 h-8 shrink-0 hidden sm:block xl:hidden', sparklineClass)">
        <svg viewBox="0 0 100 30" class="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="getSparklinePath(defaultSeries)"
            :class="color?.replace('bg-', 'text-')?.split(' ')[1] || 'text-indigo-500'"
          />
        </svg>
      </div>
    </div>
    <div v-if="$slots.footer" class="w-full">
      <slot name="footer" />
    </div>
  </UiCard>
</template>

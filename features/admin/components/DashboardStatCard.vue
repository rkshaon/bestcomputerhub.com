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
}

const props = defineProps<Props>();

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
  <UiCard class="flex items-center gap-6 p-8">
    <div :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', color || 'bg-primary/10 text-primary')">
      <component :is="icon" class="w-7 h-7" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{{ label }}</p>
      <div class="flex items-baseline gap-3">
        <h3 class="text-3xl font-display font-black tracking-tight">{{ value }}</h3>
        <span v-if="trend !== undefined" :class="cn('text-[10px] font-bold px-1.5 py-0.5 rounded', trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')">
          {{ trend >= 0 ? '+' : '' }}{{ trend }}%
        </span>
      </div>
    </div>
    <div class="w-20 h-8 shrink-0 hidden sm:block">
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
  </UiCard>
</template>

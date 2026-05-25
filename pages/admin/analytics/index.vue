<!-- File: /pages/admin/analytics/index.vue -->
<script setup lang="ts">
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Globe, 
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  MousePointer2,
  Clock
} from 'lucide-vue-next';
import * as d3 from 'd3';
import { cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

// UI State
const timeframe = ref('30d');
const isLoading = ref(false);

const stats = [
  { label: 'Net Revenue', value: '$2.4M', change: '+12.5%', trend: 'up', icon: ShoppingCart },
  { label: 'Active Sessions', value: '14.2k', change: '+8.1%', trend: 'up', icon: Activity },
  { label: 'Conversion Rate', value: '3.2%', change: '-0.4%', trend: 'down', icon: MousePointer2 },
  { label: 'Avg. Order Value', value: '$840', change: '+15.2%', trend: 'up', icon: Zap },
];

const topProducts = [
  { name: 'Core Series X1', sales: 1240, revenue: '$1.04M', growth: '+24%' },
  { name: 'Matrix Rack G3', sales: 840, revenue: '$640k', growth: '+12%' },
  { name: 'Nexus Switch S8', sales: 620, revenue: '$320k', growth: '-2%' },
  { name: 'Titan Memory Module', sales: 410, revenue: '$120k', growth: '+18%' },
];

// Mock data for charts
const generateChartData = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: d3.timeFormat('%b %d')(d3.timeDay.offset(new Date(), -days + i)),
    value: Math.floor(Math.random() * 500) + 1500,
    secondary: Math.floor(Math.random() * 300) + 800
  }));
};

const chartData = computed(() => generateChartData(timeframe.value === '7d' ? 7 : 30));

const refreshStats = async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  isLoading.value = false;
};

// Tooltip state for custom charts
const hoverData = ref<{ date: string; value: number } | null>(null);

function handleMouseMove(e: MouseEvent, index: number) {
  const dataPoint = chartData.value[index];
  if (dataPoint) {
    hoverData.value = { 
      date: dataPoint.date, 
      value: dataPoint.value 
    };
  }
}

function handleMouseLeave() {
  hoverData.value = null;
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Enterprise Intelligence Engine
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Market Analytics</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Global performance metrics and predictive supply chain insights.</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
          <button 
            v-for="t in ['7d', '30d', '90d']" 
            :key="t"
            @click="timeframe = t"
            :class="cn(
              'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
              timeframe === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )"
          >
            {{ t }}
          </button>
        </div>
        <UiButton variant="outline" class="rounded-2xl h-11 px-4 gap-2 border-slate-200 dark:border-slate-800" @click="refreshStats">
          <RefreshCcw :class="cn('w-4 h-4', isLoading && 'animate-spin')" />
        </UiButton>
        <UiButton class="rounded-2xl h-11 px-6 gap-2 shadow-xl shadow-primary/20">
          <Download class="w-4 h-4" /> Export Report
        </UiButton>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UiCard v-for="stat in stats" :key="stat.label" class="p-6 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
        <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
           <component :is="stat.icon" class="w-32 h-32" />
        </div>
        
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
          <div :class="cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest',
            stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
          )">
            <TrendingUp v-if="stat.trend === 'up'" class="w-3 h-3" />
            <TrendingDown v-else class="w-3 h-3" />
            {{ stat.change }}
          </div>
        </div>
        
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-display font-black tracking-tighter">{{ stat.value }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Main Visualizations Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Revenue Chart Card -->
      <UiCard class="lg:col-span-2 p-8 flex flex-col h-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Revenue Performance</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Growth trajectory over selected period</p>
          </div>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
              <span class="text-[10px] font-bold text-slate-500 uppercase">Gross</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <span class="text-[10px] font-bold text-slate-500 uppercase">Projection</span>
            </div>
          </div>
        </div>
        
        <!-- Custom SVG Chart -->
        <div class="flex-1 w-full min-h-[300px] relative mt-4 group/chart" @mouseleave="handleMouseLeave">
          <svg viewBox="0 0 800 300" class="w-full h-full preserve-3d overflow-visible">
            <!-- Grid Lines -->
            <line v-for="i in 5" :key="i" x1="0" :y1="300 - (i * 60)" x2="800" :y2="300 - (i * 60)" class="stroke-slate-100 dark:stroke-slate-900" stroke-width="1" />
            
            <!-- Area Gradient -->
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2" />
                <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Main Line Path -->
            <path 
              :d="`M ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 800},${300 - ((d.value - 1000) / 1000) * 300}`).join(' L ')}`"
              fill="none"
              class="stroke-primary"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- Secondary Line -->
            <path 
              :d="`M ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 800},${300 - ((d.secondary - 500) / 1000) * 300}`).join(' L ')}`"
              fill="none"
              class="stroke-slate-300 dark:stroke-slate-700"
              stroke-width="2"
              stroke-dasharray="4 6"
              stroke-linecap="round"
            />

            <!-- Interaction Areas -->
            <rect 
              v-for="(d, i) in chartData" 
              :key="`rect-${i}`"
              :x="(i / (chartData.length - 1)) * 800 - (400 / chartData.length)"
              y="0"
              :width="800 / chartData.length"
              height="300"
              fill="transparent"
              class="cursor-crosshair"
              @mousemove="(e) => handleMouseMove(e, i)"
            />

            <!-- Hover Vertical Line -->
            <line 
              v-if="hoverData" 
              :x1="(chartData.findIndex(d => d.date === hoverData?.date) / (chartData.length - 1)) * 800" 
              y1="0" 
              :x2="(chartData.findIndex(d => d.date === hoverData?.date) / (chartData.length - 1)) * 800" 
              y2="300" 
              class="stroke-primary/30" 
              stroke-width="1"
              stroke-dasharray="4 4"
            />
          </svg>

          <!-- Tooltip (Overlay) -->
          <div 
            v-if="hoverData"
            class="absolute bg-slate-900 text-white p-3 rounded-xl shadow-2xl pointer-events-none transition-all duration-200 z-20 border border-white/10"
            :style="{ 
              left: `${(chartData.findIndex(d => d.date === hoverData?.date) / (chartData.length - 1)) * 100}%`,
              top: '20%',
              transform: 'translateX(-50%)'
            }"
          >
            <p class="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{{ hoverData.date }}</p>
            <p class="text-sm font-black tracking-tight">${{ hoverData.value.toLocaleString() }}</p>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between">
          <div class="flex gap-12">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peak Volume</p>
              <p class="text-sm font-black tracking-tight">$42,840</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Lift</p>
              <p class="text-sm font-black tracking-tight">+14.2%</p>
            </div>
          </div>
          <NuxtLink to="#" class="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            Download Raw Dataset <Download class="w-3 h-3" />
          </NuxtLink>
        </div>
      </UiCard>

      <!-- Traffic Source Card -->
      <UiCard class="p-8 bg-slate-900 border-none text-white overflow-hidden relative">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
        <div class="relative z-10">
          <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-8">Access Points</h3>
          
          <div class="space-y-6">
            <div v-for="source in [{n: 'Direct', v: 45}, {n: 'Organic Search', v: 30}, {n: 'Referral', v: 15}, {n: 'Social', v: 10}]" :key="source.n" class="space-y-2">
              <div class="flex justify-between items-end">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ source.n }}</span>
                <span class="text-xs font-black">{{ source.v }}%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                  :style="{ width: `${source.v}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Globe class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="text-xs font-bold">Global Reach</p>
                <p class="text-[10px] text-slate-400 font-medium">142 Countries tracked</p>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 leading-relaxed italic">
              "North American traffic has increased by 22% following the TechSummit event."
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Bottom Secondary Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- High-Performance Assets Table -->
      <UiCard class="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div class="p-8 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 class="text-sm font-black uppercase tracking-[0.2em]">Alpha Product Performance</h3>
          <UiButton variant="ghost" size="sm" class="text-[10px] font-bold p-0 hover:bg-transparent">VIEW ALL</UiButton>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-900">
                <th class="px-8 py-4">Asset Label</th>
                <th class="px-8 py-4">Velocity</th>
                <th class="px-8 py-4">Yield</th>
                <th class="px-8 py-4 text-right">Momentum</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
              <tr v-for="p in topProducts" :key="p.name" class="group hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                <td class="px-8 py-5 text-xs font-bold">{{ p.name }}</td>
                <td class="px-8 py-5 text-xs font-medium text-slate-500">{{ p.sales }} units</td>
                <td class="px-8 py-5 text-xs font-black tracking-tight text-slate-900 dark:text-white">{{ p.revenue }}</td>
                <td class="px-8 py-5 text-right">
                  <span :class="cn('text-[10px] font-black px-2 py-1 rounded-lg', 
                    p.growth.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                  )">
                    {{ p.growth }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>

      <!-- Predictive Insights -->
      <div class="space-y-6">
        <div class="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
          <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-6">
              <Zap class="w-5 h-5 text-indigo-200" />
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Cortex Insight</span>
            </div>
            <h4 class="text-2xl font-display font-extrabold tracking-tight mb-4 leading-tight">Supply chain velocity is 15% above threshold.</h4>
            <p class="text-sm text-indigo-100/80 leading-relaxed mb-8">
              Based on rolling 7-day data, we recommend increasing safety stock for "Matrix Rack G3" by 250 units to prevent stock-out in the EU sector.
            </p>
            <UiButton class="bg-white text-indigo-600 hover:bg-white/90 rounded-2xl w-full font-black text-[10px] uppercase tracking-[0.2em] py-4 h-auto border-none shadow-none">
              EXECUTE OPTIMIZATION
            </UiButton>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <UiCard class="p-6 bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-4">
              <Users class="w-5 h-5" />
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 mb-1">Retention Rate</p>
            <p class="text-xl font-display font-black tracking-tighter text-emerald-900 dark:text-emerald-300">88.2%</p>
          </UiCard>
          
          <UiCard class="p-6 bg-slate-900 text-white border-none relative overflow-hidden">
             <div class="absolute top-0 right-0 p-3">
               <div class="w-2 h-2 rounded-full bg-primary animate-ping"></div>
             </div>
             <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
              <Clock class="w-5 h-5" />
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Consumers</p>
            <p class="text-xl font-display font-black tracking-tighter">4,284</p>
          </UiCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preserve-3d {
  transform-style: preserve-3d;
}
</style>

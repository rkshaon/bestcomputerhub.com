<!-- File: /pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { markRaw } from 'vue';
import { 
  Users, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp,
  Download,
  Package,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { useSalesService } from '@/composables/useSalesService';
import { formatCurrency } from '@/utils';
import DashboardStatCard from '@/features/admin/components/DashboardStatCard.vue';
import RecentOrdersTable from '@/features/admin/components/RecentOrdersTable.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: 'admin'
});

const adminStore = useAdminStore();
const salesService = useSalesService();

const performanceDays = ref<number>(90);
const performanceData = ref<any | null>(null);
const isPerformanceLoading = ref(false);
const performanceError = ref<string | null>(null);
const activeTrendMetric = ref<'revenue' | 'orders'>('revenue');

const periods = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '60D', value: 60 },
  { label: '90D', value: 90 },
  { label: '180D', value: 180 },
  { label: '365D', value: 365 },
];

const fetchPerformance = async () => {
  isPerformanceLoading.value = true;
  performanceError.value = null;
  try {
    const data = await salesService.getSalesPerformance(performanceDays.value);
    performanceData.value = data;
  } catch (err: any) {
    performanceError.value = err.message || 'Failed to load sales performance report.';
  } finally {
    isPerformanceLoading.value = false;
  }
};

watch(performanceDays, () => {
  fetchPerformance();
});

onMounted(() => {
  adminStore.fetchStats();
  fetchPerformance();
});

const overview = computed(() => performanceData.value?.overview || { total_orders: 0, total_revenue: 0, average_order_value: 0 });
const comparison = computed(() => performanceData.value?.comparison || { order_growth_percentage: 0, revenue_growth_percentage: 0 });
const dailyTrend = computed(() => performanceData.value?.daily_trend || []);

const formatGrowth = (val: number | null | undefined) => {
  if (val === null || val === undefined) return undefined;
  return Number(val);
};

const getTrendPoints = (metric: 'revenue' | 'orders') => {
  const trend = dailyTrend.value;
  if (!trend || trend.length === 0) return '';
  const values = trend.map((d: any) => metric === 'revenue' ? Number(d.revenue || 0) : Number(d.order_count || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 600;
  const height = 160;

  return values.map((val: number, i: number) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - ((val - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');
};

const iconMap = {
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">System Overview</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Command Center: Best Computer Hub Control v4.2.1</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Download class="w-4 h-4" /> Export Report
        </button>
        <button class="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <TrendingUp class="w-4 h-4" /> Optimization Pulse
        </button>
      </div>
    </div>

    <!-- Sales Performance Report Section -->
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <h2 class="text-xl font-display font-black tracking-tight">Sales Performance Report</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Comprehensive order volume, revenue, and growth analytics.</p>
        </div>
        <!-- Period Selector -->
        <div class="flex items-center gap-1 flex-wrap bg-muted/50 p-1 rounded-xl border border-border">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="performanceDays = p.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              performanceDays === p.value 
                ? 'bg-primary text-primary-foreground shadow-xs' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            ]"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isPerformanceLoading" class="py-16 flex items-center justify-center gap-3 bg-card border rounded-2xl">
        <Loader2 class="w-6 h-6 text-primary animate-spin" />
        <span class="text-xs font-bold text-muted-foreground">Loading performance report...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="performanceError" class="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-bold flex items-center gap-3">
        <AlertCircle class="w-5 h-5 shrink-0" />
        <span>{{ performanceError }}</span>
      </div>

      <!-- Performance Content -->
      <template v-else>
        <!-- Summary Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardStatCard 
            label="Total Revenue"
            :value="formatCurrency(overview.total_revenue)"
            :icon="DollarSign"
            :trend="formatGrowth(comparison.revenue_growth_percentage)"
            color="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
          />
          <DashboardStatCard 
            label="Total Orders"
            :value="overview.total_orders?.toLocaleString() || 0"
            :icon="ShoppingBag"
            :trend="formatGrowth(comparison.order_growth_percentage)"
            color="bg-blue-100 dark:bg-blue-950/30 text-blue-600"
          />
          <DashboardStatCard 
            label="Average Order Value"
            :value="formatCurrency(overview.average_order_value)"
            :icon="TrendingUp"
            color="bg-amber-100 dark:bg-amber-950/30 text-amber-600"
          />
        </div>

        <!-- Daily Trend Visualization -->
        <UiCard class="p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 class="text-base font-display font-bold">Daily Sales Trend</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Showing daily breakdown for the last {{ performanceDays }} days</p>
            </div>
            <!-- Metric Toggle -->
            <div class="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
              <button
                type="button"
                @click="activeTrendMetric = 'revenue'"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTrendMetric === 'revenue' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                Revenue
              </button>
              <button
                type="button"
                @click="activeTrendMetric = 'orders'"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTrendMetric === 'orders' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                Orders
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!dailyTrend || dailyTrend.length === 0" class="py-12 text-center text-xs text-muted-foreground">
            No daily trend data available for this period.
          </div>

          <!-- Chart Area -->
          <div v-else class="space-y-4">
            <div class="h-40 sm:h-52 w-full relative pt-2">
              <svg viewBox="0 0 600 160" class="w-full h-full overflow-visible preserve-3d">
                <line x1="0" y1="20" x2="600" y2="20" stroke="currentColor" class="text-border/40" stroke-dasharray="4 4" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="currentColor" class="text-border/40" stroke-dasharray="4 4" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" class="text-border/40" stroke-dasharray="4 4" />

                <polyline
                  fill="none"
                  :stroke="activeTrendMetric === 'revenue' ? '#059669' : '#2563EB'"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :points="getTrendPoints(activeTrendMetric)"
                />
              </svg>
            </div>

            <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Showing {{ dailyTrend.length }} data points</span>
              <span class="font-bold text-foreground">
                Peak {{ activeTrendMetric === 'revenue' ? 'Revenue' : 'Orders' }}: 
                {{ activeTrendMetric === 'revenue' ? formatCurrency(Math.max(...dailyTrend.map((d: any) => Number(d.revenue || 0)))) : Math.max(...dailyTrend.map((d: any) => Number(d.order_count || 0))) }}
              </span>
            </div>
          </div>
        </UiCard>
      </template>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <!-- Recent Orders Feature -->
      <div class="xl:col-span-2">
        <RecentOrdersTable :orders="adminStore.recentOrders" />
      </div>

      <!-- Inventory Pulse / Secondary Column -->
      <div class="space-y-8">
        <UiCard>
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              Stock Anomalies
            </h3>
            <span class="bg-rose-100 dark:bg-rose-950/30 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">{{ adminStore.inventoryAlerts.length }} Critical</span>
          </div>
          <div class="space-y-6">
            <div v-for="alert in adminStore.inventoryAlerts.slice(0, 3)" :key="alert.productId" class="flex items-start gap-4 group">
              <div :class="[
                'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs',
                alert.status === 'out_of_stock' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              ]">
                {{ alert.currentStock }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate">{{ alert.productName }}</p>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-[10px] text-slate-400 font-bold uppercase italic">{{ alert.status.replace('_', ' ') }}</span>
                  <div class="h-1 w-12 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      :class="['h-full rounded-full', alert.status === 'out_of_stock' ? 'bg-rose-500' : 'bg-amber-500']"
                      :style="{ width: (alert.currentStock / alert.threshold * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <NuxtLink to="/admin/products" class="block text-center pt-4 border-t border-slate-50 dark:border-slate-900 border-dashed text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
              Inventory Registry Audit
            </NuxtLink>
          </div>
        </UiCard>

        <div class="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Package class="w-32 h-32" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Security protocol</p>
          <h3 class="text-xl font-display font-black tracking-tight mb-4">Enterprise Shield Active</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            All procurement protocols are encrypted with Quantum-grade tunneling. Transaction integrity verified.
          </p>
          <button class="text-[10px] font-bold uppercase tracking-widest text-white border-b border-emerald-400 pb-1">
            Identity Registry Overview
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

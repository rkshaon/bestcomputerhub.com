<!-- File: /pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { 
  DollarSign, 
  ShoppingBag, 
  ShoppingCart,
  TrendingUp,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Receipt,
  Clock,
  User,
  Mail
} from 'lucide-vue-next';
import { useSalesService } from '@/composables/useSalesService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { extractErrorMessage } from '@/composables/useToast';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils';
import {
  toMoney,
  calculateDeliveredRevenuePercentage,
  formatDeliveredRevenuePercentage,
  normalizeComparisonGrowth
} from '@/utils/order';
import type { SalesPerformanceReport, SalesPerformanceLastOrder } from '@/types';
import DashboardStatCard from '@/features/admin/components/DashboardStatCard.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: false
});

const salesService = useSalesService();
const { hasPermission } = useAdminPermissions();
const canViewSalesPerformance = computed(() => hasPermission('sale_api.view_sale'));

const performanceDays = ref<number>(90);
const performanceData = ref<SalesPerformanceReport | null>(null);
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
  if (!canViewSalesPerformance.value) return;
  isPerformanceLoading.value = true;
  performanceError.value = null;
  try {
    const data = await salesService.getSalesPerformance(performanceDays.value);
    performanceData.value = data;
  } catch (err: any) {
    performanceError.value = extractErrorMessage(err, 'Failed to load sales performance report.');
  } finally {
    isPerformanceLoading.value = false;
  }
};

watch(performanceDays, () => {
  if (canViewSalesPerformance.value) {
    fetchPerformance();
  }
});

onMounted(() => {
  if (canViewSalesPerformance.value) {
    fetchPerformance();
  }
});

const overview = computed(() => performanceData.value?.overview ?? null);
const totalRevenueAmount = computed(() => toMoney(overview.value?.total_revenue));
const deliveredOrderAmount = computed(() => toMoney(overview.value?.delivered_order_amount));
const deliveredRevenuePercentageValue = computed(() =>
  calculateDeliveredRevenuePercentage(overview.value?.delivered_order_amount, overview.value?.total_revenue)
);
const deliveredRevenuePercentage = computed(() =>
  formatDeliveredRevenuePercentage(overview.value?.delivered_order_amount, overview.value?.total_revenue)
);
const deliveredRevenueWatermarkColorClass = computed(() => {
  const pct = deliveredRevenuePercentageValue.value;
  if (pct > 75) {
    return 'text-green-700/[0.18] dark:text-green-400/[0.18]';
  }
  if (pct > 50) {
    return 'text-yellow-600/[0.22] dark:text-yellow-400/[0.18]';
  }
  return 'text-red-700/[0.18] dark:text-red-400/[0.18]';
});
const deliveredRevenueWatermarkSizeClass = computed(() => {
  const length = deliveredRevenuePercentage.value.length;
  if (length <= 3) return 'text-[length:min(92cqh,40cqw)]';
  if (length === 4) return 'text-[length:min(92cqh,31cqw)]';
  return 'text-[length:min(92cqh,26cqw)]';
});
const averageOrderValueAmount = computed(() => toMoney(overview.value?.average_order_value));
const totalOrdersCount = computed<number>(() => {
  const raw = overview.value?.total_orders;
  if (raw === null || raw === undefined) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
});
const comparison = computed(() => performanceData.value?.comparison ?? null);
const dailyTrend = computed(() => performanceData.value?.daily_trend || []);
const todayOrders = computed<number>(() => {
  const raw = performanceData.value?.today_orders;
  if (raw === null || raw === undefined) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
});
const lastOrder = computed<SalesPerformanceLastOrder | null>(() => performanceData.value?.last_order ?? null);

const currentNow = useNow({ interval: 60_000 });

const formatSaleDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
  if (dateOnlyMatch) {
    const localDate = new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]));
    if (!isNaN(localDate.getTime())) {
      const day = localDate.getDate();
      const month = localDate.toLocaleString('en-US', { month: 'short' });
      const year = localDate.getFullYear();
      return `${day} ${month}, ${year}`;
    }
  }
  return formatDate(dateString);
};

const formatLastOrderTimestamp = (order: SalesPerformanceLastOrder): string => {
  const relative = formatRelativeTime(order.created_at, {
    now: currentNow.value,
    fallback: '',
  });
  if (relative) {
    return relative;
  }
  return formatSaleDate(order.sale_date);
};

const formatLastOrderTooltip = (order: SalesPerformanceLastOrder): string | undefined => {
  if (typeof order.created_at === 'string' && order.created_at.trim()) {
    const parsed = new Date(order.created_at.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  }
  const saleDateFallback = formatSaleDate(order.sale_date);
  return saleDateFallback !== 'N/A' ? saleDateFallback : undefined;
};

const formatGrowth = (val: number | string | null | undefined) => {
  return normalizeComparisonGrowth(val);
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

const kpiCardLayoutClasses = {
  cardClass: 'p-5 sm:p-6 xl:p-3 rounded-xl',
  iconBoxClass: 'w-12 h-12 xl:w-9 xl:h-9 rounded-xl',
  iconClass: 'w-6 h-6 xl:w-5 xl:h-5',
  valueClass: 'text-2xl sm:text-3xl xl:text-xl',
};
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-2xl sm:text-[26px] font-display font-extrabold tracking-tight text-foreground">
          System Overview
        </h1>
      </div>
    </template>

    <div class="space-y-6 animate-in fade-in duration-700">
      <!-- Sales Performance Report Section -->
      <div v-if="canViewSalesPerformance" class="space-y-6">
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
        <!-- Summary & Overview Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.4fr)] gap-3">
          <DashboardStatCard 
            label="Total Revenue"
            :value="formatCurrency(totalRevenueAmount)"
            :icon="DollarSign"
            :trend="formatGrowth(comparison?.revenue_growth_percentage)"
            color="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
            v-bind="kpiCardLayoutClasses"
          >
            <template #background>
              <div class="w-full h-full flex items-center justify-end pr-3 sm:pr-4 xl:pr-2.5 [container-type:size]">
                <span
                  :class="[
                    'font-display font-black leading-none tracking-tighter whitespace-nowrap transition-colors duration-300',
                    deliveredRevenueWatermarkSizeClass,
                    deliveredRevenueWatermarkColorClass
                  ]"
                >
                  {{ deliveredRevenuePercentage }}
                </span>
              </div>
            </template>
            <template #footer>
              <div class="pt-2 border-t border-border/70 text-[11px] xl:text-[10px]">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground font-medium">Delivered</span>
                  <span class="font-bold text-foreground tabular-nums">{{ formatCurrency(deliveredOrderAmount) }}</span>
                </div>
              </div>
            </template>
          </DashboardStatCard>
          <DashboardStatCard 
            label="Total Orders"
            :value="totalOrdersCount.toLocaleString()"
            :icon="ShoppingBag"
            :trend="formatGrowth(comparison?.order_growth_percentage)"
            color="bg-blue-100 dark:bg-blue-950/30 text-blue-600"
            v-bind="kpiCardLayoutClasses"
          />
          <DashboardStatCard 
            label="Average Order Value"
            :value="formatCurrency(averageOrderValueAmount)"
            :icon="TrendingUp"
            color="bg-amber-100 dark:bg-amber-950/30 text-amber-600"
            v-bind="kpiCardLayoutClasses"
          />
          <DashboardStatCard
            label="Today's Orders"
            :value="todayOrders.toLocaleString('en-US')"
            :icon="ShoppingCart"
            color="bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600"
            v-bind="kpiCardLayoutClasses"
          />

          <UiCard class="sm:col-span-2 xl:col-span-1 p-5 sm:p-6 xl:p-3 rounded-xl flex flex-col justify-center">
            <div class="flex items-start gap-3">
              <div class="w-11 h-11 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center shrink-0 bg-violet-100 dark:bg-violet-950/30 text-violet-600">
                <Receipt class="w-5 h-5" />
              </div>

              <div v-if="lastOrder" class="flex-1 min-w-0 space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Order</p>
                  <span
                    class="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground shrink-0"
                    :title="formatLastOrderTooltip(lastOrder)"
                  >
                    <Clock class="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{{ formatLastOrderTimestamp(lastOrder) }}</span>
                  </span>
                </div>

                <div class="flex items-baseline justify-between gap-2 flex-wrap">
                  <NuxtLink
                    :to="`/admin/orders/${lastOrder.id}`"
                    class="text-xl sm:text-2xl xl:text-lg font-display font-black tracking-tight text-foreground hover:text-primary transition-colors"
                  >
                    #{{ lastOrder.id }}
                  </NuxtLink>
                  <p class="text-xl sm:text-2xl xl:text-lg font-display font-black tracking-tight text-foreground">
                    {{ formatCurrency(toMoney(lastOrder.total_amount)) }}
                  </p>
                </div>

                <div class="pt-1.5 border-t border-border/70 flex flex-col sm:flex-row sm:items-center xl:flex-col xl:items-stretch gap-1 sm:gap-4 xl:gap-0.5 text-[11px] text-muted-foreground">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <User class="w-3 h-3 text-muted-foreground shrink-0" />
                    <span class="font-semibold text-foreground truncate">{{ lastOrder.customer_name || 'Guest Customer' }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <Mail class="w-3 h-3 text-muted-foreground shrink-0" />
                    <span class="truncate">{{ lastOrder.customer_email || 'No email provided' }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="flex-1 min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Last Order</p>
                <p class="text-sm font-display font-bold text-foreground">No orders yet</p>
                <p class="text-[11px] text-muted-foreground mt-0.5 leading-snug">Most recent order details will appear here.</p>
              </div>
            </div>
          </UiCard>
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

      <!-- Permission Fallback -->
      <UiCard v-else class="p-6 rounded-xl border border-border">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div class="space-y-1">
            <h2 class="text-base font-display font-bold text-foreground">Sales Performance Restricted</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Sales revenue and order analytics are unavailable for your current role. Use the navigation menu to access your permitted modules.
            </p>
          </div>
        </div>
      </UiCard>
    </div>
  </NuxtLayout>
</template>

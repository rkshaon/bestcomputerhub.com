<script setup lang="ts">
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight,
  Clock,
  ExternalLink,
  MoreVertical,
  AlertCircle,
  Package
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { formatCurrency, cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

const adminStore = useAdminStore();

// Mini Sparkline Helper
const getSparklinePath = (data: number[]) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 100;
  const height = 30;
  
  return data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-500',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-500',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-500',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-500',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-500',
  refunded: 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-500',
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Enterprise Overview</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Real-time performance metrics across your marketplace.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex">
          <button class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">24h</button>
          <button class="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">7d</button>
          <button class="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">30d</button>
        </div>
        <button class="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <ArrowUpRight class="w-4 h-4" /> Export Report
        </button>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Revenue Card -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign class="w-6 h-6" />
          </div>
          <div class="w-20 h-8">
            <svg viewBox="0 0 100 30" class="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="getSparklinePath(adminStore.stats.revenue.series)"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Revenue</p>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-display font-extrabold">{{ formatCurrency(adminStore.stats.revenue.total) }}</span>
            <span class="text-xs font-bold text-emerald-600 flex items-center gap-0.5 mb-1">
              <TrendingUp class="w-3 h-3" /> +{{ adminStore.stats.revenue.growth }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Orders Card -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-blue-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag class="w-6 h-6" />
          </div>
          <div class="w-20 h-8">
            <svg viewBox="0 0 100 30" class="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="getSparklinePath(adminStore.stats.orders.series)"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed Orders</p>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-display font-extrabold">{{ adminStore.stats.orders.total }}</span>
            <span class="text-xs font-bold text-emerald-600 flex items-center gap-0.5 mb-1">
              <TrendingUp class="w-3 h-3" /> +{{ adminStore.stats.orders.growth }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Customers Card -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users class="w-6 h-6" />
          </div>
          <div class="w-20 pt-2 h-8">
            <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full" style="width: 75%"></div>
            </div>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Market Reach</p>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-display font-extrabold">{{ adminStore.stats.customers.total.toLocaleString() }}</span>
            <span class="text-xs font-bold text-emerald-600 flex items-center gap-0.5 mb-1">
              <TrendingUp class="w-3 h-3" /> +{{ adminStore.stats.customers.growth }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Avg Order Value Card -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-amber-100 dark:bg-amber-950/30 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp class="w-6 h-6" />
          </div>
          <div class="w-20 pt-2 h-8">
            <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full" style="width: 45%"></div>
            </div>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg. Order Value</p>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-display font-extrabold">{{ formatCurrency(adminStore.stats.avgOrderValue.amount) }}</span>
            <span class="text-xs font-bold text-amber-600 flex items-center gap-0.5 mb-1">
              <TrendingUp class="w-3 h-3" /> +{{ adminStore.stats.avgOrderValue.growth }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Main Chart Placeholder & Inventory Alerts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sales Velocity Chart Card -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-xl font-display font-bold">Sales Velocity</h3>
            <p class="text-xs text-slate-400">Growth trajectory over the last 30 business days.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span class="w-2 h-2 rounded-full bg-primary"></span> Revenue
            </div>
            <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span class="w-2 h-2 rounded-full bg-indigo-400"></span> Units
            </div>
          </div>
        </div>

        <!-- Placeholder for a larger chart -->
        <div class="h-[300px] flex items-end justify-between gap-2 px-2 mt-4">
          <div v-for="(v, i) in [45, 62, 54, 78, 92, 85, 70, 95, 110, 88, 105, 120, 115, 140, 130]" :key="i" class="flex-1 group relative">
            <div class="absolute inset-x-0 bottom-full mb-2 hidden group-hover:block z-10">
              <div class="bg-black text-white text-[10px] px-2 py-1 rounded-md mb-2 mx-auto w-fit font-bold whitespace-nowrap">
                ${{ (v * 100).toLocaleString() }}
              </div>
            </div>
            <div 
              class="w-full bg-primary/20 hover:bg-primary transition-all duration-300 rounded-t-lg"
              :style="{ height: `${(v / 140) * 100}%` }"
            ></div>
          </div>
        </div>
        <div class="flex justify-between mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-4">
          <span>01 May</span>
          <span>15 May</span>
          <span>30 May</span>
        </div>
      </div>

      <!-- Inventory Alerts -->
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-display font-bold">Stock Alerts</h3>
          <span class="bg-rose-100 dark:bg-rose-950/30 text-rose-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">{{ adminStore.inventoryAlerts.length }} Critical</span>
        </div>

        <div class="space-y-6">
          <div v-for="alert in adminStore.inventoryAlerts" :key="alert.productId" class="flex items-start gap-4 group">
            <div :class="cn(
              'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center',
              alert.status === 'out_of_stock' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/30'
            )">
              <Package class="w-5 h-5" />
            </div>
            <div class="flex-1 space-y-1">
              <h4 class="text-sm font-bold truncate">{{ alert.productName }}</h4>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Current: <span class="font-bold text-slate-900 dark:text-slate-100">{{ alert.currentStock }}</span></span>
                <span class="text-[10px] font-bold uppercase tracking-tighter" :class="alert.status === 'out_of_stock' ? 'text-rose-500' : 'text-amber-500'">
                  {{ alert.status.replace(/_/g, ' ') }}
                </span>
              </div>
              <div class="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded-full mt-2 overflow-hidden">
                <div 
                  class="h-full transition-all duration-1000" 
                  :class="alert.status === 'out_of_stock' ? 'bg-rose-500' : 'bg-amber-500'"
                  :style="{ width: `${(alert.currentStock / alert.threshold) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>

          <NuxtLink to="/admin/inventory" class="block text-center mt-6 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all">
            Full Inventory Report
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recent Orders Table Section -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm overflow-hidden">
      <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center">
            <Clock class="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 class="text-xl font-display font-bold">Recent Transactions</h3>
            <p class="text-xs text-slate-400">The latest 10 orders across your environment.</p>
          </div>
        </div>
        <NuxtLink to="/admin/orders" class="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
          Browse All Orders <ExternalLink class="w-3 h-3" />
        </NuxtLink>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">Order ID</th>
              <th class="px-8 py-5">Customer</th>
              <th class="px-8 py-5 text-right">Amount</th>
              <th class="px-8 py-5">Status</th>
              <th class="px-8 py-5">Date</th>
              <th class="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
            <tr v-for="order in adminStore.recentOrders" :key="order.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
              <td class="px-8 py-5">
                <span class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tighter">{{ order.orderNumber }}</span>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold">
                    {{ order.customerName.split(' ').map(n => n[0]).join('') }}
                  </div>
                  <span class="text-sm font-medium">{{ order.customerName }}</span>
                </div>
              </td>
              <td class="px-8 py-5 text-right">
                <span class="text-sm font-bold tracking-tight">{{ formatCurrency(order.totalAmount) }}</span>
              </td>
              <td class="px-8 py-5">
                <span :class="cn(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                  statusColors[order.status]
                )">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-8 py-5">
                <span class="text-xs text-slate-400">{{ new Date(order.createdAt).toLocaleDateString() }}</span>
              </td>
              <td class="px-8 py-5 text-right">
                <button class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  <MoreVertical class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

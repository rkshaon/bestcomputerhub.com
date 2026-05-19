<script setup lang="ts">
import { 
  Users, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp,
  Download,
  Package
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { formatCurrency } from '@/utils';
import DashboardStatCard from '@/features/admin/components/DashboardStatCard.vue';
import RecentOrdersTable from '@/features/admin/components/RecentOrdersTable.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: 'admin'
});

const adminStore = useAdminStore();

onMounted(() => {
  adminStore.fetchStats();
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">System Overview</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Command Center: TechCore Intelligence Protocol v4.2.1</p>
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

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardStatCard 
        label="Total Revenue"
        :value="formatCurrency(adminStore.stats.revenue.total)"
        :icon="DollarSign"
        :trend="adminStore.stats.revenue.growth"
        color="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
      />
      <DashboardStatCard 
        label="Completed Orders"
        :value="adminStore.stats.orders.total"
        :icon="ShoppingBag"
        :trend="adminStore.stats.orders.growth"
        color="bg-blue-100 dark:bg-blue-950/30 text-blue-600"
      />
      <DashboardStatCard 
        label="Market Reach"
        :value="adminStore.stats.customers.total.toLocaleString()"
        :icon="Users"
        :trend="adminStore.stats.customers.growth"
        color="bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600"
      />
      <DashboardStatCard 
        label="Avg Order Value"
        :value="formatCurrency(adminStore.stats.avgOrderValue.amount)"
        :icon="TrendingUp"
        :trend="adminStore.stats.avgOrderValue.growth"
        color="bg-amber-100 dark:bg-amber-950/30 text-amber-600"
      />
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

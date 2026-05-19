<script setup lang="ts">
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Download,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { formatCurrency, cn } from '@/utils';
import type { Order } from '@/types';

definePageMeta({
  layout: 'admin'
});

const adminStore = useAdminStore();
const searchQuery = ref('');
const statusFilter = ref('all');

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900' },
  processing: { icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900' },
  shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900' },
  refunded: { icon: RefreshCcw, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/20', border: 'border-slate-100 dark:border-slate-900' },
};

const orders = computed(() => {
  return adminStore.recentOrders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         o.customerName.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'all' || o.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Order Fulfilment</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Track and manage global enterprise transactions.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Download class="w-4 h-4" /> Bulk Export
        </button>
      </div>
    </div>

    <!-- Filters Area -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div class="flex-1 min-w-[300px] relative group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by Order ID or Customer Name..." 
          class="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
        />
      </div>

      <div class="flex items-center gap-3">
        <select 
          v-model="statusFilter"
          class="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold uppercase tracking-widest cursor-pointer appearance-none min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option v-for="(config, status) in statusConfig" :key="status" :value="status">
            {{ status.charAt(0).toUpperCase() + status.slice(1) }}
          </option>
        </select>

        <button class="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all">
          <Filter class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">
                <div class="flex items-center gap-2">Order Info <ArrowUpDown class="w-3 h-3" /></div>
              </th>
              <th class="px-8 py-5">Customer</th>
              <th class="px-8 py-5">Status</th>
              <th class="px-8 py-5">Payment</th>
              <th class="px-8 py-5 text-right">Total</th>
              <th class="px-8 py-5">Date</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
            <tr v-for="order in orders" :key="order.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
              <td class="px-8 py-5">
                <div class="flex flex-col">
                  <span class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tighter">{{ order.orderNumber }}</span>
                  <span class="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <Package class="w-2.5 h-2.5" /> {{ Math.floor(Math.random() * 5) + 1 }} Items
                  </span>
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold">
                    {{ order.customerName.split(' ').map(n => n[0]).join('') }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-bold">{{ order.customerName }}</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Enterprise Client</span>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5">
                <div :class="cn(
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors',
                  statusConfig[order.status].bg,
                  statusConfig[order.status].color,
                  statusConfig[order.status].border
                )">
                  <component :is="statusConfig[order.status].icon" class="w-3 h-3" />
                  {{ order.status }}
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                  <CreditCard class="w-3.5 h-3.5 text-slate-400" />
                  <span :class="cn(
                    'text-[10px] font-bold uppercase tracking-widest',
                    order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  )">
                    {{ order.paymentStatus === 'paid' ? 'Settled' : 'Pending' }}
                  </span>
                </div>
              </td>
              <td class="px-8 py-5 text-right">
                <span class="text-sm font-bold tracking-tight">{{ formatCurrency(order.totalAmount) }}</span>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-2 text-slate-400">
                  <Calendar class="w-3.5 h-3.5" />
                  <span class="text-xs font-medium">{{ new Date(order.createdAt).toLocaleDateString() }}</span>
                </div>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NuxtLink :to="`/admin/orders/${order.id}`" class="p-2 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm">
                    <Eye class="w-3.5 h-3.5" />
                  </NuxtLink>
                  <button class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm">
                    <MoreVertical class="w-3.5 h-3.5" />
                  </button>
                </div>
                <button class="p-2 text-slate-400 group-hover:hidden">
                  <MoreVertical class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-8 py-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <p class="text-xs text-slate-400 font-medium">Showing <span class="font-bold text-slate-900 dark:text-slate-100">1</span> to <span class="font-bold text-slate-900 dark:text-slate-100">3</span> of <span class="font-bold text-slate-900 dark:text-slate-100">{{ orders.length }}</span> orders</p>
        <div class="flex items-center gap-2">
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50" disabled>
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button class="w-10 h-10 flex items-center justify-center bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20">1</button>
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

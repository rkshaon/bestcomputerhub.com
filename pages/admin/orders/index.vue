<!-- File: /pages/admin/orders/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { refDebounced } from '@vueuse/core';
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
  Package
} from 'lucide-vue-next';
import { useSalesService } from '@/composables/useSalesService';
import { formatCurrency, cn } from '@/utils';
import type { Order, OrderStatusOption } from '@/types/order';
import KanbanBoard from '@/components/admin/orders/KanbanBoard.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';

definePageMeta({
  layout: 'admin'
});

const tableColumns: UiTableColumn<Order>[] = [
  { key: 'orderInfo', label: 'Order Info', sortable: true, headerClass: 'px-8', cellClass: 'px-8 py-5' },
  { key: 'customer', label: 'Customer', headerClass: 'px-8', cellClass: 'px-8 py-5' },
  { key: 'status', label: 'Status', headerClass: 'px-8', cellClass: 'px-8 py-5' },
  { key: 'payment', label: 'Payment', headerClass: 'px-8', cellClass: 'px-8 py-5' },
  { key: 'totalAmount', label: 'Total', align: 'right', headerClass: 'px-8', cellClass: 'px-8 py-5 text-right' },
  { key: 'createdAt', label: 'Date', headerClass: 'px-8', cellClass: 'px-8 py-5' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-8', cellClass: 'px-8 py-5 text-right' },
];

const salesService = useSalesService();
const orders = ref<Order[]>([]);
const totalCount = ref(0);
const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref('all');
const statuses = ref<OrderStatusOption[]>([]);
const viewMode = ref<'table' | 'kanban'>('table');

const currentPage = ref(1);
const itemsPerPage = ref(10);

const fetchOrders = async () => {
  const result = await salesService.getSales({
    page: currentPage.value,
    page_size: itemsPerPage.value
  });
  orders.value = result.results || [];
  totalCount.value = result.count || 0;
};

const fetchStatuses = async () => {
  try {
    const data = await salesService.getStatuses();
    statuses.value = data.statuses;
  } catch (err) {
    console.error('Failed to fetch order statuses', err);
  }
};

watch([currentPage, itemsPerPage, debouncedSearchQuery, statusFilter], fetchOrders);
onMounted(() => {
  fetchOrders();
  fetchStatuses();
});

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900' },
  processing: { icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900' },
  shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900' },
  refunded: { icon: RefreshCcw, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/20', border: 'border-slate-100 dark:border-slate-900' },
};

/** Resolves a badge style for any `OrderStatus`, falling back to pending for statuses without a dedicated style. */
const getStatusConfig = (status: Order['status']) =>
  statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);
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
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button @click="viewMode = 'table'" :class="cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-900')">Table</button>
          <button @click="viewMode = 'kanban'" :class="cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-900')">Kanban</button>
        </div>
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
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>

        <button class="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all" title="Filter orders" aria-label="Filter orders">
          <Filter class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Orders View -->
    <UiTable
      v-if="viewMode === 'table'"
      :columns="tableColumns"
      :data="orders"
      key-field="id"
    >
      <!-- Order Info -->
      <template #cell-orderInfo="{ item: order }">
        <div class="flex flex-col">
          <span class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tighter">{{ order.orderNumber }}</span>
          <span class="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
            <Package class="w-2.5 h-2.5" /> {{ order.itemCount }} Items
          </span>
        </div>
      </template>

      <!-- Customer -->
      <template #cell-customer="{ item: order }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold">
            {{ (order.customerName || 'NA').split(' ').filter(Boolean).map(n => n[0]).join('') }}
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold">{{ order.customerName }}</span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Enterprise Client</span>
          </div>
        </div>
      </template>

      <!-- Status -->
      <template #cell-status="{ item: order }">
        <div :class="cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors',
          getStatusConfig(order.status).bg,
          getStatusConfig(order.status).color,
          getStatusConfig(order.status).border
        )">
          <component :is="getStatusConfig(order.status).icon" class="w-3 h-3" />
          {{ order.status }}
        </div>
      </template>

      <!-- Payment -->
      <template #cell-payment="{ item: order }">
        <div class="flex items-center gap-2">
          <CreditCard class="w-3.5 h-3.5 text-slate-400" />
          <span :class="cn(
            'text-[10px] font-bold uppercase tracking-widest',
            order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
          )">
            {{ order.paymentStatus === 'paid' ? 'Settled' : 'Pending' }}
          </span>
        </div>
      </template>

      <!-- Total -->
      <template #cell-totalAmount="{ item: order }">
        <span class="text-sm font-bold tracking-tight">{{ formatCurrency(order.totalAmount) }}</span>
      </template>

      <!-- Date -->
      <template #cell-createdAt="{ item: order }">
        <div class="flex items-center gap-2 text-slate-400">
          <Calendar class="w-3.5 h-3.5" />
          <span class="text-xs font-medium">{{ new Date(order.createdAt).toLocaleDateString() }}</span>
        </div>
      </template>

      <!-- Actions -->
      <template #cell-actions="{ item: order }">
        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <NuxtLink :to="`/admin/orders/${order.id}`" class="p-2 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm" title="View order details" aria-label="View order details">
            <Eye class="w-3.5 h-3.5" />
          </NuxtLink>
          <button class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm cursor-pointer" title="More options" aria-label="More options">
            <MoreVertical class="w-3.5 h-3.5" />
          </button>
        </div>
        <button class="p-2 text-slate-400 group-hover:hidden cursor-pointer" title="More options" aria-label="More options">
          <MoreVertical class="w-4 h-4" />
        </button>
      </template>

      <!-- Pagination -->
      <template #footer>
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :items-per-page="itemsPerPage"
          item-label="orders"
        />
      </template>
    </UiTable>
    <KanbanBoard v-else :orders="orders" :statuses="statuses" />
  </div>
</template>

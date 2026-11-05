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
  Package,
  LayoutGrid,
  List,
  X
} from 'lucide-vue-next';
import { useSalesService } from '@/composables/useSalesService';
import { formatCurrency, cn, formatDate } from '@/utils';
import type { Order, OrderStatusOption } from '@/types/order';
import KanbanBoard from '@/components/admin/orders/KanbanBoard.vue';
import OrderStatistics from '@/components/admin/orders/OrderStatistics.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/Button.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';

definePageMeta({
  layout: false
});

useSeoMeta({ title: 'Order Fulfilment', robots: 'noindex, nofollow' });

const tableColumns: UiTableColumn<Order>[] = [
  { key: 'orderInfo', label: 'Order Info', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'customer', label: 'Customer', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'status', label: 'Status', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'payment', label: 'Payment', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'totalAmount', label: 'Total', align: 'right', headerClass: 'px-6 py-4 text-right whitespace-nowrap', cellClass: 'px-6 py-4 text-right whitespace-nowrap' },
  { key: 'createdAt', label: 'Date', headerClass: 'px-6 py-4 whitespace-nowrap', cellClass: 'px-6 py-4 whitespace-nowrap' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-6 py-4 text-right whitespace-nowrap', cellClass: 'px-6 py-4 text-right whitespace-nowrap' },
];

const route = useRoute();
const router = useRouter();

const salesService = useSalesService();
const orders = ref<Order[]>([]);
const totalCount = ref(0);
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref(route.query.status ? String(route.query.status) : 'all');
const statuses = ref<OrderStatusOption[]>([]);
const transitions = ref<Record<string, string[]>>({});
const viewMode = ref<'table' | 'kanban'>('table');
const statsRef = ref<InstanceType<typeof OrderStatistics> | null>(null);

const navigateToOrder = (order: Order) => router.push(`/admin/orders/${order.id}`);

const isLoading = ref(false);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      page_size: itemsPerPage.value
    };
    if (debouncedSearchQuery.value.trim()) {
      params.search = debouncedSearchQuery.value.trim();
    }
    if (statusFilter.value && statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }
    const result = await salesService.getSales(params);
    orders.value = result.results || [];
    totalCount.value = result.count || 0;
  } catch (err: any) {
    console.error('Failed to fetch orders:', err);
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const query: Record<string, any> = { ...route.query };

  if (debouncedSearchQuery.value.trim()) query.search = debouncedSearchQuery.value.trim();
  else delete query.search;

  if (statusFilter.value && statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (currentPage.value > 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
  fetchOrders();
};

const fetchStatuses = async () => {
  try {
    const data = await salesService.getStatuses();
    statuses.value = data.statuses;
    transitions.value = data.transitions;
  } catch (err) {
    console.error('Failed to fetch order statuses', err);
  }
};

// Reset page index to 1 when filters or itemsPerPage change
watch([debouncedSearchQuery, statusFilter, itemsPerPage], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    updateRouteAndFetch();
  }
});

// Fetch active page data when currentPage changes
watch(currentPage, () => {
  updateRouteAndFetch();
});

// Sync state from URL query parameter changes (e.g. browser back/forward navigation)
watch(() => route.query, async (newQuery) => {
  let needsFetch = false;

  const newSearch = newQuery.search ? String(newQuery.search) : '';
  if (searchQuery.value !== newSearch) {
    searchQuery.value = newSearch;
    needsFetch = true;
  }

  const newStatus = newQuery.status ? String(newQuery.status) : 'all';
  if (statusFilter.value !== newStatus) {
    statusFilter.value = newStatus;
    needsFetch = true;
  }

  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) {
    currentPage.value = newPage;
    needsFetch = true;
  }

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 10 : 10;
  if (itemsPerPage.value !== newPageSize) {
    itemsPerPage.value = newPageSize;
    needsFetch = true;
  }

  if (needsFetch) {
    await fetchOrders();
  }
});

onMounted(() => {
  fetchOrders();
  fetchStatuses();
});

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  processing: { icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  refunded: { icon: RefreshCcw, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const getStatusConfig = (status: Order['status']) =>
  statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;

const clearFilters = () => { searchQuery.value = ''; statusFilter.value = 'all'; };
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-2xl font-display font-extrabold tracking-tight text-foreground">Order Fulfilment</h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 font-bold text-xs" @click="() => { fetchOrders(); statsRef?.refresh(); }" :disabled="isLoading">
          <RefreshCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      <OrderStatistics ref="statsRef" :statuses="statuses" />
      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <UiSearchInput v-model="searchQuery" placeholder="Search orders..." class="w-full sm:w-72" />
          
          <div class="flex items-center bg-muted/60 p-1 rounded-lg border border-border/80">
            <button @click="viewMode = 'table'" :class="cn('h-7 w-7 rounded-md flex items-center justify-center transition-all', viewMode === 'table' ? 'bg-background text-primary shadow-2xs' : 'text-muted-foreground hover:text-foreground')" title="Table View"><List class="w-3.5 h-3.5" /></button>
            <button @click="viewMode = 'kanban'" :class="cn('h-7 w-7 rounded-md flex items-center justify-center transition-all', viewMode === 'kanban' ? 'bg-background text-primary shadow-2xs' : 'text-muted-foreground hover:text-foreground')" title="Kanban View"><LayoutGrid class="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <select v-model="statusFilter" class="h-9 px-3 bg-background border border-input rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-ring/20">
            <option value="all">All Statuses</option>
            <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
          </select>
          <div class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select v-model="itemsPerPage" class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer">
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
              <option :value="1000">1000 / page</option>
            </select>
          </div>
          <button v-if="searchQuery || statusFilter !== 'all'" @click="clearFilters" class="text-muted-foreground hover:text-foreground text-xs font-bold p-2" title="Clear Filters"><X class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Table View -->
      <UiTable v-if="viewMode === 'table'" :columns="tableColumns" :data="orders" :loading="isLoading" key-field="id" @row-click="navigateToOrder" row-class="cursor-pointer">
        <template #cell-orderInfo="{ item: order }">
          <div class="flex flex-col"><span class="font-mono text-xs font-bold tracking-tighter">{{ order.orderNumber }}</span></div>
        </template>
        <template #cell-customer="{ item: order }">
          <div class="flex flex-col"><span class="text-sm font-bold">{{ order.customerName }}</span><span class="text-[10px] text-muted-foreground">Client</span></div>
        </template>
        <template #cell-status="{ item: order }">
          <div :class="cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', getStatusConfig(order.status).bg, getStatusConfig(order.status).color, getStatusConfig(order.status).border)">
            <component :is="getStatusConfig(order.status).icon" class="w-3 h-3" />
            {{ order.status }}
          </div>
        </template>
        <template #cell-payment="{ item: order }">
          <span :class="cn('text-[10px] font-bold uppercase tracking-widest', order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600')">{{ order.paymentStatus }}</span>
        </template>
        <template #cell-totalAmount="{ item: order }"><span class="text-sm font-bold">{{ formatCurrency(order.totalAmount) }}</span></template>
        <template #cell-createdAt="{ item: order }"><span class="text-xs text-muted-foreground">{{ formatDate(order.createdAt) }}</span></template>
        <template #cell-actions="{ item: order }">
          <div class="flex items-center justify-end gap-1">
            <NuxtLink :to="`/admin/orders/${order.id}`" class="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View details" aria-label="View details"><Eye class="w-4 h-4" /></NuxtLink>
            <button class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="More options" aria-label="More options" @click.stop><MoreVertical class="w-4 h-4" /></button>
          </div>
        </template>
        <template #footer><UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="orders" /></template>
      </UiTable>

      <!-- Kanban View -->
      <KanbanBoard v-else :orders="orders" :statuses="statuses" :transitions="transitions || {}" :update-status="salesService.updateStatus" @status-updated="fetchOrders" />
    </div>
  </NuxtLayout>
</template>

<!-- File: /pages/admin/customers/index.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  ArrowUpDown,
  UserPlus,
  TrendingUp
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { formatCurrency, cn } from '@/utils';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import type { Customer } from '@/types';

definePageMeta({
  layout: 'admin'
});

const tableColumns: UiTableColumn<Customer>[] = [
  { key: 'name', label: 'Client Name', headerClass: 'px-8', cellClass: 'px-8' },
  { key: 'status', label: 'Status', headerClass: 'px-8', cellClass: 'px-8' },
  { key: 'totalOrders', label: 'Orders', headerClass: 'px-8', cellClass: 'px-8' },
  { key: 'totalSpent', label: 'Total Spent', headerClass: 'px-8', cellClass: 'px-8' },
  { key: 'joinedAt', label: 'Last Activity', headerClass: 'px-8', cellClass: 'px-8' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-8', cellClass: 'px-8' },
];

const adminStore = useAdminStore();
const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const currentPage = ref(1);
const itemsPerPage = ref(10);

const filteredCustomers = computed(() => {
  return adminStore.customers.filter(c => {
    const query = debouncedSearchQuery.value.toLowerCase().trim();
    return !query || c.name.toLowerCase().includes(query) || 
           c.email.toLowerCase().includes(query);
  });
});

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
});

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage.value) || 1);

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredCustomers.value.slice(start, start + itemsPerPage.value);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Customer Relationship</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Unified view of your enterprise client base and their engagement.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <UserPlus class="w-4 h-4" /> Add Manual Client
        </button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
        <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <h4 class="text-indigo-100 text-[10px] uppercase tracking-widest font-bold mb-2">Active Retention</h4>
        <div class="text-3xl font-display font-black tracking-tight mb-1">94.2%</div>
        <p class="text-xs text-indigo-100/60 font-bold">+2.4% from last quarter</p>
      </div>
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
        <h4 class="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">New Acquisitions</h4>
        <div class="text-3xl font-display font-black tracking-tight mb-1">428</div>
        <p class="text-xs text-emerald-600 font-bold flex items-center gap-1">
          <TrendingUp class="w-3 h-3" /> 18% Monthly Growth
        </p>
      </div>
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
        <h4 class="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">Avg. LTV</h4>
        <div class="text-3xl font-display font-black tracking-tight mb-1">{{ formatCurrency(4250) }}</div>
        <p class="text-xs text-slate-400 font-bold">Projected Enterprise Average</p>
      </div>
    </div>

    <!-- Filters & Table Section -->
    <UiTable
      :columns="tableColumns"
      :data="paginatedCustomers"
      key-field="id"
    >
      <!-- Header Slot for Search and Filters -->
      <template #header>
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1 relative group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Filter customers by name, email, or domain..." 
              class="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
            />
          </div>
          <div class="flex items-center gap-3">
            <button class="h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 cursor-pointer">
              <Filter class="w-4 h-4" /> Advanced Filter
            </button>
          </div>
        </div>
      </template>

      <!-- Client Name Column -->
      <template #cell-name="{ item: customer }">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:text-primary transition-colors">
            {{ customer.name.split(' ').map(n => n[0]).join('') }}
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold">{{ customer.name }}</span>
            <span class="text-[10px] text-slate-400 font-medium">{{ customer.email }}</span>
          </div>
        </div>
      </template>

      <!-- Status Column -->
      <template #cell-status="{ item: customer }">
        <span :class="cn(
          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
          customer.status === 'active' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-slate-50 text-slate-400'
        )">
          {{ customer.status }}
        </span>
      </template>

      <!-- Orders Column -->
      <template #cell-totalOrders="{ item: customer }">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-xs font-bold">{{ customer.totalOrders }} Orders</span>
        </div>
      </template>

      <!-- Total Spent Column -->
      <template #cell-totalSpent="{ item: customer }">
        <div class="text-sm font-bold tracking-tight">{{ formatCurrency(customer.totalSpent) }}</div>
      </template>

      <!-- Last Activity Column -->
      <template #cell-joinedAt="{ item: customer }">
        <div class="flex items-center gap-2 text-slate-400">
          <Calendar class="w-3.5 h-3.5" />
          <span class="text-xs font-medium">{{ new Date(customer.joinedAt).toLocaleDateString() }}</span>
        </div>
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item: customer }">
        <div class="flex items-center justify-end gap-1 font-medium">
          <button class="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer" title="Send email" aria-label="Send email">
            <Mail class="w-4 h-4" />
          </button>
          <button class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer" title="More options" aria-label="More options">
            <MoreVertical class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- Pagination Footer -->
      <template #footer>
        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="filteredCustomers.length"
          :items-per-page="itemsPerPage"
          item-label="customers"
        />
      </template>
    </UiTable>
  </div>
</template>

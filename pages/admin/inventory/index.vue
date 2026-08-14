<!-- File: /pages/admin/inventory/index.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowUpDown,
  Plus,
  Minus,
  Save,
  RotateCcw,
  History,
  TrendingDown,
  MoreHorizontal,
  Loader2
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { useProductService } from '@/composables/useProductService';
import { formatCurrency, cn } from '@/utils';
import type { Product, InventoryAlert } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';

definePageMeta({
  layout: 'admin'
});

const tableColumns: UiTableColumn<Product>[] = [
  { key: 'name', label: 'Product Matrix', headerClass: 'px-8', cellClass: 'px-8 py-6' },
  { key: 'sku', label: 'Logistics SKU', headerClass: 'px-8', cellClass: 'px-8 py-6' },
  { key: 'stock', label: 'Current Volume', headerClass: 'px-8', cellClass: 'px-8 py-6' },
  { key: 'status', label: 'Health Status', headerClass: 'px-8', cellClass: 'px-8 py-6' },
  { key: 'actions', label: 'Operations', align: 'right', headerClass: 'px-8', cellClass: 'px-8 py-6' },
];

const adminStore = useAdminStore();
const productService = useProductService();

// Icons for dynamic rendering
const iconMap = {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  History
};

const allProducts = ref<Product[]>(productService.getProducts());
const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const stockStatusFilter = ref('all');

const currentPage = ref(1);
const itemsPerPage = ref(10);

// UI State
const editingId = ref<string | null>(null);
const editStock = ref<number>(0);
const isUpdating = ref(false);

const filteredProducts = computed(() => {
  return allProducts.value.filter(product => {
    const query = debouncedSearchQuery.value.toLowerCase().trim();
    const matchesSearch = !query || product.name.toLowerCase().includes(query) || 
                         product.sku.toLowerCase().includes(query);
    
    const status = getStockStatus(product.stock);
    const matchesStatus = stockStatusFilter.value === 'all' || status === stockStatusFilter.value;
    
    return matchesSearch && matchesStatus;
  });
});

watch([debouncedSearchQuery, stockStatusFilter], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value) || 1);

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredProducts.value.slice(start, start + itemsPerPage.value);
});

const stats = computed(() => {
  const total = allProducts.value.length;
  const lowStock = allProducts.value.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStock = allProducts.value.filter(p => p.stock === 0).length;
  
  return [
    { label: 'Total SKU count', value: total, iconKey: 'Package', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30' },
    { label: 'Low stock items', value: lowStock, iconKey: 'AlertTriangle', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/30' },
    { label: 'Out of stock', value: outOfStock, iconKey: 'XCircle', color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/30' },
  ];
});

function getStockStatus(stock: number) {
  if (stock === 0) return 'out';
  if (stock < 10) return 'low';
  return 'healthy';
}

function startEditing(product: Product) {
  editingId.value = product.id;
  editStock.value = product.stock;
}

function cancelEditing() {
  editingId.value = null;
}

async function updateStock(product: Product) {
  isUpdating.value = true;
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const p = allProducts.value.find(p => p.id === product.id);
    if (p) p.stock = editStock.value;
    editingId.value = null;
  } finally {
    isUpdating.value = false;
  }
}

function adjustStock(amount: number) {
  editStock.value = Math.max(0, editStock.value + amount);
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Real-time Inventory Console
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Stock Logistics</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Monitor and manage high-performance hardware availability across regions.</p>
      </div>
      <div class="flex items-center gap-3">
        <UiButton variant="outline" class="rounded-2xl gap-2 font-bold text-xs uppercase tracking-widest px-6">
          <History class="w-4 h-4" /> Stock History
        </UiButton>
        <UiButton class="rounded-2xl gap-2 font-bold text-xs uppercase tracking-widest px-6 shadow-xl shadow-primary/20">
          <TrendingDown class="w-4 h-4" /> Reports
        </UiButton>
      </div>
    </div>

    <!-- Quick Stats Bento -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard v-for="stat in stats" :key="stat.label" class="flex items-center gap-6 p-8 group border-transparent hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
        <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
           <component :is="iconMap[stat.iconKey as keyof typeof iconMap]" class="w-32 h-32 rotate-12" />
        </div>
        
        <div :class="cn('w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500', stat.color)">
          <component :is="iconMap[stat.iconKey as keyof typeof iconMap]" class="w-8 h-8" />
        </div>
        <div class="relative z-10">
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-display font-black tracking-tighter">{{ stat.value }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Main Inventory Control -->
    <div class="space-y-6">
      <!-- Search and Filter Bar -->
      <div class="flex flex-col lg:flex-row gap-4 items-center">
        <div class="flex-1 w-full relative group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Filter by SKU, product name, or logistics code..." 
            class="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium shadow-sm"
          />
        </div>
        
        <div class="flex items-center gap-3 w-full lg:w-auto">
          <select 
            v-model="stockStatusFilter"
            class="flex-1 lg:w-48 h-14 px-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-primary/5 text-xs font-bold uppercase tracking-widest cursor-pointer appearance-none shadow-sm"
          >
            <option value="all">All Inventory</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Low Warning</option>
            <option value="out">Critical (0)</option>
          </select>
          
          <UiButton variant="outline" class="h-14 w-14 rounded-[1.25rem] p-0 shadow-sm">
            <Filter class="w-5 h-5" />
          </UiButton>
        </div>
      </div>

      <!-- Inventory Alerts Alert Box (if any) -->
      <div v-if="adminStore.inventoryAlerts.length > 0" class="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-[1.5rem] p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest">Supply Chain Disruption Detected</h3>
            <p class="text-xs text-rose-700 dark:text-rose-500/80 mt-1 font-medium italic">The following high-demand components require immediate replenishment to maintain service level agreements.</p>
            <div class="mt-4 flex flex-wrap gap-4">
              <div v-for="alert in adminStore.inventoryAlerts" :key="alert.productId" class="flex items-center gap-3 bg-white dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm">
                <span class="text-[10px] font-bold text-slate-500">{{ alert.productName }}</span>
                <span :class="cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter', alert.status === 'out_of_stock' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white')">
                  {{ alert.currentStock }} Left
                </span>
                <UiButton variant="ghost" size="sm" class="h-6 px-2 text-[10px] font-bold hover:bg-rose-100">Restock</UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <UiTable
        :columns="tableColumns"
        :data="paginatedProducts"
        key-field="id"
        wrapper-class="overflow-x-auto text-nowrap"
      >
        <!-- Product Details -->
        <template #cell-name="{ item: product }">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shrink-0 overflow-hidden">
              <img :src="product.images[0]" class="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <p class="text-sm font-bold tracking-tight">{{ product.name }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{{ product.category }} • {{ product.brand }}</p>
            </div>
          </div>
        </template>

        <!-- SKU -->
        <template #cell-sku="{ item: product }">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
              <Package class="w-3.5 h-3.5" />
            </div>
            <code class="text-xs font-mono font-bold text-slate-500 tracking-tighter">{{ product.sku }}</code>
          </div>
        </template>

        <!-- Current Volume -->
        <template #cell-stock="{ item: product }">
          <div v-if="editingId === product.id" class="flex items-center gap-3 animate-in zoom-in-95">
            <div class="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 h-10 shadow-inner">
              <button @click="adjustStock(-1)" class="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer" title="Decrease stock" aria-label="Decrease stock">
                <Minus class="w-4 h-4" />
              </button>
              <input 
                v-model.number="editStock" 
                type="number" 
                class="w-14 text-center bg-transparent border-none outline-none font-black text-sm"
              />
              <button @click="adjustStock(1)" class="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer" title="Increase stock" aria-label="Increase stock">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center gap-1.5">
              <button 
                @click="updateStock(product)" 
                class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                :disabled="isUpdating"
                title="Save stock level"
                aria-label="Save stock level"
              >
                <Save v-if="!isUpdating" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </button>
              <button 
                @click="cancelEditing" 
                class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer"
                :disabled="isUpdating"
                title="Cancel stock editing"
                aria-label="Cancel stock editing"
              >
                <RotateCcw class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div v-else class="flex flex-col gap-2 min-w-[140px]">
            <div class="flex items-baseline gap-1.5">
              <span :class="cn('text-lg font-black tracking-tighter transition-colors duration-500', 
                product.stock === 0 ? 'text-rose-600' : product.stock < 10 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
              )">
                {{ product.stock }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Reserved</span>
            </div>
            <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
              <div 
                :class="cn(
                  'h-full rounded-full transition-all duration-1000 ease-out', 
                  product.stock === 0 ? 'bg-rose-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-primary'
                )"
                :style="{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
        </template>

        <!-- Status Decorator -->
        <template #cell-status="{ item: product }">
          <div class="flex items-center gap-2">
            <component 
              :is="getStockStatus(product.stock) === 'out' ? XCircle : getStockStatus(product.stock) === 'low' ? AlertTriangle : CheckCircle2" 
              :class="cn('w-4 h-4', 
                getStockStatus(product.stock) === 'out' ? 'text-rose-500' : getStockStatus(product.stock) === 'low' ? 'text-amber-500' : 'text-emerald-500'
              )"
            />
            <span :class="cn('text-[10px] font-black uppercase tracking-widest', 
              getStockStatus(product.stock) === 'out' ? 'text-rose-600' : getStockStatus(product.stock) === 'low' ? 'text-amber-600' : 'text-emerald-600'
            )">
              {{ getStockStatus(product.stock) === 'out' ? 'DEPLETED' : getStockStatus(product.stock) === 'low' ? 'CRITICAL LIMIT' : 'OPTIMAL' }}
            </span>
          </div>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item: product }">
          <div v-if="editingId !== product.id" class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <UiButton 
              variant="outline" 
              size="sm" 
              class="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-white dark:bg-slate-950"
              @click="startEditing(product)"
            >
              <Plus class="w-3 h-3" /> Update Stock
            </UiButton>
            <button class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer" title="More options" aria-label="More options">
              <MoreHorizontal class="w-4 h-4" />
            </button>
          </div>
        </template>

        <!-- Pagination -->
        <template #footer>
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="filteredProducts.length"
            :items-per-page="itemsPerPage"
            item-label="products"
          />
        </template>
      </UiTable>
    </div>
  </div>
</template>

<style scoped>
/* Custom style for number inputs to hide arrows in different browsers */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>

<!-- File: /pages/admin/products/index.vue -->
<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  Download,
  Package,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { formatCurrency, cn } from '@/utils';
import type { Product } from '@/types';

definePageMeta({
  layout: 'admin'
});

const productService = useProductService();
const { canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

const canCreateProduct = computed(() => canCreateInModule('/admin/products'));
const canEditProduct = computed(() => canEditInModule('/admin/products'));
const canDeleteProduct = computed(() => canDeleteInModule('/admin/products'));

const products = ref<Product[]>(productService.getProducts());
const searchQuery = ref('');
const statusFilter = ref('all');
const categoryFilter = ref('all');

const filteredProducts = computed(() => {
  return products.value.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = categoryFilter.value === 'all' || p.category === categoryFilter.value;
    return matchesSearch && matchesCategory;
  });
});

const categories = [...new Set(products.value.map((p: Product) => p.category))];

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this product?')) {
    products.value = products.value.filter(p => p.id !== id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Action Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Catalog Management</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Configure and manage your high-performance hardware inventory.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Download class="w-4 h-4" /> Export CSV
        </button>
        <button v-if="canCreateProduct" class="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <Plus class="w-4 h-4" /> Add New Product
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
          placeholder="Search by name, SKU, or category..." 
          class="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
        />
      </div>

      <div class="flex items-center gap-3">
        <select 
          v-model="categoryFilter"
          class="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold uppercase tracking-widest cursor-pointer appearance-none"
        >
          <option value="all">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <button class="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all" title="Filter products" aria-label="Filter products">
          <Filter class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">
                <div class="flex items-center gap-2 cursor-pointer hover:text-slate-600">
                  Product Details <ArrowUpDown class="w-3 h-3" />
                </div>
              </th>
              <th class="px-8 py-5">SKU</th>
              <th class="px-8 py-5">Category</th>
              <th class="px-8 py-5 text-right">Price</th>
              <th class="px-8 py-5">Inventory</th>
              <th class="px-8 py-5">Status</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
            <tr v-for="product in filteredProducts" :key="product.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                    <img :src="product.images[0]" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold truncate group-hover:text-primary transition-colors">{{ product.name }}</p>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{{ product.brand }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5">
                <span class="font-mono text-xs font-bold text-slate-500 tracking-tighter">{{ product.sku }}</span>
              </td>
              <td class="px-8 py-5">
                 <div class="flex items-center gap-2">
                   <Layers class="w-3 h-3 text-slate-400" />
                   <span class="text-xs font-medium">{{ product.category }}</span>
                 </div>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="text-sm font-bold tracking-tight">{{ formatCurrency(product.price) }}</div>
                <div v-if="product.originalPrice" class="text-[10px] text-rose-500 line-through font-bold">{{ formatCurrency(product.originalPrice) }}</div>
              </td>
              <td class="px-8 py-5">
                <div class="flex flex-col gap-1.5 min-w-[100px]">
                  <div class="flex justify-between text-[10px] font-bold">
                    <span :class="product.stock < 10 ? 'text-rose-500' : 'text-slate-500'">{{ product.stock }} units</span>
                    <span class="text-slate-400">/ 100</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      :class="cn(
                        'h-full rounded-full transition-all duration-500', 
                        product.stock < 10 ? 'bg-rose-500' : product.stock < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      )"
                      :style="{ width: `${Math.min(product.stock, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5">
                <span :class="cn(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                  product.stock > 0 ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-rose-50/50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900'
                )">
                  {{ product.stock > 0 ? 'Active' : 'Out of Stock' }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NuxtLink :to="`/admin/products/${product.id}`" class="p-2 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm" title="Edit product" aria-label="Edit product">
                    <Edit2 class="w-3.5 h-3.5" />
                  </NuxtLink>
                  <button @click="handleDelete(product.id)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm" title="Delete product" aria-label="Delete product">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
                <button class="p-2 text-slate-400 group-hover:hidden" title="More options" aria-label="More options">
                  <MoreVertical class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-8 py-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <p class="text-xs text-slate-400 font-medium">Showing <span class="font-bold text-slate-900 dark:text-slate-100">1</span> to <span class="font-bold text-slate-900 dark:text-slate-100">10</span> of <span class="font-bold text-slate-900 dark:text-slate-100">{{ filteredProducts.length }}</span> products</p>
        <div class="flex items-center gap-2">
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50" disabled title="Previous page" aria-label="Previous page">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button class="w-10 h-10 flex items-center justify-center bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20">1</button>
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">2</button>
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">3</button>
          <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100" title="Next page" aria-label="Next page">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

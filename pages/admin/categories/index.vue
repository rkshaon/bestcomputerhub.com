<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Layers, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Box,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { cn } from '@/utils';
import type { Category, Product } from '@/types';

definePageMeta({
  layout: 'admin'
});

const productService = useProductService();
const categories = ref<Category[]>(productService.getCategories());
const products = productService.getProducts();
const searchQuery = ref('');

const getProductCount = (categoryName: string) => {
  return products.filter(p => p.category === categoryName).length;
};

const filteredCategories = computed(() => {
  return categories.value.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this category? This may affect products assigned to it.')) {
    categories.value = categories.value.filter(c => c.id !== id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Category Architecture</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Organize your enterprise catalog with precise taxonomies.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <Plus class="w-4 h-4" /> Define New Category
        </button>
      </div>
    </div>

    <!-- Taxonomy Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm flex items-center gap-6">
        <div class="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <Layers class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Classes</p>
          <p class="text-2xl font-display font-black tracking-tight">{{ categories.length }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm flex items-center gap-6">
        <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
          <Box class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Mapped Products</p>
          <p class="text-2xl font-display font-black tracking-tight">{{ products.length }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm flex items-center gap-6">
        <div class="w-14 h-14 bg-amber-100 dark:bg-amber-950/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
          <ChevronDown class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sub-Categories</p>
          <p class="text-2xl font-display font-black tracking-tight">{{ categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0) }}</p>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div class="flex-1 min-w-[300px] relative group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Filter taxonomies by name or description..." 
          class="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
        />
      </div>
      <button class="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all">
        <Filter class="w-5 h-5" />
      </button>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="category in filteredCategories" :key="category.id" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm group hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
        <!-- Visual Header -->
        <div class="h-32 bg-slate-100 dark:bg-slate-900 relative overflow-hidden shrink-0">
          <img v-if="category.image" :src="category.image" class="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent"></div>
          <div class="absolute bottom-4 left-6 flex items-center gap-3">
             <div class="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 text-primary">
                <span v-if="category.icon" class="text-2xl">{{ category.icon }}</span>
                <Layers v-else class="w-6 h-6" />
             </div>
             <div>
               <h3 class="text-lg font-display font-bold leading-tight">{{ category.name }}</h3>
               <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Domain ID: {{ category.slug }}</p>
             </div>
          </div>
          <div class="absolute top-4 right-4">
            <button class="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
               <MoreVertical class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
            {{ category.description || 'No detailed architecture description provided for this catalog branch.' }}
          </p>

          <div class="mt-auto space-y-4">
             <!-- Sub-category Chips -->
             <div v-if="category.subCategories?.length" class="flex flex-wrap gap-2">
                <span v-for="sub in category.subCategories.slice(0, 3)" :key="sub" class="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                  {{ sub }}
                </span>
                <span v-if="category.subCategories.length > 3" class="text-[10px] font-bold text-slate-400 py-1">
                  +{{ category.subCategories.length - 3 }} more
                </span>
             </div>

             <div class="pt-4 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between">
                <div class="flex items-center gap-2">
                   <Box class="w-3.5 h-3.5 text-slate-400" />
                   <span class="text-xs font-bold">{{ getProductCount(category.name) }} Resources</span>
                </div>
                <div class="flex items-center gap-1">
                   <button class="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                      <Edit2 class="w-3.5 h-3.5" />
                   </button>
                   <button @click="handleDelete(category.id)" class="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                      <Trash2 class="w-3.5 h-3.5" />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Add New Category Terminal Card -->
      <button class="bg-slate-50/50 dark:bg-slate-900/10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group min-h-[300px]">
        <div class="w-16 h-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          <Plus class="w-8 h-8" />
        </div>
        <div class="text-center">
          <p class="font-display font-bold text-lg">Extend Catalog</p>
          <p class="text-xs font-medium opacity-60">Add a new taxonomy domain</p>
        </div>
      </button>
    </div>

    <!-- Pagination -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
      <p class="text-xs text-slate-400 font-medium tracking-tight">Active Nodes: <span class="font-bold text-slate-900 dark:text-slate-100">{{ filteredCategories.length }} / {{ categories.length }}</span></p>
      <div class="flex items-center gap-2">
        <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30" disabled>
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button class="w-10 h-10 flex items-center justify-center bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20">1</button>
        <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30" disabled>
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

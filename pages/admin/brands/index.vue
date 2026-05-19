<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Flag, 
  ChevronRight,
  ChevronLeft,
  Globe,
  Award,
  ShieldCheck,
  Zap,
  Tag,
  BarChart3
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { cn } from '@/utils';
import type { Brand } from '@/types';
import { markRaw } from 'vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';

definePageMeta({
  layout: 'admin'
});

const productService = useProductService();
const allBrands = ref<Brand[]>(productService.getBrands());
const searchQuery = ref('');

const filteredBrands = computed(() => {
  return allBrands.value.filter(b => 
    b.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleDelete = (id: string) => {
  if (confirm('Verify: Are you sure you want to decommission this brand entry? This action is logged in the system protocol.')) {
    allBrands.value = allBrands.value.filter(b => b.id !== id);
  }
};

const stats = computed(() => [
  { label: 'Registered Brands', value: allBrands.value.length, icon: markRaw(Flag), color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Active Domains', value: 4, icon: markRaw(Globe), color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Premium Tier', value: 2, icon: markRaw(Award), color: 'bg-amber-100 text-amber-600' },
]);
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-display font-extrabold tracking-tight">Brand Registry</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and audit institutional hardware partners.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <Plus class="w-4 h-4" /> Initialize New Brand
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard v-for="stat in stats" :key="stat.label" class="flex items-center gap-6 p-8">
        <div :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner', stat.color)">
          <component :is="stat.icon" class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-display font-black tracking-tight">{{ stat.value }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Search and Control Layer -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div class="flex-1 min-w-[300px]">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Filter registry by brand name or technical description..." 
          class="border-none bg-transparent"
        />
      </div>
      <div class="flex items-center gap-2 pr-2 border-l border-slate-100 dark:border-slate-900 pl-4">
        <button class="h-10 px-4 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          <Filter class="w-4 h-4" /> Technical Stats
        </button>
        <div class="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
        <button class="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors">
          <BarChart3 class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Brands Registry Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <UiCard v-for="brand in filteredBrands" :key="brand.id" padding="none" class="group hover:border-primary/40 transition-all duration-500 flex flex-col h-full">
        <div class="p-8 pb-4 flex-1">
          <!-- Logo & Tier -->
          <div class="flex items-start justify-between mb-8">
            <div class="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center p-2 shadow-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              <img :src="brand.logo" :alt="brand.name" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <UiBadge variant="secondary" size="xs">{{ brand.slug }}</UiBadge>
          </div>

          <!-- Brand Content -->
          <div class="space-y-2 mb-6">
            <h3 class="text-xl font-display font-black tracking-tight group-hover:text-primary transition-colors">{{ brand.name }}</h3>
            <p class="text-xs text-slate-400 font-medium leading-relaxed italic">"{{ brand.description }}"</p>
          </div>

          <!-- Technical Metrics -->
          <div class="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-900">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Tag class="w-3.5 h-3.5 text-slate-300" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inventory Units</span>
              </div>
              <span class="text-sm font-black text-slate-900 dark:text-slate-100">{{ brand.productCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-500/50" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance Rate</span>
              </div>
              <span class="text-sm font-black text-emerald-500">99.8%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Zap class="w-3.5 h-3.5 text-amber-500/50" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supply Priority</span>
              </div>
              <UiBadge variant="primary" size="xs">High</UiBadge>
            </div>
          </div>
        </div>

        <!-- Action Layer -->
        <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 mt-auto flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
          <div class="flex items-center gap-1">
            <button class="p-2 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
              <Edit2 class="w-4 h-4" />
            </button>
            <button @click="handleDelete(brand.id)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <button class="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            Audit Protocol <ChevronRight class="w-3 h-3" />
          </button>
        </div>
      </UiCard>

      <!-- Initialization Portal (Add New) -->
      <button class="group bg-slate-50/50 dark:bg-slate-900/10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 text-slate-400 hover:border-primary hover:bg-primary/5 transition-all duration-500 min-h-[380px]">
        <div class="w-20 h-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 text-slate-300 group-hover:text-primary group-hover:shadow-xl group-hover:shadow-primary/10">
          <Plus class="w-10 h-10" />
        </div>
        <div class="text-center">
          <p class="font-display font-black text-xl text-slate-900 dark:text-slate-100 mb-2">Partner Integration</p>
          <p class="text-xs font-medium max-w-[200px] mx-auto leading-relaxed">Expand the TechCore ecosystem with a new hardware entity registration.</p>
        </div>
      </button>
    </div>

    <!-- Pagination Infrastructure -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Registry Synchronization Active</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30" disabled>
          <ChevronLeft class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-1">
          <button class="w-10 h-10 flex items-center justify-center bg-primary text-white font-black text-xs rounded-xl shadow-lg shadow-primary/20">1</button>
          <button class="w-10 h-10 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-primary transition-colors">2</button>
        </div>
        <button class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

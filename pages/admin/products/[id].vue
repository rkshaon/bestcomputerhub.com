<!-- File: /pages/admin/products/[id].vue -->
<script setup lang="ts">
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Eye, 
  Upload, 
  Plus, 
  X,
  Package,
  Layers,
  Tag,
  DollarSign,
  BarChart3,
  Box,
  Truck
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { formatCurrency, cn } from '@/utils';
import type { Product } from '@/types';

definePageMeta({
  layout: 'admin'
});

const route = useRoute();
const productId = route.params.id as string;
const productService = useProductService();
const product = ref<Product | null>(productService.getProductById(productId) || null);

if (!product.value) {
  navigateTo('/admin/products');
}

const isSaving = ref(false);
const activeTab = ref('general');

const handleSave = async () => {
  isSaving.value = true;
  await new Promise(resolve => setTimeout(resolve, 1500));
  isSaving.value = false;
  // In a real app, logic to update product
};

const removeImage = (index: number) => {
  if (product.value) {
    product.value.images.splice(index, 1);
  }
};
</script>

<template>
  <div v-if="product" class="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/products" class="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
          <ChevronLeft class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">Edit Configuration</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">SKU: {{ product.sku }}</span>
          </div>
          <h1 class="text-3xl font-display font-extrabold tracking-tight">{{ product.name }}</h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-100 transition-all">
          <Trash2 class="w-4 h-4" /> Decommission
        </button>
        <button 
          @click="handleSave"
          class="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <Save v-if="!isSaving" class="w-4 h-4" />
          <span v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-1"></span>
          {{ isSaving ? 'Saving...' : 'Patch Changes' }}
        </button>
      </div>
    </div>

    <!-- Tabs Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Form Section -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Basic Info Card -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <h3 class="text-lg font-display font-bold flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-900 pb-4">
            <Box class="w-5 h-5 text-primary" /> Technical Specifications
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Identity Designation</label>
              <input v-model="product.name" type="text" class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm" />
            </div>
            <div class="space-y-3">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Brand Identity</label>
              <input v-model="product.brand" type="text" class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm" />
            </div>
            <div class="md:col-span-2 space-y-3">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Mission Description</label>
              <textarea v-model="product.description" rows="5" class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"></textarea>
            </div>
          </div>
        </div>

        <!-- Asset Management -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <h3 class="text-lg font-display font-bold flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-900 pb-4">
            <Layers class="w-5 h-5 text-primary" /> Visual Assets
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(img, i) in product.images" :key="i" class="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
               <img :src="img" class="w-full h-full object-cover" />
               <button 
                 @click="removeImage(i)" 
                 class="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X class="w-4 h-4" />
               </button>
            </div>
            <button class="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all">
              <Plus class="w-6 h-6 mb-2" />
              <span class="text-[10px] font-bold uppercase tracking-widest">Inject Asset</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar Form Section -->
      <div class="space-y-8">
        <!-- Pricing & Inventory -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
           <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-8">
             Market Value
           </h3>
           <div class="space-y-6">
             <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Current Price (USD)</label>
                <div class="relative group">
                  <DollarSign class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                  <input v-model.number="product.price" type="number" class="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm" />
                </div>
             </div>
             <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Original Price (USD)</label>
                <div class="relative group">
                  <DollarSign class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                  <input v-model.number="product.originalPrice" type="number" class="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm" />
                </div>
             </div>
             <div class="pt-6 border-t border-slate-100 dark:border-slate-900">
               <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">On-Hand Inventory</label>
               <input v-model.number="product.stock" type="number" class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm" />
               <div class="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span class="text-slate-400">System Integrity</span>
                  <span :class="product.stock > 0 ? 'text-emerald-500' : 'text-rose-500'">{{ product.stock > 0 ? 'Operational' : 'Depleted' }}</span>
               </div>
             </div>
           </div>
        </div>

        <!-- Organization -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
           <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-8">
             Classification
           </h3>
           <div class="space-y-6">
             <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Category Domain</label>
                <select v-model="product.category" class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs uppercase tracking-widest appearance-none">
                  <option value="Laptops">Laptops</option>
                  <option value="Desktops">Desktops</option>
                  <option value="Components">Components</option>
                  <option value="Peripherals">Peripherals</option>
                </select>
             </div>
             <!-- Features Toggles -->
             <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-900">
               <div class="flex items-center justify-between">
                 <span class="text-xs font-bold">Featured Resource</span>
                 <div class="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                   <div class="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                 </div>
               </div>
               <div class="flex items-center justify-between">
                 <span class="text-xs font-bold">New Arrival</span>
                 <div class="w-10 h-5 bg-slate-200 dark:bg-slate-800 rounded-full relative cursor-pointer">
                   <div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

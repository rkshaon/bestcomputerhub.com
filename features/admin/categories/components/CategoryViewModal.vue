<!-- File: /features/admin/categories/components/CategoryViewModal.vue -->
<script setup lang="ts">
import { Loader2, X } from 'lucide-vue-next';
import type { Category } from '@/types';

interface Props {
  isOpen: boolean;
  category: Category | null;
  isResolving?: boolean;
  categories?: Category[];
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
  isResolving: false,
  categories: () => []
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const getParentName = (parentId?: string): string => {
  if (!parentId) return 'None (Primary Group)';
  const matched = props.categories?.find(c => String(c.id) === String(parentId));
  return matched ? matched.name : parentId;
};
</script>

<template>
  <div 
    v-if="isOpen && category" 
    @click.self="emit('close')" 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
  >
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
      
      <!-- Loading overlay inside modal -->
      <div v-if="isResolving" class="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading classification details...</p>
        </div>
      </div>

      <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Taxonomy Inspector Viewer</span>
          <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Classification Audit Node</h3>
        </div>
        <button 
          type="button"
          @click="emit('close')" 
          aria-label="Close modal" 
          class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
        <div class="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/85">
          <div class="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0 text-3xl">
            <span>{{ category.icon || '📁' }}</span>
          </div>
          <div>
            <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ category.name }}</h4>
            <p class="text-xs font-mono text-primary font-bold mt-1 uppercase tracking-wider">{{ category.slug }}</p>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Parent: {{ getParentName(category.parentCategoryId) }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Short Description Title</p>
            <div class="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              <p v-if="category.short_description_title" class="whitespace-pre-line">{{ category.short_description_title }}</p>
              <p v-else class="italic text-xs text-slate-400">No short description title provided.</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Short Description</p>
            <div class="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              <p v-if="category.short_description" class="whitespace-pre-line">{{ category.short_description }}</p>
              <p v-else class="italic text-xs text-slate-400">No short description provided.</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Taxonomy Registry Overview (Full Description)</p>
            <div 
              class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 overflow-x-auto"
            >
              <div v-if="category.description" v-html="category.description" class="space-y-2"></div>
              <p v-else class="italic font-medium text-xs text-slate-400">"No database memo recorded for this hardware classification node."</p>
            </div>
          </div>

          <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Identifier UUID</span>
              <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{{ category.id }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Order Priority</span>
              <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ category.order !== undefined ? category.order : 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sub-Categories Count</span>
              <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ category.subCategories?.length || 0 }} nested nodes</span>
            </div>
            <div class="flex items-center justify-between" v-if="category.subCategories?.length">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nested Identifiers</span>
              <span class="text-xs text-slate-600 dark:text-slate-400 font-mono">{{ category.subCategories.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
        <button 
          type="button"
          @click="emit('close')" 
          class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-6 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  </div>
</template>

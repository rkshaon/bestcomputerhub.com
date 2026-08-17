<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  FolderTree, 
  Menu, 
  RefreshCw, 
  AlertCircle, 
  Layers 
} from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import CategoryTreeNode from './CategoryTreeNode.vue';

const props = withDefaults(defineProps<{
  togglingMenuSlug?: string | null;
  searchQuery?: string;
}>(), {
  togglingMenuSlug: null,
  searchQuery: ''
});

const emit = defineEmits<{
  (e: 'toggle-menu', cat: Category): void;
  (e: 'view', cat: Category): void;
  (e: 'edit', cat: Category): void;
  (e: 'delete', cat: Category): void;
}>();

const categoryService = useCategoryService();

const treeMode = ref<'category' | 'menu'>('category');
const rootCategories = ref<Category[]>([]);
const isLoadingRoots = ref(false);
const rootError = ref<string | null>(null);

const fetchRoots = async () => {
  try {
    isLoadingRoots.value = true;
    rootError.value = null;
    const roots = await categoryService.getRootCategories({ page_size: 100 });
    rootCategories.value = roots;
  } catch (err: any) {
    rootError.value = err?.message || 'Failed to load root category hierarchy.';
  } finally {
    isLoadingRoots.value = false;
  }
};

onMounted(() => {
  fetchRoots();
});

// Compute root categories to display based on active treeMode and searchQuery
const displayRoots = computed(() => {
  let list = rootCategories.value;

  if (treeMode.value === 'menu') {
    list = list.filter(c => c.show_in_menu === true);
  }

  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  return list;
});
</script>

<template>
  <div class="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
    <!-- Header Controls: Mode Tabs & Refresh -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
          <FolderTree class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-foreground leading-tight">Taxonomy Hierarchy Explorer</h3>
          <p class="text-[11px] text-muted-foreground">Interactive nested node structure & menu placement</p>
        </div>
      </div>

      <!-- Mode Selector Tabs: Category Tree vs Menu Tree -->
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <div class="flex items-center bg-muted/60 p-1 rounded-xl border border-border/80">
          <button
            type="button"
            @click="treeMode = 'category'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none',
              treeMode === 'category'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            title="Display full category taxonomy hierarchy"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>Category Tree</span>
          </button>

          <button
            type="button"
            @click="treeMode = 'menu'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none',
              treeMode === 'menu'
                ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            title="Display active menu taxonomy hierarchy"
          >
            <Menu class="w-3.5 h-3.5" />
            <span>Menu Tree</span>
          </button>
        </div>

        <!-- Reload Tree Button -->
        <button
          type="button"
          @click="fetchRoots"
          :disabled="isLoadingRoots"
          class="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          title="Reload tree roots"
          aria-label="Reload tree roots"
        >
          <RefreshCw :class="['w-4 h-4', isLoadingRoots && 'animate-spin']" />
        </button>
      </div>
    </div>

    <!-- Tree Body -->
    <div v-if="isLoadingRoots" class="py-12 flex flex-col items-center justify-center gap-3">
      <span class="animate-spin border-3 border-primary/20 border-t-primary rounded-full w-8 h-8"></span>
      <p class="text-xs font-semibold text-muted-foreground animate-pulse">Building Hierarchy Tree...</p>
    </div>

    <div v-else-if="rootError" class="py-10 flex flex-col items-center justify-center gap-3 text-center bg-muted/30 rounded-xl border border-border p-6">
      <div class="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle class="w-5 h-5" />
      </div>
      <p class="text-xs font-semibold text-foreground">{{ rootError }}</p>
      <button 
        type="button"
        @click="fetchRoots" 
        class="text-xs px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
      >
        Retry Fetching
      </button>
    </div>

    <div v-else-if="displayRoots.length === 0" class="py-12 text-center bg-muted/30 rounded-xl border border-border/60 p-6 space-y-2">
      <p class="text-sm font-bold text-foreground">
        {{ treeMode === 'menu' ? 'No Menu Categories Found' : 'No Root Categories Found' }}
      </p>
      <p class="text-xs text-muted-foreground max-w-sm mx-auto">
        {{ treeMode === 'menu' 
          ? 'No categories are currently marked for display in the main navigation menu.' 
          : 'No top-level root categories matched the current filter criteria.' 
        }}
      </p>
    </div>

    <!-- Tree Nodes List -->
    <div v-else class="space-y-1">
      <CategoryTreeNode
        v-for="rootNode in displayRoots"
        :key="rootNode.id"
        :node="rootNode"
        :depth="0"
        :tree-mode="treeMode"
        :toggling-menu-slug="togglingMenuSlug"
        :search-query="searchQuery"
        @toggle-menu="$emit('toggle-menu', $event)"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

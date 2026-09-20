<!-- File: /components/layout/HeaderSearchOverlay.vue -->
<script setup lang="ts">
import { navigateTo } from '#app';
import { ref, computed } from 'vue';
import { Search, X } from 'lucide-vue-next';
import type { Category } from '@/types';

interface Props {
  searchQuery?: string;
  isExpanded?: boolean;
  categories?: Category[];
  allCategories?: Category[];
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  isExpanded: false,
  categories: () => [],
  allCategories: () => []
});

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:isExpanded', value: boolean): void;
  (e: 'close'): void;
  (e: 'submit'): void;
}>();

const searchInputRef = ref<HTMLInputElement | null>(null);

const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val: string) => emit('update:searchQuery', val)
});

const handleSearchSubmit = () => {
  if (searchQueryModel.value.trim()) {
    navigateTo(`/products?q=${encodeURIComponent(searchQueryModel.value.trim())}`);
    emit('submit');
  }
};

const handleClear = () => {
  searchQueryModel.value = '';
  searchInputRef.value?.focus();
};

defineExpose({
  focus: () => searchInputRef.value?.focus()
});
</script>

<template>
  <div class="flex-1 min-w-0 flex items-center gap-3">
    <!-- Desktop Search Input Bar -->
    <div class="hidden md:flex relative group flex-1 min-w-0 transition-all duration-300 ease-in-out">
      <input 
        ref="searchInputRef"
        v-model="searchQueryModel"
        type="text" 
        placeholder="Search products, brands or models..." 
        aria-label="Search items"
        class="w-full bg-muted/50 border border-input rounded-full outline-none h-11 text-sm px-12 transition-all duration-200 focus:bg-background focus:ring-2 focus:ring-primary/20"
        @keyup.enter="handleSearchSubmit"
      />
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary w-5 h-5 transition-colors" />
      <button 
        v-if="searchQueryModel" 
        type="button" 
        @click="handleClear"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted cursor-pointer"
        aria-label="Clear search text"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

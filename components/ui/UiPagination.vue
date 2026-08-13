<!-- File: /components/ui/UiPagination.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { cn } from '@/utils';

interface Props {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  itemLabel?: string;
  prefixLabel?: string;
  variant?: 'footer' | 'card';
}

const props = withDefaults(defineProps<Props>(), {
  itemLabel: 'items',
  prefixLabel: 'Showing',
  variant: 'footer',
});

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
  (e: 'update:current-page', page: number): void;
}>();

const startItem = computed(() => {
  if (props.totalCount === 0) return 0;
  return Math.min(props.totalCount, (props.currentPage - 1) * props.itemsPerPage + 1);
});

const endItem = computed(() => {
  return Math.min(props.totalCount, props.currentPage * props.itemsPerPage);
});

const setPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page);
    emit('update:current-page', page);
  }
};

const visiblePages = computed(() => {
  const range: (number | 'ellipsis')[] = [];
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
  } else {
    // Always include page 1
    range.push(1);

    // Calculate start and end range around current page
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    // Left ellipsis
    if (start > 2) {
      if (start === 3) {
        range.push(2);
      } else {
        range.push('ellipsis');
      }
    }

    // Neighbors
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Right ellipsis
    if (end < total - 1) {
      if (end === total - 2) {
        range.push(total - 1);
      } else {
        range.push('ellipsis');
      }
    }

    // Always include last page
    range.push(total);
  }

  return range;
});
</script>

<template>
  <div 
    :class="cn(
      variant === 'card'
        ? 'bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4'
        : 'bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4',
      $attrs.class as string
    )"
  >
    <div class="flex items-center gap-3">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Showing <span class="text-slate-800 dark:text-slate-200 font-bold">{{ startItem.toLocaleString() }}–{{ endItem.toLocaleString() }}</span> 
        of <span class="text-slate-800 dark:text-slate-200 font-bold">{{ totalCount.toLocaleString() }}</span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button 
        type="button"
        @click="setPage(currentPage - 1)" 
        :disabled="currentPage <= 1"
        class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      
      <div class="flex items-center gap-1 font-mono text-xs font-bold">
        <template v-for="(p, index) in visiblePages" :key="index">
          <span 
            v-if="p === 'ellipsis'"
            class="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-600 select-none"
          >
            ...
          </span>
          <button 
            v-else
            type="button"
            @click="setPage(p)"
            :class="cn(
              'w-10 h-10 rounded-xl font-bold transition-all cursor-pointer text-xs',
              currentPage === p 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                : 'border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
            )"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <button 
        type="button"
        @click="setPage(currentPage + 1)" 
        :disabled="currentPage >= totalPages || totalPages === 0"
        class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Next page"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

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

interface PaginationSlot {
  type: 'page' | 'ellipsis';
  page?: number;
  key: string;
}

const paginationSlots = computed<PaginationSlot[]>(() => {
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 0) return [];

  if (total <= 11) {
    const slots: PaginationSlot[] = [];
    for (let i = 1; i <= total; i++) {
      slots.push({
        type: 'page',
        page: i,
        key: `page-${i}`,
      });
    }
    return slots;
  }

  const slots: PaginationSlot[] = [];

  if (current <= 5) {
    for (let i = 1; i <= 7; i++) {
      slots.push({ type: 'page', page: i, key: `start-page-${i}` });
    }
    slots.push({ type: 'ellipsis', key: 'ellipsis-right' });
    for (let i = total - 2; i <= total; i++) {
      slots.push({ type: 'page', page: i, key: `end-page-${i}` });
    }
    return slots;
  }

  if (current >= total - 4) {
    for (let i = 1; i <= 3; i++) {
      slots.push({ type: 'page', page: i, key: `start-page-${i}` });
    }
    slots.push({ type: 'ellipsis', key: 'ellipsis-left' });
    for (let i = total - 6; i <= total; i++) {
      slots.push({ type: 'page', page: i, key: `end-page-${i}` });
    }
    return slots;
  }

  for (let i = 1; i <= 3; i++) {
    slots.push({ type: 'page', page: i, key: `start-page-${i}` });
  }
  slots.push({ type: 'ellipsis', key: 'ellipsis-left' });
  for (let i = current - 1; i <= current + 1; i++) {
    slots.push({ type: 'page', page: i, key: `mid-page-${i}` });
  }
  slots.push({ type: 'ellipsis', key: 'ellipsis-right' });
  for (let i = total - 2; i <= total; i++) {
    slots.push({ type: 'page', page: i, key: `end-page-${i}` });
  }

  return slots;
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
        <template v-for="slot in paginationSlots" :key="slot.key">
          <span 
            v-if="slot.type === 'ellipsis'"
            class="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-600 select-none"
          >
            ...
          </span>
          <button 
            v-else-if="slot.type === 'page' && slot.page !== undefined"
            type="button"
            @click="setPage(slot.page)"
            :class="cn(
              'w-10 h-10 rounded-xl font-bold transition-all cursor-pointer text-xs',
              currentPage === slot.page 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                : 'border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
            )"
          >
            {{ slot.page }}
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

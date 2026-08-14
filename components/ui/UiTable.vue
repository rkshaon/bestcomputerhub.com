<!-- File: /components/ui/UiTable.vue -->
<script setup lang="ts" generic="T extends Record<string, any>">
import { ArrowUpDown, Inbox } from 'lucide-vue-next';
import { cn } from '@/utils';

export interface UiTableColumn<T = any> {
  key: string;
  label?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  headerClass?: string;
  cellClass?: string;
  sortable?: boolean;
}

interface Props {
  columns: UiTableColumn<T>[];
  data: T[];
  keyField?: string;
  loading?: boolean;
  loadingRows?: number;
  emptyText?: string;
  emptyDescription?: string;
  hoverable?: boolean;
  rowClass?: string | ((item: T, index: number) => string);
  rowAttrs?: (item: T, index: number) => Record<string, any>;
  tableClass?: string;
  wrapperClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  keyField: 'id',
  loading: false,
  loadingRows: 5,
  emptyText: 'No records found',
  emptyDescription: 'There are no items to display at this time.',
  hoverable: true,
  tableClass: '',
  wrapperClass: '',
});

const emit = defineEmits<{
  (e: 'row-click', item: T, index: number): void;
  (e: 'header-click', column: UiTableColumn<T>): void;
}>();

function getRowKey(item: T, index: number): string | number {
  if (item && props.keyField in item && item[props.keyField] !== undefined && item[props.keyField] !== null) {
    return item[props.keyField];
  }
  return index;
}

function getItemValue(item: T, key: string): any {
  if (!item || typeof item !== 'object') return '';
  if (key in item) return item[key];
  return key.split('.').reduce((acc: any, part: string) => (acc && typeof acc === 'object' ? acc[part] : undefined), item) ?? '';
}

function getRowClass(item: T, index: number): string {
  const base = props.hoverable ? 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30' : '';
  if (!props.rowClass) return base;
  if (typeof props.rowClass === 'function') {
    return cn(base, props.rowClass(item, index));
  }
  return cn(base, props.rowClass);
}

function getRowAttrs(item: T, index: number): Record<string, any> {
  if (typeof props.rowAttrs === 'function') {
    return props.rowAttrs(item, index);
  }
  return {};
}

function getAlignmentClass(align?: 'left' | 'center' | 'right'): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}
</script>

<template>
  <div :class="cn('bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden', wrapperClass)">
    <slot name="header" />
    <div class="overflow-x-auto">
      <table :class="cn('w-full text-left border-collapse', tableClass)">
        <thead>
          <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-900">
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? { width: col.width } : undefined"
              :class="cn('px-8 py-5', getAlignmentClass(col.align), col.headerClass)"
              @click="emit('header-click', col)"
            >
              <slot
                v-if="$slots[`header-${col.key}`]"
                :name="`header-${col.key}`"
                :column="col"
              />
              <slot
                v-else-if="$slots[`header(${col.key})`]"
                :name="`header(${col.key})`"
                :column="col"
              />
              <slot
                v-else-if="$slots['column-header']"
                name="column-header"
                :column="col"
              />
              <template v-else>
                <div
                  :class="cn(
                    'flex items-center gap-2',
                    col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start',
                    col.sortable && 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
                  )"
                >
                  <span>{{ col.label ?? col.key }}</span>
                  <ArrowUpDown v-if="col.sortable" class="w-3 h-3 opacity-60" />
                </div>
              </template>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
          <!-- Loading State -->
          <template v-if="loading">
            <tr v-for="i in loadingRows" :key="`skeleton-row-${i}`" class="animate-pulse">
              <td
                v-for="col in columns"
                :key="`skeleton-cell-${col.key}`"
                :class="cn('px-8 py-5', getAlignmentClass(col.align), col.cellClass)"
              >
                <div
                  :class="cn(
                    'h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded-md w-3/4 inline-block',
                    col.align === 'right' && 'ml-auto',
                    col.align === 'center' && 'mx-auto'
                  )"
                ></div>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else-if="!data || data.length === 0">
            <tr>
              <td :colspan="columns.length" class="px-8 py-12 text-center">
                <slot name="empty">
                  <div class="flex flex-col items-center justify-center text-slate-400 py-4">
                    <Inbox class="w-10 h-10 mb-3 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                    <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ emptyText }}</p>
                    <p v-if="emptyDescription" class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                      {{ emptyDescription }}
                    </p>
                  </div>
                </slot>
              </td>
            </tr>
          </template>

          <!-- Data Rows -->
          <template v-else>
            <tr
              v-for="(item, index) in data"
              :key="getRowKey(item, index)"
              :class="cn('group transition-colors', getRowClass(item, index))"
              v-bind="getRowAttrs(item, index)"
              @click="emit('row-click', item, index)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="cn('px-8 py-5 text-sm', getAlignmentClass(col.align), col.cellClass)"
              >
                <slot
                  v-if="$slots[`cell-${col.key}`]"
                  :name="`cell-${col.key}`"
                  :item="item"
                  :column="col"
                  :index="index"
                  :value="getItemValue(item, col.key)"
                />
                <slot
                  v-else-if="$slots[`cell(${col.key})`]"
                  :name="`cell(${col.key})`"
                  :item="item"
                  :column="col"
                  :index="index"
                  :value="getItemValue(item, col.key)"
                />
                <slot
                  v-else-if="$slots.cell"
                  name="cell"
                  :item="item"
                  :column="col"
                  :index="index"
                  :value="getItemValue(item, col.key)"
                />
                <template v-else>
                  {{ getItemValue(item, col.key) }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <slot name="footer" />
  </div>
</template>

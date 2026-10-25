<script setup lang="ts">
import type { Order, OrderStatusOption } from '@/types/order';
import KanbanCard from './KanbanCard.vue';
import { computed } from 'vue';

const props = defineProps<{ orders: Order[], statuses: OrderStatusOption[] }>();

const columns = computed(() => {
  return props.statuses.map(status => ({
    ...status,
    orders: props.orders.filter(o => o.status === status.value)
  }));
});
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
    <div v-for="col in columns" :key="col.value" class="flex flex-col gap-3">
      <div class="flex items-center justify-between py-2 border-b border-border/60">
        <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">{{ col.label }}</h3>
        <span class="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
      </div>
      <div class="flex flex-col gap-3 min-h-[100px]">
        <KanbanCard v-for="order in col.orders" :key="order.id" :order="order" />
        <div v-if="col.orders.length === 0" class="text-xs text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl">No orders</div>
      </div>
    </div>
  </div>
</template>

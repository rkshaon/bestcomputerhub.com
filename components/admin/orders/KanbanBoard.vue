<script setup lang="ts">
import type { Order, OrderStatusOption } from '@/types/order';
import KanbanCard from './KanbanCard.vue';
import { computed, ref } from 'vue';
import { useToast } from '@/composables/useToast';

const props = defineProps<{ 
  orders: Order[], 
  statuses: OrderStatusOption[], 
  transitions: Record<string, string[]>,
  updateStatus: (id: string, status: string) => Promise<any> 
}>();
const emit = defineEmits(['status-updated']);
const { toastError } = useToast();
const draggingOverColumn = ref<string | null>(null);

function handleDragOver(statusValue: string) {
  draggingOverColumn.value = statusValue;
}

function handleDragLeave() {
  draggingOverColumn.value = null;
}

async function handleDrop(event: DragEvent, targetStatus: string) {
  draggingOverColumn.value = null;
  const orderId = event.dataTransfer?.getData('text/plain');
  if (!orderId) return;

  const order = props.orders.find(o => o.id === orderId);
  if (!order) return;

  const currentStatus = order.status.toLowerCase();
  const newStatus = targetStatus.toLowerCase();

  if (currentStatus === newStatus) return;
  if (!getTransitionsForOrder(order.status).map(s => s.toLowerCase()).includes(newStatus)) {
    toastError('Invalid status transition');
    return;
  }

  try {
    await props.updateStatus(orderId, targetStatus);
    emit('status-updated');
  } catch (e: any) {
    toastError('Failed to update status', { description: e.message });
  }
}


const columns = computed(() => {
  return props.statuses.map(status => ({
    ...status,
    orders: props.orders.filter(o => o.status === status.value.toLowerCase())
  }));
});

const getTransitionsForOrder = (status: string): string[] => {
  if (!props.transitions) return [];
  const key = Object.keys(props.transitions).find(k => k.toLowerCase() === status.toLowerCase());
  return (key ? props.transitions[key] : []) || [];
};
</script>

<template>
  <div class="flex flex-nowrap overflow-x-auto pb-4 gap-4">
    <div 
      v-for="col in columns" 
      :key="col.value" 
      class="flex-shrink-0 w-[240px] flex flex-col gap-2 p-2 rounded-xl transition-colors"
      :class="{'bg-muted/50': draggingOverColumn === col.value}"
      @dragover.prevent="handleDragOver(col.value)"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop($event, col.value)"
    >
      <div class="flex items-center justify-between py-2 border-b border-border/60">
        <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">{{ col.label }}</h3>
        <span class="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
      </div>
      <div class="flex flex-col gap-3 min-h-[100px]">
        <KanbanCard 
          v-for="order in col.orders" 
          :key="order.id" 
          :order="order" 
          :statuses="statuses" 
          :transitions="getTransitionsForOrder(order.status)"
          :update-status="updateStatus"
          @status-updated="emit('status-updated')"
        />
        <div v-if="col.orders.length === 0" class="text-xs text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl">No orders</div>
      </div>
    </div>
  </div>
</template>

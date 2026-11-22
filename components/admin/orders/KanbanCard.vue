<script setup lang="ts">
import type { Order, OrderStatusOption } from '@/types/order';
import { formatCurrency } from '@/utils';
import { Package } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';

import { useAdminPermissions } from '@/composables/useAdminPermissions';

const props = defineProps<{ 
  order: Order, 
  statuses: OrderStatusOption[], 
  transitions: string[],
  updateStatus: (id: string, status: string) => Promise<any> 
}>();
const emit = defineEmits(['status-updated']);
const isLoading = ref(false);
const { toastError } = useToast();
const { canEditInModule } = useAdminPermissions();
const canEdit = computed(() => canEditInModule('orders'));

const filteredStatuses = computed(() => {
  const currentStatusLower = String(props.order.status ?? '').trim().toLowerCase();
  const transitionsLower = props.transitions.map(t => String(t ?? '').trim().toLowerCase());
  
  return props.statuses.filter(s => {
    const statusValueLower = String(s.value ?? '').trim().toLowerCase();
    return statusValueLower === currentStatusLower || transitionsLower.includes(statusValueLower);
  });
});

async function handleStatusChange(event: Event) {
  if (!canEdit.value) return;
  const newStatus = (event.target as HTMLSelectElement).value;
  if (newStatus.trim().toLowerCase() === String(props.order.status ?? '').trim().toLowerCase()) return;
  isLoading.value = true;
  try {
    await props.updateStatus(props.order.id, newStatus);
    emit('status-updated');
  } catch (e: any) {
    toastError('Failed to update status', { description: e.message });
  } finally {
    isLoading.value = false;
  }
}

function handleDragStart(event: DragEvent) {
  if (!canEdit.value || isLoading.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('text/plain', props.order.id);
  event.dataTransfer!.effectAllowed = 'move';
}
</script>

<template>
  <div 
    class="block bg-card border border-border/80 rounded-xl p-3 shadow-2xs group"
    :draggable="canEdit"
    @dragstart="handleDragStart"
  >
    <NuxtLink :to="`/admin/orders/${order.id}`" class="block">
      <div class="flex justify-between items-start mb-2">
        <span class="font-mono text-xs font-bold text-foreground tracking-tighter">{{ order.orderNumber }}</span>
      </div>
      <p class="text-sm font-bold text-foreground mb-1">{{ order.customerName }}</p>
      <div class="flex justify-between items-center text-xs text-muted-foreground mt-3">
        <span>{{ formatCurrency(order.totalAmount) }}</span>
        <div class="flex items-center gap-1">
          <Package class="w-3 h-3" />
          {{ order.itemCount }} Items
        </div>
      </div>
    </NuxtLink>
    <div class="mt-4 pt-4 border-t border-border/60">
      <select 
        :value="String(order.status ?? '').trim().toUpperCase()" 
        :disabled="!canEdit || isLoading"
        @change="handleStatusChange"
        class="w-full h-8 text-xs font-bold uppercase tracking-widest bg-muted/50 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option v-for="s in filteredStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
    </div>
  </div>
</template>

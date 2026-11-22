<!-- File: /components/admin/AdminOrderActions.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSalesService } from '@/composables/useSalesService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import { getAvailableOrderStatusOptions } from '@/utils/order';
import type { Order, OrderStatusOption } from '@/types/order';

const props = defineProps<{
  order: Order;
  statuses?: OrderStatusOption[];
  transitions?: Record<string, string[]>;
}>();

const emit = defineEmits(['updated']);

const salesService = useSalesService();
const permissions = useAdminPermissions();
const toast = useToast();

const isProcessing = ref(false);

const availableStatuses = computed<OrderStatusOption[]>(() =>
  getAvailableOrderStatusOptions({
    currentStatus: props.order.status,
    statuses: props.statuses,
    transitions: props.transitions,
    fallbackNextStatuses: props.order.allowedNextStatuses
  })
);

const markPaid = async () => {
  if (!confirm('Are you sure you want to mark this order as paid?')) return;
  
  isProcessing.value = true;
  try {
    await salesService.markPaid(props.order.id);
    toast.toastSuccess('Order marked as paid successfully');
    emit('updated');
  } catch (err: any) {
    toast.handleApiError(err);
  } finally {
    isProcessing.value = false;
  }
};

const updateStatus = async (status: string) => {
  isProcessing.value = true;
  try {
    const backendStatus = String(status).trim().toUpperCase();
    await salesService.updateStatus(props.order.id, backendStatus);
    const statusLabel = availableStatuses.value.find(
      (s) => s.value.toUpperCase() === backendStatus
    )?.label || backendStatus;
    toast.toastSuccess(`Order status updated to ${statusLabel}`);
    emit('updated');
  } catch (err: any) {
    toast.handleApiError(err);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div v-if="permissions.hasPermission('sale_api.view_sale')" class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-4">
    <h3 class="text-lg font-bold">Admin Actions</h3>
    
    <div class="flex flex-col gap-2">
      <UiButton 
        v-if="order.paymentStatus === 'unpaid' && permissions.hasPermission('sale_api.change_sale')" 
        @click="markPaid" 
        :disabled="isProcessing"
        variant="primary"
      >
        Mark as Paid
      </UiButton>
      
      <div v-if="permissions.hasPermission('sale_api.change_sale')" class="flex flex-wrap gap-2">
        <UiButton 
          v-for="status in availableStatuses" 
          :key="status.value"
          @click="updateStatus(status.value)"
          :disabled="isProcessing || order.status.toLowerCase() === status.value.toLowerCase()"
          variant="outline"
          class="capitalize"
        >
          Set to {{ status.label }}
        </UiButton>
        <p v-if="availableStatuses.length === 0" class="text-xs text-muted-foreground">
          No further status transitions available.
        </p>
      </div>
    </div>
  </div>
</template>

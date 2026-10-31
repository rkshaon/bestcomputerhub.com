<!-- File: /components/admin/AdminOrderActions.vue -->
<script setup lang="ts">
import { useSalesService } from '@/composables/useSalesService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import type { Order } from '@/types/order';

const props = defineProps<{
  order: Order;
}>();

const emit = defineEmits(['updated']);

const salesService = useSalesService();
const permissions = useAdminPermissions();
const toast = useToast();

const isProcessing = ref(false);

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
    await salesService.updateStatus(props.order.id, status);
    toast.toastSuccess(`Order status updated to ${status}`);
    emit('updated');
  } catch (err: any) {
    toast.handleApiError(err);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div v-if="permissions.canEditInModule('orders')" class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-4">
    <h3 class="text-lg font-bold">Admin Actions</h3>
    
    <div class="flex flex-col gap-2">
      <UiButton 
        v-if="order.paymentStatus === 'unpaid'" 
        @click="markPaid" 
        :disabled="isProcessing"
        variant="primary"
      >
        Mark as Paid
      </UiButton>
      
      <div class="flex flex-wrap gap-2">
        <UiButton 
          v-for="status in order.allowedNextStatuses" 
          :key="status.value"
          @click="updateStatus(status.value)"
          :disabled="isProcessing || order.status === status.value"
          variant="outline"
          class="capitalize"
        >
          Set to {{ status.label }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

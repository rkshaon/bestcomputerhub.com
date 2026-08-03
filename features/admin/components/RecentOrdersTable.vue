<!-- File: /features/admin/components/RecentOrdersTable.vue -->
<script setup lang="ts">
import { Eye, ExternalLink, MoreVertical } from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';
import type { Order } from '@/types';
import UiCard from '@/components/ui/UiCard.vue';
import UiBadge from '@/components/ui/UiBadge.vue';

interface Props {
  orders: Order[];
}

const props = defineProps<Props>();

const statusColors: Record<string, any> = {
  pending: 'warning',
  processing: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error'
};
</script>

<template>
  <UiCard padding="none" class="overflow-hidden">
    <div class="px-8 py-6 border-b border-border flex items-center justify-between">
      <div>
        <h3 class="text-lg font-display font-bold">Transaction Ledger</h3>
        <p class="text-xs text-muted-foreground font-medium">Real-time procurement registry</p>
      </div>
      <NuxtLink to="/admin/orders" class="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
        Access Archive <ExternalLink class="w-3 h-3" />
      </NuxtLink>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground bg-muted/50">
            <th class="px-8 py-4">Reference</th>
            <th class="px-8 py-4">Client Entity</th>
            <th class="px-8 py-4">Protocol State</th>
            <th class="px-8 py-4 text-right">Settlement</th>
            <th class="px-8 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="order in orders" :key="order.id" class="group transition-colors hover:bg-accent/30">
            <td class="px-8 py-5">
              <span class="text-xs font-mono font-bold text-muted-foreground">{{ order.orderNumber }}</span>
            </td>
            <td class="px-8 py-5">
              <p class="text-sm font-bold">{{ order.customerName }}</p>
              <p class="text-[10px] text-muted-foreground font-medium">{{ order.createdAt }}</p>
            </td>
            <td class="px-8 py-5">
              <UiBadge :variant="statusColors[order.status]">{{ order.status }}</UiBadge>
            </td>
            <td class="px-8 py-5 text-right font-black tracking-tight text-sm">
              {{ formatCurrency(order.totalAmount) }}
            </td>
            <td class="px-8 py-5 text-right">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink :to="`/admin/orders/${order.id}`" class="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Eye class="w-4 h-4" />
                </NuxtLink>
                <button class="p-2 text-muted-foreground hover:text-foreground">
                  <MoreVertical class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils';
import { Package } from 'lucide-vue-next';

defineProps<{ order: Order }>();
</script>

<template>
  <NuxtLink 
    :to="`/admin/orders/${order.id}`" 
    class="block bg-card border border-border/80 rounded-xl p-4 shadow-2xs hover:border-primary/40 transition-all group"
  >
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
</template>

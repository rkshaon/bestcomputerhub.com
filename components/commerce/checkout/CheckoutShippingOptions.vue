<!-- File: /components/commerce/checkout/CheckoutShippingOptions.vue -->
<script setup lang="ts">
import { Truck, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { cn, formatCurrency } from '@/utils';
import type { ShippingOption } from '@/types';

interface Props {
  /** Backend-priced methods from GET /api/v1/shipping/options/?address_id=. */
  options: ShippingOption[];
  /** Zone the backend resolved for the address. */
  zoneName?: string | null;
  /** Selected `shipping_method_id`. */
  modelValue: number | null;
  isLoading?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), {
  zoneName: null,
  isLoading: false,
  error: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', methodId: number): void;
  (e: 'retry'): void;
}>();

const isFree = (option: ShippingOption) => option.is_free_shipping || Number(option.shipping_charge) === 0;
</script>

<template>
  <fieldset class="space-y-4" :disabled="isLoading">
    <legend class="sr-only">Delivery option</legend>

    <p class="text-sm text-muted-foreground">
      Delivery charges for
      <span class="font-bold text-foreground">{{ zoneName || 'your address' }}</span>.
      Charges are calculated by the store for your current cart.
    </p>

    <div v-if="isLoading" class="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 class="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
      Loading delivery options...
    </div>

    <div v-else-if="error" class="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-start gap-3" role="alert">
      <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
      <div class="flex-grow space-y-2">
        <p class="text-sm font-medium text-foreground">{{ error }}</p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          @click="emit('retry')"
        >
          <RefreshCw class="w-3.5 h-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>

    <div v-else-if="options.length === 0" class="p-6 rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
      No delivery option is available for this address.
    </div>

    <div v-else class="grid grid-cols-1 gap-3">
      <label
        v-for="option in options"
        :key="option.shipping_method_id"
        :class="cn(
          'flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all bg-card',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
          modelValue === option.shipping_method_id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
        )"
      >
        <input
          type="radio"
          name="checkout-shipping-method"
          class="sr-only"
          :value="option.shipping_method_id"
          :checked="modelValue === option.shipping_method_id"
          @change="emit('update:modelValue', option.shipping_method_id)"
        />
        <span
          :class="cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            modelValue === option.shipping_method_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )"
          aria-hidden="true"
        >
          <Truck class="w-5 h-5" />
        </span>
        <span class="flex-grow min-w-0 space-y-0.5">
          <span class="block font-bold text-sm text-card-foreground">{{ option.shipping_method_name }}</span>
          <span
            v-if="!isFree(option) && option.free_shipping_threshold !== null && option.free_shipping_threshold !== undefined"
            class="block text-xs text-muted-foreground"
          >
            Free on orders over {{ formatCurrency(Number(option.free_shipping_threshold)) }}
          </span>
          <span v-else-if="option.is_free_shipping" class="block text-xs text-muted-foreground">
            Free shipping applied to your cart
          </span>
        </span>
        <span class="text-right shrink-0">
          <span :class="cn('block font-bold text-sm', isFree(option) ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')">
            {{ isFree(option) ? 'Free' : formatCurrency(Number(option.shipping_charge)) }}
          </span>
          <span
            v-if="option.is_free_shipping && Number(option.base_charge) > 0"
            class="block text-[11px] text-muted-foreground line-through"
          >
            {{ formatCurrency(Number(option.base_charge)) }}
          </span>
        </span>
        <span
          :class="cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
            modelValue === option.shipping_method_id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
          )"
          aria-hidden="true"
        >
          <Check v-if="modelValue === option.shipping_method_id" class="w-3 h-3" />
        </span>
      </label>
    </div>
  </fieldset>
</template>

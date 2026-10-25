<!-- File: /components/commerce/checkout/CheckoutDeliveryAreaStep.vue -->
<script setup lang="ts">
import { MapPin, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { cn } from '@/utils';
import type { AvailableShippingZone } from '@/types';

interface Props {
  /** Active delivery areas from GET /api/v1/shipping/zones/available/. */
  zones: AvailableShippingZone[];
  /** Selected zone id. */
  modelValue: number | null;
  isLoading?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', zoneId: number): void;
  (e: 'retry'): void;
}>();
</script>

<template>
  <fieldset class="space-y-4" :disabled="isLoading">
    <legend class="sr-only">Delivery area</legend>

    <p class="text-sm text-muted-foreground">
      Where should we deliver this order? The available delivery charges depend on your area.
    </p>

    <!-- Loading -->
    <div v-if="isLoading" class="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 class="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
      Loading delivery areas...
    </div>

    <!-- Error -->
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

    <!-- Empty -->
    <div v-else-if="zones.length === 0" class="p-6 rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
      Delivery areas are not configured yet. Please contact support to complete your order.
    </div>

    <!-- Zone cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label
        v-for="zone in zones"
        :key="zone.id"
        :class="cn(
          'relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all bg-card',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
          modelValue === zone.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
        )"
      >
        <input
          type="radio"
          name="checkout-delivery-area"
          class="sr-only"
          :value="zone.id"
          :checked="modelValue === zone.id"
          @change="emit('update:modelValue', zone.id)"
        />
        <span
          :class="cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            modelValue === zone.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )"
          aria-hidden="true"
        >
          <MapPin class="w-5 h-5" />
        </span>
        <span class="flex-grow min-w-0 space-y-0.5">
          <span class="block font-bold text-sm text-card-foreground">{{ zone.name }}</span>
          <span v-if="zone.description" class="block text-xs text-muted-foreground leading-relaxed">{{ zone.description }}</span>
        </span>
        <span
          :class="cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
            modelValue === zone.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
          )"
          aria-hidden="true"
        >
          <Check v-if="modelValue === zone.id" class="w-3 h-3" />
        </span>
      </label>
    </div>
  </fieldset>
</template>

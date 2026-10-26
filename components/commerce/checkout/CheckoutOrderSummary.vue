<!-- File: /components/commerce/checkout/CheckoutOrderSummary.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Loader2, AlertCircle, PackageCheck, Truck } from 'lucide-vue-next';
import { cn, formatCurrency, decodeHtmlEntities } from '@/utils';
import { toMoney } from '@/utils/order';
import type { CartItem, ShippingOption } from '@/types';
import type { CheckoutValidateResponse } from '@/types/checkout';

interface Props {
  /** Cart lines from the cart store, used for thumbnails and names. */
  items: CartItem[];
  /** Latest result of POST /api/v1/checkout/validate/; totals come only from here. */
  validation: CheckoutValidateResponse | null;
  isValidating?: boolean;
  selectedOption?: ShippingOption | null;
}

const props = withDefaults(defineProps<Props>(), {
  isValidating: false,
  selectedOption: null
});

const pricing = computed(() => (props.validation?.is_valid ? props.validation.pricing : null));
const validationErrors = computed(() => (props.validation && !props.validation.is_valid ? props.validation.errors : []));

/** Backend line totals keyed by product id, when validation has priced the cart. */
const lineTotalByProduct = computed(() => {
  const map = new Map<string, number>();
  const lines = props.validation?.cart?.items ?? [];
  for (const line of lines) map.set(String(line.product_id), toMoney(line.line_total));
  return map;
});

const itemKey = (item: CartItem) => String(item.id ?? item.productId ?? item.product?.id ?? '');
const productId = (item: CartItem) => String(item.product?.id ?? item.productId ?? '');
const lineTotal = (item: CartItem) => lineTotalByProduct.value.get(productId(item)) ?? null;
</script>

<template>
  <aside class="bg-card text-card-foreground rounded-3xl p-6 sm:p-8 border border-border shadow-sm lg:sticky lg:top-28" aria-label="Order summary">
    <h2 class="text-[20px] font-display font-bold mb-5">Order summary</h2>

    <!-- Items -->
    <ul class="space-y-4 max-h-64 overflow-y-auto pr-1 mb-6">
      <li v-for="item in items" :key="itemKey(item)" class="flex gap-3">
        <div class="w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
          <img
            v-if="item.product?.images?.[0]"
            :src="item.product.images[0]"
            :alt="decodeHtmlEntities(item.product?.name || 'Product')"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex-grow min-w-0">
          <p class="font-bold text-sm line-clamp-2">{{ decodeHtmlEntities(item.product?.name || 'Product') }}</p>
          <p class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</p>
        </div>
        <span class="font-bold text-sm shrink-0">
          {{ lineTotal(item) !== null ? formatCurrency(lineTotal(item) as number) : '—' }}
        </span>
      </li>
    </ul>

    <!-- Validation problems -->
    <div v-if="validationErrors.length > 0" class="mb-4 p-4 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-start gap-3" role="alert">
      <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
      <ul class="text-sm space-y-1">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>

    <!-- Totals (backend only) -->
    <div class="space-y-3 pt-5 border-t border-border font-medium" aria-live="polite">
      <div v-if="isValidating" class="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 class="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
        Calculating totals...
      </div>

      <template v-else-if="pricing">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Subtotal</span>
          <span>{{ formatCurrency(toMoney(pricing.subtotal)) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">
            Delivery<template v-if="validation?.shipping?.method_name"> ({{ validation.shipping.method_name }})</template>
          </span>
          <span :class="cn(toMoney(pricing.shipping_charge) === 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : '')">
            {{ toMoney(pricing.shipping_charge) === 0 ? 'Free' : formatCurrency(toMoney(pricing.shipping_charge)) }}
          </span>
        </div>
        <div v-if="toMoney(pricing.discount_total) > 0" class="flex justify-between text-sm">
          <span class="text-muted-foreground">Discount</span>
          <span>- {{ formatCurrency(toMoney(pricing.discount_total)) }}</span>
        </div>
        <div v-if="toMoney(pricing.tax_total) > 0" class="flex justify-between text-sm">
          <span class="text-muted-foreground">Tax</span>
          <span>{{ formatCurrency(toMoney(pricing.tax_total)) }}</span>
        </div>
        <div class="flex justify-between text-[20px] font-display font-bold pt-3 text-primary">
          <span>Total due</span>
          <span>{{ formatCurrency(toMoney(pricing.grand_total)) }}</span>
        </div>
      </template>

      <p v-else class="text-sm text-muted-foreground">
        Totals are calculated once a delivery address and option are chosen.
      </p>
    </div>

    <!-- Delivery note -->
    <div v-if="selectedOption && pricing" class="mt-6 p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
      <PackageCheck class="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
      <p class="text-xs text-primary/90 leading-relaxed font-medium">
        Delivery via <span class="font-bold">{{ selectedOption.shipping_method_name }}</span>
        to <span class="font-bold">{{ selectedOption.zone_name }}</span>. Payment is collected in cash on delivery.
      </p>
    </div>
    <div v-else class="mt-6 p-4 bg-muted/50 rounded-2xl flex items-start gap-3">
      <Truck class="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
      <p class="text-xs text-muted-foreground leading-relaxed font-medium">
        Choose your delivery area, address and delivery option to see the final charges.
      </p>
    </div>
  </aside>
</template>

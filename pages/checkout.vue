<!-- File: /pages/checkout.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  MapPin,
  Home,
  Banknote,
  Check,
  Loader2,
  AlertCircle,
  ShoppingCart,
  PackageCheck
} from 'lucide-vue-next';
import { cn, formatCurrency, decodeHtmlEntities } from '@/utils';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useShippingService } from '@/composables/useShippingService';
import { useCheckoutService } from '@/composables/useCheckoutService';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { useAnalytics } from '@/composables/useAnalytics';
import UiButton from '@/components/ui/Button.vue';
import UiBrandLogo from '@/components/ui/UiBrandLogo.vue';
import CheckoutDeliveryAreaStep from '@/components/commerce/checkout/CheckoutDeliveryAreaStep.vue';
import CheckoutAddressStep from '@/components/commerce/checkout/CheckoutAddressStep.vue';
import CheckoutShippingOptions from '@/components/commerce/checkout/CheckoutShippingOptions.vue';
import CheckoutOrderSummary from '@/components/commerce/checkout/CheckoutOrderSummary.vue';
import type { AvailableShippingZone, CustomerAddress, ShippingOption, ShippingOptionsResponse } from '@/types';
import type { CheckoutValidateResponse } from '@/types/checkout';
import type { Order } from '@/types/order';

useSeoMeta({
  title: 'Checkout',
  description: 'Complete your purchase securely at Best Computer Hub with cash on delivery and nationwide delivery in Bangladesh.',
  robots: 'noindex, nofollow'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const shippingService = useShippingService();
const checkoutService = useCheckoutService();
const analytics = useAnalytics();

// ── Steps ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Delivery area', icon: MapPin },
  { id: 2, label: 'Address', icon: Home },
  { id: 3, label: 'Delivery', icon: Truck },
  { id: 4, label: 'Review', icon: ShieldCheck }
] as const;

const step = ref<1 | 2 | 3 | 4>(1);

// ── Step 1: delivery area ────────────────────────────────────────

const zones = ref<AvailableShippingZone[]>([]);
const isLoadingZones = ref(false);
const zonesError = ref<string | null>(null);
const selectedZoneId = ref<number | null>(null);
const selectedZone = computed(() => zones.value.find((zone) => zone.id === selectedZoneId.value) ?? null);

const loadZones = async () => {
  isLoadingZones.value = true;
  zonesError.value = null;
  try {
    zones.value = await shippingService.getAvailableZones();
  } catch (err) {
    zonesError.value = extractErrorMessage(err, 'Delivery areas could not be loaded.');
  } finally {
    isLoadingZones.value = false;
  }
};

// ── Step 2: address ──────────────────────────────────────────────

const selectedAddress = ref<CustomerAddress | null>(null);

// ── Step 3: delivery option ──────────────────────────────────────

const shippingResponse = ref<ShippingOptionsResponse | null>(null);
const isLoadingOptions = ref(false);
const optionsError = ref<string | null>(null);
const selectedMethodId = ref<number | null>(null);
const shippingOptions = computed<ShippingOption[]>(() => shippingResponse.value?.options ?? []);
const selectedOption = computed(
  () => shippingOptions.value.find((option) => option.shipping_method_id === selectedMethodId.value) ?? null
);

const loadShippingOptions = async () => {
  if (!selectedAddress.value) return;
  isLoadingOptions.value = true;
  optionsError.value = null;
  shippingResponse.value = null;
  selectedMethodId.value = null;
  try {
    const response = await shippingService.getShippingOptions(selectedAddress.value.id);
    shippingResponse.value = response;
    if (response.options.length === 1 && response.options[0]) {
      selectedMethodId.value = response.options[0].shipping_method_id;
    }
  } catch (err) {
    optionsError.value = extractErrorMessage(err, 'Delivery options could not be loaded for this address.');
  } finally {
    isLoadingOptions.value = false;
  }
};

// ── Step 4: review and place order ───────────────────────────────

const validation = ref<CheckoutValidateResponse | null>(null);
const isValidating = ref(false);
const notes = ref('');
const idempotencyKey = ref<string | null>(null);
const isPlacing = ref(false);
const placedOrder = ref<Order | null>(null);
const isLoadingOrder = ref(false);

const runValidation = async (): Promise<boolean> => {
  if (!selectedAddress.value || selectedMethodId.value === null) return false;
  isValidating.value = true;
  try {
    validation.value = await checkoutService.validateCheckout({
      shipping_address_id: selectedAddress.value.id,
      shipping_method_id: selectedMethodId.value
    });
    return validation.value.is_valid;
  } catch (err) {
    validation.value = null;
    handleApiError(err, 'Your order could not be verified.');
    return false;
  } finally {
    isValidating.value = false;
  }
};

// A new idempotency key is required whenever the order inputs change.
watch([() => selectedAddress.value?.id, selectedMethodId, notes], () => {
  idempotencyKey.value = null;
});

// Keep the active step in view: a tall step (address form) can leave the
// window scrolled past the much shorter step that replaces it.
watch(step, () => {
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
});

const grandTotal = computed(() => (validation.value?.is_valid ? Number(validation.value.pricing?.grand_total ?? 0) : null));

const placeOrder = async () => {
  if (!selectedAddress.value || selectedMethodId.value === null) {
    toastError('Please choose a delivery address and option first.');
    return;
  }
  if (!validation.value?.is_valid) {
    toastError('Please resolve the issues in your order before placing it.');
    return;
  }

  if (!idempotencyKey.value) {
    idempotencyKey.value = checkoutService.generateIdempotencyKey();
  }

  isPlacing.value = true;
  try {
    const order = await checkoutService.createOrder({
      shipping_address_id: selectedAddress.value.id,
      shipping_method_id: selectedMethodId.value,
      idempotency_key: idempotencyKey.value,
      notes: notes.value.trim()
    });

    placedOrder.value = order;
    idempotencyKey.value = null;
    analytics.trackPurchase(order);
    cartStore.clearCart();

    if (order.status === 'cancelled') {
      toastError('This order was already cancelled. Please place a new order.');
    } else {
      toastSuccess('Order placed successfully.');
    }

    await router.replace({ path: '/checkout/', query: { orderId: order.id } });
  } catch (err) {
    handleApiError(err, 'Your order could not be placed. Please try again.');
  } finally {
    isPlacing.value = false;
  }
};

// ── Navigation between steps ─────────────────────────────────────

const goToStep = (target: 1 | 2 | 3 | 4) => {
  if (target < 4) validation.value = null;
  if (target < 3) {
    shippingResponse.value = null;
    selectedMethodId.value = null;
    optionsError.value = null;
  }
  if (target < 2) selectedAddress.value = null;
  step.value = target;
};

const continueToAddress = () => {
  if (selectedZoneId.value === null) {
    toastError('Please choose a delivery area.');
    return;
  }
  goToStep(2);
};

const handleAddressSelected = async (address: CustomerAddress) => {
  selectedAddress.value = address;
  step.value = 3;
  await loadShippingOptions();
};

const continueToReview = async () => {
  if (selectedMethodId.value === null) {
    toastError('Please choose a delivery option.');
    return;
  }
  const isValid = await runValidation();
  step.value = 4;
  if (!isValid && validation.value) {
    toastError(validation.value.errors[0] ?? 'Your order could not be verified.');
  }
  if (isValid && validation.value?.pricing && selectedOption.value) {
    analytics.trackAddShippingInfo(
      cartStore.items,
      validation.value.shipping?.method_name || selectedOption.value.shipping_method_name,
      Number(validation.value.pricing.grand_total)
    );
  }
};

watch(selectedZoneId, (zoneId, previous) => {
  if (previous !== undefined && previous !== null && zoneId !== previous && step.value > 1) {
    goToStep(1);
  }
});

// ── Derived display helpers ──────────────────────────────────────

const profileFirstName = computed(() => (authStore.user?.name || '').split(' ')[0] || '');
const profileLastName = computed(() => (authStore.user?.name || '').split(' ').slice(1).join(' '));

const isCartEmpty = computed(() => !cartStore.isLoading && cartStore.items.length === 0);

const orderStatusLabel = (status: string) => status.replace(/_/g, ' ');

// ── Init ─────────────────────────────────────────────────────────

onMounted(async () => {
  const orderIdParam = Array.isArray(route.query.orderId) ? route.query.orderId[0] : route.query.orderId;
  if (orderIdParam) {
    isLoadingOrder.value = true;
    try {
      placedOrder.value = await checkoutService.getOrderDetails(orderIdParam);
    } catch (err) {
      handleApiError(err, 'The order could not be loaded.');
    } finally {
      isLoadingOrder.value = false;
    }
    return;
  }

  if (!authStore.isLoggedIn) return;
  await Promise.all([cartStore.fetchCart(), loadZones()]);
  analytics.trackBeginCheckout(cartStore.items);
});
</script>

<template>
  <div class="min-h-screen bg-muted/20 pb-20">
    <!-- Minimal header with progress -->
    <header class="bg-background border-b border-border py-5 mb-8 sm:mb-12">
      <div class="container mx-auto px-4 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="shrink-0" aria-label="Best Computer Hub home">
          <UiBrandLogo size="md" />
        </NuxtLink>

        <ol v-if="!placedOrder" class="hidden md:flex items-center gap-3 lg:gap-5 text-[11px] font-bold uppercase tracking-widest" aria-label="Checkout progress">
          <template v-for="(item, index) in STEPS" :key="item.id">
            <li
              :class="cn('flex items-center gap-1.5', step >= item.id ? 'text-primary' : 'text-muted-foreground')"
              :aria-current="step === item.id ? 'step' : undefined"
            >
              <span
                :class="cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center text-[10px]',
                  step > item.id ? 'bg-primary border-primary text-primary-foreground' : step === item.id ? 'border-primary' : 'border-muted-foreground/40'
                )"
                aria-hidden="true"
              >
                <Check v-if="step > item.id" class="w-3 h-3" />
                <template v-else>{{ item.id }}</template>
              </span>
              {{ item.label }}
            </li>
            <ChevronRight v-if="index < STEPS.length - 1" class="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </template>
        </ol>

        <div v-if="!placedOrder" class="md:hidden text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
          Step {{ step }} of {{ STEPS.length }}
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
          <ShieldCheck class="w-4 h-4" aria-hidden="true" />
          Secure checkout
        </div>
      </div>
    </header>

    <!-- Loading an existing order (?orderId=) -->
    <div v-if="isLoadingOrder" class="container mx-auto px-4 py-20 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 class="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
      Loading your order...
    </div>

    <!-- Success -->
    <div v-else-if="placedOrder" class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto py-10 sm:py-16 space-y-8">
        <div class="text-center space-y-3">
          <div
            :class="cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
              placedOrder.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            )"
            aria-hidden="true"
          >
            <AlertCircle v-if="placedOrder.status === 'cancelled'" class="w-10 h-10" />
            <PackageCheck v-else class="w-10 h-10" />
          </div>
          <h1 class="text-[26px] font-display font-extrabold tracking-tight">
            {{ placedOrder.status === 'cancelled' ? 'Order cancelled' : 'Order placed' }}
          </h1>
          <p class="text-muted-foreground text-sm">
            <template v-if="placedOrder.status === 'cancelled'">This order is no longer active. Please place a new order.</template>
            <template v-else>Thank you. We will confirm your order shortly and collect payment in cash on delivery.</template>
          </p>
        </div>

        <section class="bg-card text-card-foreground p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6" aria-labelledby="order-receipt-heading">
          <h2 id="order-receipt-heading" class="sr-only">Order receipt</h2>
          <div class="flex flex-wrap justify-between gap-4 border-b border-border pb-6">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order number</p>
              <p class="text-lg font-mono font-bold">{{ placedOrder.orderNumber }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</p>
              <p class="text-lg font-bold capitalize">{{ orderStatusLabel(placedOrder.status) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div class="space-y-1">
              <p class="text-xs font-bold uppercase text-muted-foreground">Shipping address</p>
              <template v-if="placedOrder.shippingAddress">
                <p>{{ placedOrder.shippingAddress.firstName }} {{ placedOrder.shippingAddress.lastName }}</p>
                <p>{{ placedOrder.shippingAddress.street }}</p>
                <p v-if="placedOrder.shippingAddress.street2">{{ placedOrder.shippingAddress.street2 }}</p>
                <p>
                  {{ placedOrder.shippingAddress.city }}<template v-if="placedOrder.shippingAddress.state">, {{ placedOrder.shippingAddress.state }}</template>
                  {{ placedOrder.shippingAddress.zipCode }}
                </p>
                <p>{{ placedOrder.shippingAddress.country }}</p>
                <p v-if="placedOrder.shippingAddress.phone" class="text-muted-foreground">{{ placedOrder.shippingAddress.phone }}</p>
              </template>
              <p v-else class="text-muted-foreground">Not available</p>
            </div>
            <div class="space-y-4">
              <div class="space-y-1">
                <p class="text-xs font-bold uppercase text-muted-foreground">Delivery</p>
                <p>{{ placedOrder.shippingMethod?.name || 'Not available' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold uppercase text-muted-foreground">Payment</p>
                <p class="capitalize">Cash on delivery · {{ placedOrder.paymentStatus }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-3 pt-6 border-t border-border">
            <p class="text-xs font-bold uppercase text-muted-foreground">Items</p>
            <div v-for="item in placedOrder.items" :key="item.id" class="flex justify-between gap-4 text-sm">
              <p>{{ decodeHtmlEntities(item.product.name) }} <span class="text-muted-foreground">× {{ item.quantity }}</span></p>
              <p class="shrink-0">{{ formatCurrency(item.lineTotal ?? item.price * item.quantity) }}</p>
            </div>
            <div class="space-y-2 pt-4 border-t border-border text-sm">
              <div class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>{{ formatCurrency(placedOrder.subtotal ?? 0) }}</span></div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Delivery</span>
                <span>{{ (placedOrder.shippingCharge ?? 0) === 0 ? 'Free' : formatCurrency(placedOrder.shippingCharge ?? 0) }}</span>
              </div>
              <div class="flex justify-between font-bold text-[18px] pt-2"><span>Total</span><span>{{ formatCurrency(placedOrder.totalAmount) }}</span></div>
            </div>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <UiButton :to="`/my-account/orders/${placedOrder.id}/`" size="lg" class="rounded-full w-full sm:w-auto">View order</UiButton>
          <UiButton to="/" size="lg" variant="outline" class="rounded-full w-full sm:w-auto">Continue shopping</UiButton>
        </div>
      </div>
    </div>

    <!-- Empty cart -->
    <div v-else-if="isCartEmpty" class="container mx-auto px-4">
      <div class="max-w-xl mx-auto py-16 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto" aria-hidden="true">
          <ShoppingCart class="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 class="text-[26px] font-display font-extrabold">Your cart is empty</h1>
        <p class="text-sm text-muted-foreground">Add some products before checking out.</p>
        <UiButton to="/" size="lg" class="rounded-full">Browse products</UiButton>
      </div>
    </div>

    <!-- Checkout flow -->
    <div v-else class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto">
        <div class="lg:col-span-7 space-y-6">
          <!-- Completed step recaps -->
          <section v-if="step > 1 && selectedZone" class="bg-background rounded-2xl px-5 py-4 border border-border flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <MapPin class="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <p class="text-sm truncate"><span class="text-muted-foreground">Delivery area:</span> <span class="font-bold">{{ selectedZone.name }}</span></p>
            </div>
            <button type="button" class="text-xs font-bold text-primary hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" @click="goToStep(1)">Change</button>
          </section>

          <section v-if="step > 2 && selectedAddress" class="bg-background rounded-2xl px-5 py-4 border border-border flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <Home class="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <p class="text-sm truncate">
                <span class="text-muted-foreground">Address:</span>
                <span class="font-bold">{{ selectedAddress.first_name }} {{ selectedAddress.last_name }}</span>,
                {{ selectedAddress.address_1 }}, {{ selectedAddress.city }}
              </p>
            </div>
            <button type="button" class="text-xs font-bold text-primary hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" @click="goToStep(2)">Change</button>
          </section>

          <section v-if="step > 3 && selectedOption" class="bg-background rounded-2xl px-5 py-4 border border-border flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <Truck class="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <p class="text-sm truncate">
                <span class="text-muted-foreground">Delivery:</span>
                <span class="font-bold">{{ selectedOption.shipping_method_name }}</span>
                · {{ Number(selectedOption.shipping_charge) === 0 ? 'Free' : formatCurrency(Number(selectedOption.shipping_charge)) }}
              </p>
            </div>
            <button type="button" class="text-xs font-bold text-primary hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" @click="goToStep(3)">Change</button>
          </section>

          <!-- Active step card -->
          <section class="bg-background rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6" :aria-labelledby="`checkout-step-${step}-heading`">
            <h2 :id="`checkout-step-${step}-heading`" class="text-[24px] font-display font-bold flex items-center gap-3">
              <component :is="STEPS[step - 1]?.icon ?? MapPin" class="w-6 h-6 text-primary" aria-hidden="true" />
              <template v-if="step === 1">Where are we delivering?</template>
              <template v-else-if="step === 2">Shipping address</template>
              <template v-else-if="step === 3">Delivery option</template>
              <template v-else>Review and place order</template>
            </h2>

            <!-- Step 1 -->
            <div v-if="step === 1" key="step-1" class="space-y-6">
              <CheckoutDeliveryAreaStep
                v-model="selectedZoneId"
                :zones="zones"
                :is-loading="isLoadingZones"
                :error="zonesError"
                @retry="loadZones"
              />
              <UiButton class="w-full h-12 rounded-2xl font-bold" :disabled="selectedZoneId === null || isLoadingZones" @click="continueToAddress">
                Continue to address
              </UiButton>
            </div>

            <!-- Step 2 -->
            <div v-else-if="step === 2 && selectedZone" key="step-2" class="space-y-6">
              <CheckoutAddressStep
                :key="selectedZone.id"
                :zone="selectedZone"
                :model-value="selectedAddress"
                :default-first-name="profileFirstName"
                :default-last-name="profileLastName"
                @update:model-value="handleAddressSelected"
              />
            </div>

            <!-- Step 3 -->
            <div v-else-if="step === 3" key="step-3" class="space-y-6">
              <CheckoutShippingOptions
                v-model="selectedMethodId"
                :options="shippingOptions"
                :zone-name="shippingResponse?.zone.name ?? selectedZone?.name ?? null"
                :is-loading="isLoadingOptions"
                :error="optionsError"
                @retry="loadShippingOptions"
              />
              <UiButton
                class="w-full h-12 rounded-2xl font-bold gap-2"
                :disabled="selectedMethodId === null || isLoadingOptions || isValidating"
                @click="continueToReview"
              >
                <Loader2 v-if="isValidating" class="w-4 h-4 animate-spin" aria-hidden="true" />
                {{ isValidating ? 'Checking your order...' : 'Continue to review' }}
              </UiButton>
            </div>

            <!-- Step 4 -->
            <div v-else-if="step === 4" key="step-4" class="space-y-6">
              <div class="space-y-5">
                <div>
                  <h3 class="text-[18px] font-bold mb-3">Payment method</h3>
                  <div class="p-4 rounded-2xl border-2 border-primary bg-primary/5 flex items-center gap-4" role="radio" aria-checked="true">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shrink-0" aria-hidden="true">
                      <Banknote class="w-6 h-6" />
                    </div>
                    <div class="flex-grow">
                      <p class="font-bold text-sm">Cash on Delivery</p>
                      <p class="text-xs text-muted-foreground">Pay our delivery partner when your order arrives.</p>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center shrink-0" aria-hidden="true">
                      <Check class="w-3 h-3" />
                    </div>
                  </div>
                  <!--
                    TEMPORARILY DISABLED: Bank Card and MFS (bKash / Nagad / Rocket) payment options.
                    The backend accepts Cash on Delivery only (POST /api/v1/checkout/confirm/ has no payment
                    fields). Restore guidance lives in /docs/agent-context/disabled-features.md (section 7).

                    <button
                      v-for="method in [
                        { id: 'card', name: 'Bank Card', icon: CreditCard, subtitle: 'Visa, Mastercard, Amex' },
                        { id: 'mfs', name: 'MFS', icon: Smartphone, subtitle: 'bKash, Nagad, Rocket' },
                        { id: 'cod', name: 'Cash on Delivery', icon: Banknote, subtitle: 'Pay when you receive' }
                      ]"
                      :key="method.id"
                      @click="form.paymentMethod = method.id"
                      :class="cn(
                        'p-4 rounded-2xl flex items-center justify-between border-2 transition-all text-left w-full',
                        form.paymentMethod === method.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted hover:border-primary/20 bg-background'
                      )"
                    >
                      <div class="flex items-center gap-4">
                        <div :class="cn('w-12 h-12 rounded-xl flex items-center justify-center', form.paymentMethod === method.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')">
                          <component :is="method.icon" class="w-6 h-6" />
                        </div>
                        <div>
                          <p class="font-bold text-sm">{{ method.name }}</p>
                          <p class="text-xs text-muted-foreground">{{ method.subtitle }}</p>
                        </div>
                      </div>
                    </button>

                    <div v-if="form.paymentMethod === 'card'" class="space-y-4 pt-4">
                      <input v-model="form.cardNumber" type="text" placeholder="0000 0000 0000 0000" />
                      <input v-model="form.expiry" type="text" placeholder="MM / YY" />
                      <input v-model="form.cvv" type="text" placeholder="123" />
                    </div>

                    <div v-if="form.paymentMethod === 'mfs'" class="space-y-4 pt-4">
                      <button v-for="mfs in ['bkash', 'nagad', 'rocket']" :key="mfs" @click="form.mfsType = mfs">{{ mfs }}</button>
                      <input v-model="form.mfsNumber" type="text" placeholder="01XXX-XXXXXX" />
                      <input v-model="form.mfsTransactionId" type="text" placeholder="TRX-XXXXXXX" />
                      <p>Please complete the payment to our merchant number first, then provide the Transaction ID above.</p>
                    </div>
                  -->
                </div>

                <div class="p-5 bg-muted rounded-2xl flex items-start gap-4">
                  <div class="w-10 h-10 bg-background rounded-full flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                    <Truck class="w-5 h-5" />
                  </div>
                  <div class="space-y-1 text-sm">
                    <p class="font-bold">Cash payment upon delivery</p>
                    <p class="text-xs text-muted-foreground leading-relaxed">
                      <template v-if="grandTotal !== null">Please keep {{ formatCurrency(grandTotal) }} ready for our delivery partner.</template>
                      <template v-else>The amount due will be shown once your order has been verified.</template>
                    </p>
                  </div>
                </div>

                <div>
                  <label for="checkout-notes" class="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Order notes (optional)</label>
                  <textarea
                    id="checkout-notes"
                    v-model="notes"
                    rows="3"
                    maxlength="500"
                    placeholder="Delivery instructions, preferred time, landmark..."
                    class="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  />
                </div>

                <div v-if="validation && !validation.is_valid" class="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-start gap-3" role="alert">
                  <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                  <div class="text-sm space-y-2">
                    <ul class="space-y-1">
                      <li v-for="(message, index) in validation.errors" :key="index">{{ message }}</li>
                    </ul>
                    <button type="button" class="text-xs font-bold text-primary hover:underline" @click="runValidation">Re-check order</button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <UiButton type="button" variant="outline" class="h-12 rounded-2xl font-bold gap-1.5 sm:w-auto" @click="goToStep(3)">
                  <ChevronLeft class="w-4 h-4" aria-hidden="true" />
                  Back
                </UiButton>
                <UiButton
                  class="flex-grow h-12 rounded-2xl font-bold gap-2"
                  :disabled="isPlacing || isValidating || !validation?.is_valid"
                  @click="placeOrder"
                >
                  <Loader2 v-if="isPlacing" class="w-5 h-5 animate-spin" aria-hidden="true" />
                  <ShieldCheck v-else class="w-5 h-5" aria-hidden="true" />
                  <template v-if="isPlacing">Placing your order...</template>
                  <template v-else-if="grandTotal !== null">Place order · {{ formatCurrency(grandTotal) }}</template>
                  <template v-else>Place order</template>
                </UiButton>
              </div>
            </div>
          </section>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-5">
          <CheckoutOrderSummary
            :items="cartStore.items"
            :validation="validation"
            :is-validating="isValidating"
            :selected-option="selectedOption"
          />
        </div>
      </div>
    </div>
  </div>
</template>

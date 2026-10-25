<!-- File: /components/commerce/checkout/CheckoutAddressStep.vue -->
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { MapPin, Plus, Check, Loader2, ChevronLeft } from 'lucide-vue-next';
import { cn } from '@/utils';
import { useCustomerAddressService } from '@/composables/useCustomerAddressService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { toastSuccess, toastError, handleApiError } from '@/composables/useToast';
import UiButton from '@/components/ui/Button.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import type { AvailableShippingZone, CustomerAddress, CreateCustomerAddressPayload } from '@/types';

interface Props {
  /** Delivery area chosen in the previous step. */
  zone: AvailableShippingZone;
  /** Currently selected address, if any. */
  modelValue: CustomerAddress | null;
  /** Prefill for the new-address form (from the signed-in profile). */
  defaultFirstName?: string;
  defaultLastName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultFirstName: '',
  defaultLastName: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', address: CustomerAddress): void;
}>();

const addressService = useCustomerAddressService();

const ADDRESS_PAGE_SIZE = 10;

const {
  items: addresses,
  hasMore,
  isLoading: isLoadingAddresses,
  isFetchingNextPage,
  error: addressesError,
  loadNextPage,
  fetchFirstPage
} = useInfinitePagination<CustomerAddress>({
  fetcher: ({ page }) => addressService.getCustomerAddresses({ page, page_size: ADDRESS_PAGE_SIZE }),
  pageSize: ADDRESS_PAGE_SIZE,
  dedupeKey: (address) => address.id
});

/** Saved SHIPPING addresses usable for this delivery area: tagged with it, or not tagged yet. */
const eligibleAddresses = computed(() =>
  addresses.value.filter(
    (address) =>
      address.address_type === 'SHIPPING' &&
      (address.shipping_zone === null || address.shipping_zone === undefined || address.shipping_zone === props.zone.id)
  )
);

/** Shipping addresses that belong to another delivery area (hidden, counted for the hint). */
const hiddenAddressCount = computed(
  () =>
    addresses.value.filter(
      (address) =>
        address.address_type === 'SHIPPING' &&
        address.shipping_zone !== null &&
        address.shipping_zone !== undefined &&
        address.shipping_zone !== props.zone.id
    ).length
);

const mode = ref<'list' | 'new'>('list');

// Once the first page has finished loading, open the form directly when
// nothing is reusable. The watcher must not fire before the fetch starts,
// otherwise the (still empty) list would always open the form.
watch(isLoadingAddresses, (loading, wasLoading) => {
  if (wasLoading && !loading && eligibleAddresses.value.length === 0 && !addressesError.value) {
    mode.value = 'new';
  }
});

const taggingAddressId = ref<number | null>(null);

const handleSelect = async (address: CustomerAddress) => {
  if (taggingAddressId.value !== null) return;

  if (address.shipping_zone === props.zone.id) {
    emit('update:modelValue', address);
    return;
  }

  // Legacy address without a delivery area: record the customer's choice on it.
  taggingAddressId.value = address.id;
  try {
    const updated = await addressService.updateCustomerAddress(address.id, { shipping_zone: props.zone.id });
    const merged: CustomerAddress = { ...address, ...updated };
    const index = addresses.value.findIndex((item) => item.id === address.id);
    if (index > -1) addresses.value.splice(index, 1, merged);
    emit('update:modelValue', merged);
  } catch (err) {
    handleApiError(err, 'Failed to assign the delivery area to this address.');
  } finally {
    taggingAddressId.value = null;
  }
};

const newAddress = reactive<Omit<CreateCustomerAddressPayload, 'address_type' | 'shipping_zone'>>({
  first_name: props.defaultFirstName,
  last_name: props.defaultLastName,
  phone: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Bangladesh'
});

const firstInputRef = ref<HTMLInputElement | null>(null);

watch(mode, (value) => {
  if (value === 'new') {
    requestAnimationFrame(() => firstInputRef.value?.focus());
  }
});

const handleCreate = async () => {
  if (
    !newAddress.first_name.trim() ||
    !newAddress.last_name.trim() ||
    !newAddress.phone.trim() ||
    !newAddress.address_1.trim() ||
    !newAddress.city.trim() ||
    !newAddress.country.trim()
  ) {
    toastError('Please fill in all required address fields.');
    return;
  }

  try {
    const created = await addressService.createCustomerAddress({
      address_type: 'SHIPPING',
      first_name: newAddress.first_name.trim(),
      last_name: newAddress.last_name.trim(),
      phone: newAddress.phone.trim(),
      address_1: newAddress.address_1.trim(),
      address_2: newAddress.address_2?.trim() ?? '',
      city: newAddress.city.trim(),
      state: newAddress.state.trim(),
      postcode: newAddress.postcode.trim(),
      country: newAddress.country.trim(),
      shipping_zone: props.zone.id
    });

    if (!created) {
      toastError('The address could not be saved. Please try again.');
      return;
    }

    toastSuccess('Shipping address saved.');
    addresses.value.unshift(created);
    newAddress.address_1 = '';
    newAddress.address_2 = '';
    newAddress.city = '';
    newAddress.state = '';
    newAddress.postcode = '';
    mode.value = 'list';
    emit('update:modelValue', created);
  } catch (err) {
    handleApiError(err, 'Failed to save the address.');
  }
};

const inputClass =
  'w-full h-11 bg-background border border-input rounded-xl px-3.5 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60';
const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1';
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted-foreground">
      Delivering to <span class="font-bold text-foreground">{{ zone.name }}</span>. Choose a saved address or enter a new one.
    </p>

    <!-- Saved addresses -->
    <div v-if="mode === 'list'" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-[18px] font-bold flex items-center gap-2">
          <MapPin class="w-4 h-4 text-primary" aria-hidden="true" />
          Saved addresses
        </h3>
        <UiButton type="button" size="sm" variant="outline" class="rounded-xl gap-1.5" @click="mode = 'new'">
          <Plus class="w-3.5 h-3.5" aria-hidden="true" />
          New address
        </UiButton>
      </div>

      <div v-if="isLoadingAddresses" class="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 class="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
        Loading saved addresses...
      </div>

      <div v-else-if="addressesError" class="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-sm" role="alert">
        <p class="font-medium">{{ addressesError }}</p>
        <button type="button" class="mt-2 text-xs font-bold text-primary hover:underline" @click="fetchFirstPage()">Try again</button>
      </div>

      <div v-else-if="eligibleAddresses.length === 0" class="p-6 rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
        No saved address for this delivery area yet.
      </div>

      <div v-else class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[22rem] overflow-y-auto pr-1">
          <button
            v-for="address in eligibleAddresses"
            :key="address.id"
            type="button"
            :disabled="taggingAddressId !== null"
            :aria-pressed="modelValue?.id === address.id"
            :class="cn(
              'text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 bg-card',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              modelValue?.id === address.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40',
              taggingAddressId !== null && taggingAddressId !== address.id ? 'opacity-60' : ''
            )"
            @click="handleSelect(address)"
          >
            <span class="flex items-start justify-between gap-2">
              <span class="font-bold text-sm text-card-foreground">{{ address.first_name }} {{ address.last_name }}</span>
              <span
                :class="cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  modelValue?.id === address.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                )"
                aria-hidden="true"
              >
                <Loader2 v-if="taggingAddressId === address.id" class="w-3 h-3 animate-spin" />
                <Check v-else-if="modelValue?.id === address.id" class="w-3 h-3" />
              </span>
            </span>
            <span class="block text-xs text-muted-foreground leading-relaxed">
              <span v-if="address.address_1" class="block">{{ address.address_1 }}</span>
              <span v-if="address.address_2" class="block">{{ address.address_2 }}</span>
              <span class="block">
                {{ [address.city, address.state].filter(Boolean).join(', ') }}{{ address.postcode ? ` ${address.postcode}` : '' }}
              </span>
              <span class="block">{{ address.country }}</span>
              <span v-if="address.phone" class="block">Phone: {{ address.phone }}</span>
            </span>
            <span class="flex items-center gap-2 pt-1">
              <span
                v-if="address.shipping_zone === zone.id"
                class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary"
              >
                {{ address.shipping_zone_name || zone.name }}
              </span>
              <span v-else class="text-[10px] text-muted-foreground italic">Will be saved as {{ zone.name }}</span>
            </span>
          </button>
        </div>

        <UiInfiniteScroll
          :has-more="hasMore"
          :is-loading="isFetchingNextPage"
          :show-end-text="false"
          @load-more="loadNextPage"
          @retry="loadNextPage"
        />
      </div>

      <p v-if="hiddenAddressCount > 0" class="text-xs text-muted-foreground">
        {{ hiddenAddressCount }} saved {{ hiddenAddressCount === 1 ? 'address belongs' : 'addresses belong' }} to a different delivery area and {{ hiddenAddressCount === 1 ? 'is' : 'are' }} hidden. Go back to change the delivery area, or add a new address.
      </p>
    </div>

    <!-- New address form -->
    <form v-else class="space-y-4" novalidate @submit.prevent="handleCreate">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-[18px] font-bold flex items-center gap-2">
          <Plus class="w-4 h-4 text-primary" aria-hidden="true" />
          New shipping address
        </h3>
        <button
          v-if="eligibleAddresses.length > 0"
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          @click="mode = 'list'"
        >
          <ChevronLeft class="w-3.5 h-3.5" aria-hidden="true" />
          Use a saved address
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="checkout-first-name" :class="labelClass">First name <span aria-hidden="true">*</span></label>
          <input id="checkout-first-name" ref="firstInputRef" v-model="newAddress.first_name" type="text" autocomplete="given-name" required :class="inputClass" />
        </div>
        <div>
          <label for="checkout-last-name" :class="labelClass">Last name <span aria-hidden="true">*</span></label>
          <input id="checkout-last-name" v-model="newAddress.last_name" type="text" autocomplete="family-name" required :class="inputClass" />
        </div>
        <div class="sm:col-span-2">
          <label for="checkout-phone" :class="labelClass">Phone <span aria-hidden="true">*</span></label>
          <input id="checkout-phone" v-model="newAddress.phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="01XXXXXXXXX" required :class="inputClass" />
        </div>
        <div class="sm:col-span-2">
          <label for="checkout-address-1" :class="labelClass">Street address <span aria-hidden="true">*</span></label>
          <input id="checkout-address-1" v-model="newAddress.address_1" type="text" autocomplete="address-line1" placeholder="House, road, block" required :class="inputClass" />
        </div>
        <div class="sm:col-span-2">
          <label for="checkout-address-2" :class="labelClass">Apartment, floor, landmark</label>
          <input id="checkout-address-2" v-model="newAddress.address_2" type="text" autocomplete="address-line2" :class="inputClass" />
        </div>
        <div>
          <label for="checkout-city" :class="labelClass">City / Area <span aria-hidden="true">*</span></label>
          <input id="checkout-city" v-model="newAddress.city" type="text" autocomplete="address-level2" required :class="inputClass" />
        </div>
        <div>
          <label for="checkout-state" :class="labelClass">District / Division</label>
          <input id="checkout-state" v-model="newAddress.state" type="text" autocomplete="address-level1" :class="inputClass" />
        </div>
        <div>
          <label for="checkout-postcode" :class="labelClass">Postal code</label>
          <input id="checkout-postcode" v-model="newAddress.postcode" type="text" autocomplete="postal-code" inputmode="numeric" :class="inputClass" />
        </div>
        <div>
          <label for="checkout-country" :class="labelClass">Country <span aria-hidden="true">*</span></label>
          <input id="checkout-country" v-model="newAddress.country" type="text" autocomplete="country-name" required :class="inputClass" />
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        This address will be saved to your account for <span class="font-bold text-foreground">{{ zone.name }}</span> deliveries.
        <template v-if="hiddenAddressCount > 0">
          {{ hiddenAddressCount }} saved {{ hiddenAddressCount === 1 ? 'address belongs' : 'addresses belong' }} to a different delivery area; change the delivery area above to use {{ hiddenAddressCount === 1 ? 'it' : 'them' }}.
        </template>
      </p>

      <UiButton type="submit" class="w-full h-11 rounded-xl font-bold gap-2" :disabled="addressService.isCreating.value">
        <Loader2 v-if="addressService.isCreating.value" class="w-4 h-4 animate-spin" aria-hidden="true" />
        {{ addressService.isCreating.value ? 'Saving address...' : 'Save and use this address' }}
      </UiButton>
    </form>
  </div>
</template>

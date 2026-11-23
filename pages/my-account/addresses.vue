<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Check,
  Building2,
  Phone
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/auth';
import { useCustomerAddressService } from '@/composables/useCustomerAddressService';
import { useShippingService } from '@/composables/useShippingService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { toastSuccess, handleApiError, extractErrorMessage } from '@/composables/useToast';
import type {
  CustomerAddress,
  AvailableShippingZone,
  CreateCustomerAddressPayload,
  UpdateCustomerAddressPayload
} from '@/types';

useSeoMeta({
  title: 'Saved Addresses'
});

const authStore = useAuthStore();
const addressService = useCustomerAddressService();
const shippingService = useShippingService();

const PAGE_SIZE = 10;

const {
  items: addresses,
  totalCount,
  hasMore,
  isLoading: isLoadingAddresses,
  isFetchingNextPage,
  error: paginationError,
  loadNextPage,
  fetchFirstPage
} = useInfinitePagination<CustomerAddress>({
  fetcher: ({ page }) => addressService.getCustomerAddresses({ page, page_size: PAGE_SIZE }),
  pageSize: PAGE_SIZE,
  dedupeKey: (address) => address.id
});

const loadError = computed(() => paginationError.value || addressService.errorMsg.value);

// Delivery areas (ShippingZone) for optional zone tagging
const zones = ref<AvailableShippingZone[]>([]);
const isLoadingZones = ref(false);

const loadZones = async () => {
  if (zones.value.length > 0 || isLoadingZones.value) return;
  isLoadingZones.value = true;
  try {
    zones.value = await shippingService.getAvailableZones();
  } catch {
    // Delivery area selector remains optional if zones are unavailable
  } finally {
    isLoadingZones.value = false;
  }
};

onMounted(() => {
  loadZones();
});

// Add / Edit Form State
type AddressFormField =
  | 'address_type'
  | 'first_name'
  | 'last_name'
  | 'company'
  | 'phone'
  | 'address_1'
  | 'address_2'
  | 'city'
  | 'state'
  | 'postcode'
  | 'country'
  | 'shipping_zone';

const isFormOpen = ref(false);
const editingAddressId = ref<number | null>(null);
const isLoadingDetail = ref(false);
const firstInputRef = ref<HTMLInputElement | null>(null);
const formError = ref<string | null>(null);

const form = reactive<{
  address_type: 'SHIPPING' | 'BILLING';
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  shipping_zone: number | null;
}>({
  address_type: 'SHIPPING',
  first_name: '',
  last_name: '',
  company: '',
  phone: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Bangladesh',
  shipping_zone: null
});

const fieldErrors = reactive<Record<AddressFormField, string>>({
  address_type: '',
  first_name: '',
  last_name: '',
  company: '',
  phone: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  shipping_zone: ''
});

const isSubmitting = computed(() => addressService.isCreating.value || addressService.isUpdating.value);

const clearFormErrors = () => {
  (Object.keys(fieldErrors) as AddressFormField[]).forEach((key) => {
    fieldErrors[key] = '';
  });
  formError.value = null;
};

const resetForm = () => {
  form.address_type = 'SHIPPING';
  form.first_name = authStore.user?.first_name ?? '';
  form.last_name = authStore.user?.last_name ?? '';
  form.company = '';
  form.phone = '';
  form.address_1 = '';
  form.address_2 = '';
  form.city = '';
  form.state = '';
  form.postcode = '';
  form.country = 'Bangladesh';
  form.shipping_zone = null;
  clearFormErrors();
};

const populateFormFromAddress = (address: CustomerAddress) => {
  form.address_type = address.address_type === 'BILLING' ? 'BILLING' : 'SHIPPING';
  form.first_name = address.first_name ?? '';
  form.last_name = address.last_name ?? '';
  form.company = address.company ?? '';
  form.phone = address.phone ?? '';
  form.address_1 = address.address_1 ?? '';
  form.address_2 = address.address_2 ?? '';
  form.city = address.city ?? '';
  form.state = address.state ?? '';
  form.postcode = address.postcode ?? '';
  form.country = address.country ?? 'Bangladesh';
  form.shipping_zone = address.shipping_zone ?? null;
};

const openCreateForm = async () => {
  confirmDeleteId.value = null;
  editingAddressId.value = null;
  resetForm();
  isFormOpen.value = true;
  await nextTick();
  firstInputRef.value?.focus();
};

const openEditForm = async (address: CustomerAddress) => {
  confirmDeleteId.value = null;
  editingAddressId.value = address.id;
  clearFormErrors();
  populateFormFromAddress(address);
  isFormOpen.value = true;
  isLoadingDetail.value = true;

  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  try {
    const detail = await addressService.getCustomerAddress(address.id);
    if (editingAddressId.value === address.id) {
      populateFormFromAddress(detail);
    }
  } catch {
    // Keep list-item fields if detail fetch fails
  } finally {
    isLoadingDetail.value = false;
    await nextTick();
    firstInputRef.value?.focus();
  }
};

const closeForm = () => {
  isFormOpen.value = false;
  editingAddressId.value = null;
  resetForm();
};

const validateForm = (): boolean => {
  clearFormErrors();
  let valid = true;

  if (!form.first_name.trim()) {
    fieldErrors.first_name = 'First name is required.';
    valid = false;
  }
  if (!form.last_name.trim()) {
    fieldErrors.last_name = 'Last name is required.';
    valid = false;
  }
  if (!form.phone.trim()) {
    fieldErrors.phone = 'Phone number is required.';
    valid = false;
  }
  if (!form.address_1.trim()) {
    fieldErrors.address_1 = 'Street address is required.';
    valid = false;
  }
  if (!form.city.trim()) {
    fieldErrors.city = 'City is required.';
    valid = false;
  }
  if (!form.country.trim()) {
    fieldErrors.country = 'Country is required.';
    valid = false;
  }

  return valid;
};

const applyServerErrors = (err: any) => {
  const data = err?.data || err?.response?._data;
  if (data && typeof data === 'object') {
    (Object.keys(fieldErrors) as AddressFormField[]).forEach((key) => {
      const raw = (data as Record<string, unknown>)[key];
      if (Array.isArray(raw) && raw.length > 0) {
        fieldErrors[key] = String(raw[0]);
      } else if (typeof raw === 'string' && raw.trim()) {
        fieldErrors[key] = raw;
      }
    });
  }
  formError.value = extractErrorMessage(err, 'Failed to save address.');
};

const handleSubmit = async () => {
  if (isSubmitting.value || isLoadingDetail.value) return;
  if (!validateForm()) return;

  clearFormErrors();

  const payload: CreateCustomerAddressPayload = {
    address_type: form.address_type,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    company: form.company.trim(),
    phone: form.phone.trim(),
    address_1: form.address_1.trim(),
    address_2: form.address_2.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postcode: form.postcode.trim(),
    country: form.country.trim(),
    shipping_zone: form.shipping_zone
  };

  try {
    if (editingAddressId.value !== null) {
      const updatePayload: UpdateCustomerAddressPayload = { ...payload };
      await addressService.updateCustomerAddress(editingAddressId.value, updatePayload);
      toastSuccess('Address updated successfully.');
    } else {
      await addressService.createCustomerAddress(payload);
      toastSuccess('Address added successfully.');
    }

    closeForm();
    await fetchFirstPage();
  } catch (err: any) {
    applyServerErrors(err);
    handleApiError(err, 'Failed to save address.');
  }
};

// Delete State
const confirmDeleteId = ref<number | null>(null);
const deletingId = ref<number | null>(null);

const requestDelete = (id: number) => {
  confirmDeleteId.value = id;
};

const cancelDelete = () => {
  confirmDeleteId.value = null;
};

const confirmDelete = async (id: number) => {
  if (deletingId.value !== null) return;
  deletingId.value = id;

  try {
    await addressService.deleteCustomerAddress(id);
    addresses.value = addresses.value.filter((item) => item.id !== id);
    if (totalCount.value > 0) {
      totalCount.value -= 1;
    }
    if (editingAddressId.value === id) {
      closeForm();
    }
    confirmDeleteId.value = null;
    toastSuccess('Address deleted successfully.');
  } catch (err: any) {
    handleApiError(err, 'Failed to delete address.');
  } finally {
    deletingId.value = null;
  }
};

const inputClass = (hasError?: string) =>
  cn(
    'w-full h-11 bg-background border rounded-xl px-3.5 text-sm font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
    hasError ? 'border-destructive focus-visible:ring-destructive/30' : 'border-input'
  );
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <!-- Page Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-2xl font-display font-bold">Saved Addresses</h2>
      <UiButton
        v-if="!isFormOpen"
        type="button"
        variant="primary"
        class="rounded-full gap-2 font-bold"
        @click="openCreateForm"
      >
        <Plus class="w-4 h-4" aria-hidden="true" />
        Add New Address
      </UiButton>
    </div>

    <!-- Add / Edit Address Form -->
    <div
      v-if="isFormOpen"
      class="bg-card text-card-foreground border border-border rounded-[2.5rem] p-6 sm:p-8 space-y-6"
    >
      <div class="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <h3 class="text-xl font-display font-bold">
          {{ editingAddressId !== null ? 'Edit Address' : 'Add New Address' }}
        </h3>
        <button
          type="button"
          class="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close address form"
          title="Close"
          :disabled="isSubmitting"
          @click="closeForm"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div v-if="isLoadingDetail" class="py-6 flex items-center justify-center">
        <UiLoader size="sm" show-label label="Loading address details..." />
      </div>

      <form v-else class="space-y-5" novalidate @submit.prevent="handleSubmit">
        <div
          v-if="formError"
          class="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium flex items-start gap-2.5"
          role="alert"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{{ formError }}</span>
        </div>

        <!-- Address Type -->
        <div class="space-y-2">
          <span class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Address Type <span class="text-destructive" aria-hidden="true">*</span>
          </span>
          <div class="inline-flex rounded-xl border border-input bg-muted/40 p-1 gap-1" role="radiogroup" aria-label="Address Type">
            <button
              type="button"
              role="radio"
              :aria-checked="form.address_type === 'SHIPPING'"
              :disabled="isSubmitting"
              :class="cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-colors',
                form.address_type === 'SHIPPING'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )"
              @click="form.address_type = 'SHIPPING'"
            >
              Shipping
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="form.address_type === 'BILLING'"
              :disabled="isSubmitting"
              :class="cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-colors',
                form.address_type === 'BILLING'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )"
              @click="form.address_type = 'BILLING'"
            >
              Billing
            </button>
          </div>
          <p v-if="fieldErrors.address_type" class="text-xs font-medium text-destructive">
            {{ fieldErrors.address_type }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="addr-first-name" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              First Name <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-first-name"
              ref="firstInputRef"
              v-model="form.first_name"
              type="text"
              autocomplete="given-name"
              maxlength="255"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.first_name"
              :class="inputClass(fieldErrors.first_name)"
            />
            <p v-if="fieldErrors.first_name" class="text-xs font-medium text-destructive">{{ fieldErrors.first_name }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-last-name" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Last Name <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-last-name"
              v-model="form.last_name"
              type="text"
              autocomplete="family-name"
              maxlength="255"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.last_name"
              :class="inputClass(fieldErrors.last_name)"
            />
            <p v-if="fieldErrors.last_name" class="text-xs font-medium text-destructive">{{ fieldErrors.last_name }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-phone" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Phone <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-phone"
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              maxlength="30"
              placeholder="01XXXXXXXXX"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.phone"
              :class="inputClass(fieldErrors.phone)"
            />
            <p v-if="fieldErrors.phone" class="text-xs font-medium text-destructive">{{ fieldErrors.phone }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-company" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Company
            </label>
            <input
              id="addr-company"
              v-model="form.company"
              type="text"
              autocomplete="organization"
              maxlength="255"
              placeholder="Optional"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.company"
              :class="inputClass(fieldErrors.company)"
            />
            <p v-if="fieldErrors.company" class="text-xs font-medium text-destructive">{{ fieldErrors.company }}</p>
          </div>

          <div class="sm:col-span-2 space-y-1.5">
            <label for="addr-line-1" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Street Address <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-line-1"
              v-model="form.address_1"
              type="text"
              autocomplete="address-line1"
              maxlength="500"
              placeholder="House, road, block"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.address_1"
              :class="inputClass(fieldErrors.address_1)"
            />
            <p v-if="fieldErrors.address_1" class="text-xs font-medium text-destructive">{{ fieldErrors.address_1 }}</p>
          </div>

          <div class="sm:col-span-2 space-y-1.5">
            <label for="addr-line-2" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Apartment, Floor, Landmark
            </label>
            <input
              id="addr-line-2"
              v-model="form.address_2"
              type="text"
              autocomplete="address-line2"
              maxlength="500"
              placeholder="Optional"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.address_2"
              :class="inputClass(fieldErrors.address_2)"
            />
            <p v-if="fieldErrors.address_2" class="text-xs font-medium text-destructive">{{ fieldErrors.address_2 }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-city" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              City / Area <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-city"
              v-model="form.city"
              type="text"
              autocomplete="address-level2"
              maxlength="255"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.city"
              :class="inputClass(fieldErrors.city)"
            />
            <p v-if="fieldErrors.city" class="text-xs font-medium text-destructive">{{ fieldErrors.city }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-state" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              District / Division
            </label>
            <input
              id="addr-state"
              v-model="form.state"
              type="text"
              autocomplete="address-level1"
              maxlength="255"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.state"
              :class="inputClass(fieldErrors.state)"
            />
            <p v-if="fieldErrors.state" class="text-xs font-medium text-destructive">{{ fieldErrors.state }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-postcode" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Postal Code
            </label>
            <input
              id="addr-postcode"
              v-model="form.postcode"
              type="text"
              autocomplete="postal-code"
              inputmode="numeric"
              maxlength="50"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.postcode"
              :class="inputClass(fieldErrors.postcode)"
            />
            <p v-if="fieldErrors.postcode" class="text-xs font-medium text-destructive">{{ fieldErrors.postcode }}</p>
          </div>

          <div class="space-y-1.5">
            <label for="addr-country" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Country <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="addr-country"
              v-model="form.country"
              type="text"
              autocomplete="country-name"
              maxlength="100"
              required
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.country"
              :class="inputClass(fieldErrors.country)"
            />
            <p v-if="fieldErrors.country" class="text-xs font-medium text-destructive">{{ fieldErrors.country }}</p>
          </div>

          <div v-if="zones.length > 0" class="sm:col-span-2 space-y-1.5">
            <label for="addr-shipping-zone" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Delivery Area
            </label>
            <select
              id="addr-shipping-zone"
              v-model="form.shipping_zone"
              :disabled="isSubmitting"
              :class="inputClass(fieldErrors.shipping_zone)"
            >
              <option :value="null">Not specified</option>
              <option v-for="zone in zones" :key="zone.id" :value="zone.id">
                {{ zone.name }}
              </option>
            </select>
            <p v-if="fieldErrors.shipping_zone" class="text-xs font-medium text-destructive">{{ fieldErrors.shipping_zone }}</p>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex flex-wrap items-center justify-end gap-3">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-full px-6 h-11 font-bold gap-2"
            :disabled="isSubmitting"
            @click="closeForm"
          >
            <X class="w-4 h-4" aria-hidden="true" />
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            variant="primary"
            class="rounded-full px-8 h-11 font-bold gap-2"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
            <Check v-else class="w-4 h-4" aria-hidden="true" />
            {{ isSubmitting ? 'Saving...' : editingAddressId !== null ? 'Update Address' : 'Save Address' }}
          </UiButton>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoadingAddresses"
      class="bg-card border border-border rounded-[2.5rem] py-12 flex items-center justify-center"
    >
      <UiLoader size="md" show-label label="Loading saved addresses..." />
    </div>

    <!-- Error State -->
    <div
      v-else-if="loadError"
      class="p-6 rounded-[2rem] border border-destructive/30 bg-destructive/5 text-sm space-y-3"
      role="alert"
    >
      <div class="flex items-start gap-2.5 text-destructive font-medium">
        <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{{ loadError }}</span>
      </div>
      <UiButton type="button" variant="outline" size="sm" class="rounded-full font-bold" @click="fetchFirstPage">
        Try Again
      </UiButton>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="addresses.length === 0"
      class="bg-card border border-border rounded-[2.5rem] p-10 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground" aria-hidden="true">
        <MapPin class="w-6 h-6" />
      </div>
      <div class="space-y-1">
        <h3 class="text-lg font-display font-bold text-foreground">No saved addresses yet</h3>
        <p class="text-sm text-muted-foreground max-w-md mx-auto">
          Save your shipping or billing addresses to check out faster on future orders.
        </p>
      </div>
      <UiButton
        v-if="!isFormOpen"
        type="button"
        variant="primary"
        class="rounded-full gap-2 font-bold"
        @click="openCreateForm"
      >
        <Plus class="w-4 h-4" aria-hidden="true" />
        Add New Address
      </UiButton>
    </div>

    <!-- Address List -->
    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="address in addresses"
          :key="address.id"
          class="bg-card text-card-foreground border border-border rounded-[2rem] p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
        >
          <div class="space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="font-bold text-base text-foreground truncate">
                  {{ address.first_name }} {{ address.last_name }}
                </h3>
                <p v-if="address.company" class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{{ address.company }}</span>
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <UiBadge :variant="address.address_type === 'BILLING' ? 'secondary' : 'primary'">
                  {{ address.address_type === 'BILLING' ? 'Billing' : 'Shipping' }}
                </UiBadge>
                <UiBadge v-if="address.shipping_zone_name" variant="info">
                  {{ address.shipping_zone_name }}
                </UiBadge>
              </div>
            </div>

            <div class="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p v-if="address.address_1" class="text-foreground font-medium">{{ address.address_1 }}</p>
              <p v-if="address.address_2">{{ address.address_2 }}</p>
              <p>
                {{ [address.city, address.state].filter(Boolean).join(', ') }}<template v-if="address.postcode"> {{ address.postcode }}</template>
              </p>
              <p v-if="address.country">{{ address.country }}</p>
              <p v-if="address.phone" class="flex items-center gap-1.5 pt-1 text-foreground">
                <Phone class="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <span>{{ address.phone }}</span>
              </p>
            </div>
          </div>

          <!-- Actions / Inline Delete Confirmation -->
          <div class="pt-4 border-t border-border">
            <div
              v-if="confirmDeleteId === address.id"
              class="flex flex-wrap items-center justify-between gap-2"
            >
              <span class="text-xs font-bold text-destructive">Delete this address?</span>
              <div class="flex items-center gap-2">
                <UiButton
                  type="button"
                  variant="outline"
                  size="sm"
                  class="rounded-full font-bold"
                  :disabled="deletingId === address.id"
                  @click="cancelDelete"
                >
                  Cancel
                </UiButton>
                <UiButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  class="rounded-full font-bold gap-1.5"
                  :disabled="deletingId === address.id"
                  @click="confirmDelete(address.id)"
                >
                  <Loader2 v-if="deletingId === address.id" class="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  {{ deletingId === address.id ? 'Deleting...' : 'Confirm Delete' }}
                </UiButton>
              </div>
            </div>

            <div v-else class="flex items-center justify-end gap-2">
              <UiButton
                type="button"
                variant="outline"
                size="sm"
                class="rounded-full gap-1.5 font-bold"
                :disabled="deletingId === address.id"
                @click="openEditForm(address)"
              >
                <Pencil class="w-3.5 h-3.5" aria-hidden="true" />
                Edit
              </UiButton>
              <UiButton
                type="button"
                variant="ghost"
                size="sm"
                class="rounded-full gap-1.5 font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                :disabled="deletingId === address.id"
                @click="requestDelete(address.id)"
              >
                <Trash2 class="w-3.5 h-3.5" aria-hidden="true" />
                Delete
              </UiButton>
            </div>
          </div>
        </article>
      </div>

      <UiInfiniteScroll
        :has-more="hasMore"
        :is-loading="isFetchingNextPage"
        :show-end-text="false"
        @load-more="loadNextPage"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

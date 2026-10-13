<!-- File: /pages/checkout.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { navigateTo } from '#app';
import { decodeHtmlEntities } from '@/utils';
import { ChevronRight, CreditCard, ShieldCheck, Truck, PackageCheck, AlertCircle, Smartphone, Banknote, Plus, MapPin, Check, ChevronLeft, Loader2 } from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useCustomerAddressService } from '@/composables/useCustomerAddressService';
import { useShippingService } from '@/composables/useShippingService';
import { useCheckoutService } from '@/composables/useCheckoutService';
import { toastSuccess, toastError, handleApiError } from '@/composables/useToast';
import type { CustomerAddress, ShippingOption } from '@/types';

useSeoMeta({
  title: 'Checkout',
  description: 'Complete your purchase securely at Best Computer Hub. Multiple payment options with fast, nationwide delivery in Bangladesh.'
});

const cartStore = useCartStore();
const authStore = useAuthStore();
const addressService = useCustomerAddressService();
const shippingService = useShippingService();
const checkoutService = useCheckoutService();
const validationData = ref<any>(null);
const isValidating = ref(false);
const validationErrorMsg = ref<string | null>(null);
const createdOrderNumber = ref('#TC-8822-4910-XM');

const runValidation = async () => {
  if (!selectedAddressId.value || !selectedShippingOption.value) return;
  isValidating.value = true;
  validationErrorMsg.value = null;
  try {
    const res = await checkoutService.validateCheckout({
      shipping_address_id: selectedAddressId.value,
      shipping_method_id: selectedShippingOption.value.id
    });
    validationData.value = res;
  } catch (err: any) {
    validationErrorMsg.value = err?.data?.message || err?.message || 'Checkout validation failed.';
    handleApiError(err, 'Checkout validation failed.');
    validationData.value = null;
  } finally {
    isValidating.value = false;
  }
};

watch([selectedAddressId, selectedShippingOption, () => cartStore.items.length], () => {
  if (selectedAddressId.value && selectedShippingOption.value) {
    runValidation();
  }
}, { deep: true });

const step = ref(1);

const savedAddresses = ref<CustomerAddress[]>([]);
const addressPagination = reactive({
  page: 1,
  pageSize: 5,
  count: 0,
  next: null as string | null,
  previous: null as string | null
});
const isLoadingAddresses = ref(false);
const showAddAddressForm = ref(false);

const shippingOptions = ref<ShippingOption[]>([]);
const selectedShippingOption = ref<ShippingOption | null>(null);
const isLoadingShippingOptions = ref(false);
const selectedAddressId = ref<number | string | null>(null);

const newAddressForm = reactive({
  address_type: 'BILLING',
  first_name: '',
  last_name: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Bangladesh',
  phone: ''
});

const fetchAddresses = async (page = 1) => {
  if (!authStore.isLoggedIn) return;
  isLoadingAddresses.value = true;
  const res = await addressService.getCustomerAddresses({ page, page_size: addressPagination.pageSize });
  savedAddresses.value = res.results;
  addressPagination.count = res.count;
  addressPagination.next = res.next;
  addressPagination.previous = res.previous;
  addressPagination.page = page;
  isLoadingAddresses.value = false;
};

const fetchShippingOptions = async (addressId: number | string) => {
  selectedAddressId.value = addressId;
  selectedShippingOption.value = null;
  isLoadingShippingOptions.value = true;
  try {
    const opts = await shippingService.getShippingOptions(addressId);
    shippingOptions.value = opts;
    if (opts.length > 0) {
      selectedShippingOption.value = opts[0] ?? null;
    }
  } catch (err) {
    shippingOptions.value = [];
    handleApiError(err, 'Failed to fetch shipping options.');
  } finally {
    isLoadingShippingOptions.value = false;
  }
};

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await Promise.all([
        cartStore.fetchCart(),
        fetchAddresses(1)
      ]);
      if (authStore.user?.email && !form.email) {
        form.email = authStore.user.email;
      }
      if (authStore.user?.name && !form.firstName) {
        const parts = authStore.user.name.split(' ');
        form.firstName = parts[0] || '';
        form.lastName = parts.slice(1).join(' ') || '';
      }
    } catch (err) {
      console.error('Failed to fetch checkout initialization data', err);
    }
  }
});

const handleSelectAddress = (addr: CustomerAddress) => {
  form.firstName = addr.first_name || '';
  form.lastName = addr.last_name || '';
  form.city = addr.city || '';
  if (addr.phone) form.phone = addr.phone;
  if (addr.address_1) form.address = addr.address_1;
  if (addr.state) form.state = addr.state;
  if (addr.postcode) form.zip = addr.postcode;
  toastSuccess('Saved address applied to shipping details');
  if (addr.id) {
    fetchShippingOptions(addr.id);
  }
};

const handleCreateAddress = async () => {
  if (!newAddressForm.first_name || !newAddressForm.last_name || !newAddressForm.address_1 || !newAddressForm.city || !newAddressForm.country || !newAddressForm.phone) {
    toastError('Please fill in all required address fields.');
    return;
  }

  try {
    const created = await addressService.createCustomerAddress({
      address_type: newAddressForm.address_type,
      first_name: newAddressForm.first_name,
      last_name: newAddressForm.last_name,
      company: newAddressForm.company,
      address_1: newAddressForm.address_1,
      address_2: newAddressForm.address_2,
      city: newAddressForm.city,
      state: newAddressForm.state || 'N/A',
      postcode: newAddressForm.postcode,
      country: newAddressForm.country,
      phone: newAddressForm.phone
    });

    toastSuccess('Address created successfully');
    showAddAddressForm.value = false;
    
    newAddressForm.address_1 = '';
    newAddressForm.address_2 = '';
    newAddressForm.company = '';
    newAddressForm.postcode = '';
    newAddressForm.state = '';

    await fetchAddresses(1);

    if (created && created.id) {
      handleSelectAddress(created);
    }
  } catch (err) {
    handleApiError(err, 'Failed to create address.');
  }
};

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  paymentMethod: 'card', // 'card' | 'mfs' | 'cod'
  cardNumber: '',
  expiry: '',
  cvv: '',
  mfsType: 'bkash', // 'bkash' | 'nagad' | 'rocket'
  mfsNumber: '',
  mfsTransactionId: ''
});

const subtotalValue = computed(() => {
  return validationData.value?.subtotal !== undefined ? Number(validationData.value.subtotal) : cartStore.totalPrice;
});

const shippingChargeValue = computed(() => {
  if (validationData.value?.shipping_charge !== undefined) {
    return Number(validationData.value.shipping_charge) || 0;
  }
  if (selectedShippingOption.value && selectedShippingOption.value.shipping_charge !== undefined) {
    return Number(selectedShippingOption.value.shipping_charge) || 0;
  }
  return 0;
});

const discountValue = computed(() => {
  return validationData.value?.discount !== undefined ? Number(validationData.value.discount) : 0;
});

const taxValue = computed(() => {
  return validationData.value?.tax !== undefined ? Number(validationData.value.tax) : 0;
});

const totalDue = computed(() => {
  if (validationData.value?.grand_total !== undefined) {
    return Number(validationData.value.grand_total);
  }
  return subtotalValue.value + shippingChargeValue.value - discountValue.value + taxValue.value;
});



const isProcessing = ref(false);
const orderCompleted = ref(false);

const handleSaveFormAsAddress = async () => {
  if (!form.firstName || !form.lastName || !form.address || !form.city || !form.phone) {
    toastError('Please fill in all required shipping fields (Name, Address, City, Phone).');
    return;
  }

  try {
    const created = await addressService.createCustomerAddress({
      address_type: 'SHIPPING',
      first_name: form.firstName,
      last_name: form.lastName,
      address_1: form.address,
      city: form.city,
      state: form.state || 'N/A',
      postcode: form.zip || '',
      country: 'Bangladesh',
      phone: form.phone
    });

    toastSuccess('Shipping address saved successfully');
    await fetchAddresses(1);

    if (created && created.id) {
      selectedAddressId.value = created.id;
      await fetchShippingOptions(created.id);
    }
  } catch (err) {
    handleApiError(err, 'Failed to save address for shipping calculation.');
  }
};

const proceedToPayment = () => {
  if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city || !form.phone) {
    toastError('Please fill in all required shipping fields.');
    return;
  }
  if (!selectedAddressId.value) {
    toastError('Please save your shipping address and select a delivery option first.');
    return;
  }
  if (shippingOptions.value.length > 0 && !selectedShippingOption.value) {
    toastError('Please select a shipping option.');
    return;
  }
  step.value = 2;
};

const handlePlaceOrder = () => {
  if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city || !form.phone) {
    toastError('Please fill in all required shipping fields.');
    return;
  }
  if (!selectedAddressId.value) {
    toastError('Please save your shipping address and select a delivery option.');
    return;
  }
  if (shippingOptions.value.length > 0 && !selectedShippingOption.value) {
    toastError('Please select a shipping option.');
    return;
  }

  isProcessing.value = true;
  setTimeout(() => {
    isProcessing.value = false;
    orderCompleted.value = true;
    cartStore.clearCart();
  }, 2000);
};
</script>

<template>
  <div class="min-h-screen bg-muted/20 pb-20">
    <!-- Header Minimal -->
    <div class="bg-background border-b py-6 mb-12">
      <div class="container mx-auto px-4 flex items-center justify-between gap-2">
        <NuxtLink to="/" class="shrink-0">
          <UiBrandLogo size="md" />
        </NuxtLink>

        <!-- Desktop Steps -->
        <div class="hidden md:flex items-center gap-4 lg:gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span :class="{ 'text-primary': step >= 1 }">Shipping</span>
          <ChevronRight class="w-4 h-4" />
          <span :class="{ 'text-primary': step >= 2 }">Payment</span>
          <ChevronRight class="w-4 h-4" />
          <span>Success</span>
        </div>

        <!-- Mobile Step Counter Badge -->
        <div class="md:hidden text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
          Step {{ step }} of 2
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
          <ShieldCheck class="w-4 h-4" />
          Secure Checkout
        </div>
      </div>
    </div>

    <div v-if="!orderCompleted" class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
        <!-- Forms -->
        <div class="lg:col-span-7 space-y-8">
          <div v-if="step === 1" class="bg-background rounded-3xl p-8 border shadow-sm space-y-8">
            <h2 class="text-2xl font-display font-bold flex items-center gap-3">
              <Truck class="w-6 h-6 text-primary" />
              Shipping Information
            </h2>

            <!-- Saved Addresses Section (Authenticated Users) -->
            <div v-if="authStore.isLoggedIn" class="space-y-4 pt-2 pb-6 border-b">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <MapPin class="w-4 h-4 text-primary" />
                  Saved Addresses
                </h3>
                <UiButton size="sm" variant="outline" @click="showAddAddressForm = !showAddAddressForm" class="rounded-xl text-xs gap-1.5">
                  <Plus class="w-3.5 h-3.5" />
                  {{ showAddAddressForm ? 'Cancel' : 'Add New Address' }}
                </UiButton>
              </div>

              <!-- Add Address Form -->
              <div v-if="showAddAddressForm" class="p-6 bg-muted/40 rounded-2xl border space-y-4 animate-in fade-in duration-300">
                <h4 class="font-bold text-sm">Create New Address</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address Type</label>
                    <select v-model="newAddressForm.address_type" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="BILLING">Billing</option>
                      <option value="SHIPPING">Shipping</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone *</label>
                    <input v-model="newAddressForm.phone" type="text" placeholder="01700000000" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">First Name *</label>
                    <input v-model="newAddressForm.first_name" type="text" placeholder="John" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Last Name *</label>
                    <input v-model="newAddressForm.last_name" type="text" placeholder="Doe" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="sm:col-span-2 space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Street Address 1 *</label>
                    <input v-model="newAddressForm.address_1" type="text" placeholder="House 12, Road 5, Block C" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="sm:col-span-2 space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Street Address 2</label>
                    <input v-model="newAddressForm.address_2" type="text" placeholder="Apartment, suite, unit (optional)" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">City *</label>
                    <input v-model="newAddressForm.city" type="text" placeholder="Dhaka" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">State / Region</label>
                    <input v-model="newAddressForm.state" type="text" placeholder="Dhaka Division" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Postal Code</label>
                    <input v-model="newAddressForm.postcode" type="text" placeholder="1212" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Country *</label>
                    <input v-model="newAddressForm.country" type="text" placeholder="Bangladesh" class="w-full h-10 bg-background border rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="sm:col-span-2 pt-2">
                    <UiButton @click="handleCreateAddress" :disabled="addressService.isCreating.value" class="w-full h-10 rounded-xl text-xs font-bold">
                      {{ addressService.isCreating.value ? 'Saving Address...' : 'Save & Use Address' }}
                    </UiButton>
                  </div>
                </div>
              </div>

              <!-- Saved Addresses List / Loading / Empty -->
              <div v-if="isLoadingAddresses" class="py-6 text-center text-xs text-muted-foreground">
                Loading saved addresses...
              </div>
              <div v-else-if="savedAddresses.length === 0" class="py-4 text-xs text-muted-foreground italic">
                No saved addresses found. You can add one above or fill in the shipping form below.
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                <div 
                  v-for="addr in savedAddresses" 
                  :key="addr.id" 
                  @click="handleSelectAddress(addr)"
                  :class="cn(
                    'p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 group',
                    selectedAddressId === addr.id ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card hover:border-primary/50'
                  )"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary mb-1">
                        {{ addr.address_type }}
                      </span>
                      <p class="font-bold text-xs group-hover:text-primary transition-colors">{{ addr.first_name }} {{ addr.last_name }}</p>
                    </div>
                    <span class="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Use <Check class="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div class="text-[11px] text-muted-foreground leading-relaxed">
                    <p>{{ addr.city }}{{ addr.state ? `, ${addr.state}` : '' }} - {{ addr.country }}</p>
                    <p v-if="addr.phone">Phone: {{ addr.phone }}</p>
                  </div>
                </div>
              </div>

              <!-- Pagination for Saved Addresses -->
              <div v-if="addressPagination.next || addressPagination.previous" class="flex items-center justify-between pt-2 text-xs">
                <button 
                  @click="fetchAddresses(addressPagination.page - 1)" 
                  :disabled="!addressPagination.previous || isLoadingAddresses"
                  class="px-3 py-1 rounded-lg border bg-background hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <span class="text-muted-foreground">Page {{ addressPagination.page }}</span>
                <button 
                  @click="fetchAddresses(addressPagination.page + 1)" 
                  :disabled="!addressPagination.next || isLoadingAddresses"
                  class="px-3 py-1 rounded-lg border bg-background hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <!-- Shipping Options Selection Section -->
            <div v-if="selectedAddressId" class="space-y-4 pt-2 pb-6 border-b">
              <h3 class="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Truck class="w-4 h-4 text-primary" />
                Available Shipping Options
              </h3>

              <div v-if="isLoadingShippingOptions" class="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 class="w-4 h-4 animate-spin text-primary" />
                Loading shipping options...
              </div>
              <div v-else-if="shippingOptions.length === 0" class="py-4 text-xs text-muted-foreground italic">
                No shipping options available for this delivery address.
              </div>
              <div v-else class="grid grid-cols-1 gap-3">
                <div 
                  v-for="opt in shippingOptions"
                  :key="opt.id"
                  @click="selectedShippingOption = opt"
                  :class="cn(
                    'p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between',
                    selectedShippingOption?.id === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted hover:border-primary/30 bg-card'
                  )"
                >
                  <div class="space-y-1">
                    <p class="font-bold text-xs flex items-center gap-2">
                      {{ opt.name }}
                      <span v-if="opt.estimated_delivery" class="text-[10px] font-normal text-muted-foreground">({{ opt.estimated_delivery }})</span>
                    </p>
                    <p v-if="opt.description" class="text-[11px] text-muted-foreground">{{ opt.description }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-sm text-primary">
                      {{ Number(opt.shipping_charge) === 0 ? 'FREE' : formatCurrency(Number(opt.shipping_charge)) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name *</label>
                <input v-model="form.firstName" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name *</label>
                <input v-model="form.lastName" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address *</label>
                <input v-model="form.email" type="email" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number *</label>
                <input v-model="form.phone" type="text" placeholder="01700000000" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Street Address *</label>
                <input v-model="form.address" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">City *</label>
                <input v-model="form.city" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">ZIP / Postal Code</label>
                <input v-model="form.zip" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
            </div>

            <div v-if="authStore.isLoggedIn" class="pt-2">
              <UiButton @click="handleSaveFormAsAddress" :disabled="addressService.isCreating.value" variant="outline" class="w-full h-12 rounded-2xl text-xs font-bold gap-2">
                <MapPin class="w-4 h-4 text-primary" />
                {{ addressService.isCreating.value ? 'Saving & Calculating...' : 'Save Address & Calculate Shipping Options' }}
              </UiButton>
            </div>

            <UiButton class="w-full h-14 rounded-2xl text-lg font-bold" @click="proceedToPayment">
              Continue to Payment
            </UiButton>
          </div>

          <div v-if="step === 2" class="bg-background rounded-3xl p-8 border shadow-sm space-y-8 animate-fade-in">
            <button @click="step = 1" class="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 uppercase tracking-widest">
              &larr; Back to Shipping
            </button>
            <h2 class="text-2xl font-display font-bold flex items-center gap-3">
              <CreditCard class="w-6 h-6 text-primary" />
              Secure Payment
            </h2>

            <div class="space-y-6">
              <!-- Payment Method Selection -->
              <div class="grid grid-cols-1 gap-4">
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
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="form.paymentMethod === method.id ? 'border-primary' : 'border-muted-foreground/30'">
                    <div v-if="form.paymentMethod === method.id" class="w-2.5 h-2.5 bg-primary rounded-full"></div>
                  </div>
                </button>
              </div>

              <!-- Card Payment Form -->
              <div v-if="form.paymentMethod === 'card'" class="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Card Number</label>
                  <input v-model="form.cardNumber" type="text" placeholder="0000 0000 0000 0000" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiry Date</label>
                    <input v-model="form.expiry" type="text" placeholder="MM / YY" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">CVC / CVV</label>
                    <input v-model="form.cvv" type="text" placeholder="123" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
              </div>

              <!-- MFS Payment Form -->
              <div v-if="form.paymentMethod === 'mfs'" class="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="grid grid-cols-3 gap-2">
                  <button 
                    v-for="mfs in ['bkash', 'nagad', 'rocket']" 
                    :key="mfs"
                    @click="form.mfsType = mfs"
                    :class="cn(
                      'py-2 px-4 rounded-xl border text-xs font-extrabold uppercase transition-all',
                      form.mfsType === mfs ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted border-muted'
                    )"
                  >
                    {{ mfs }}
                  </button>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account Number</label>
                  <input v-model="form.mfsNumber" type="text" placeholder="01XXX-XXXXXX" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transaction ID (After Payment)</label>
                  <input v-model="form.mfsTransactionId" type="text" placeholder="TRX-XXXXXXX" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div class="p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-medium leading-relaxed">
                  Please complete the payment to our merchant number first, then provide the Transaction ID above.
                </div>
              </div>

              <!-- COD Info -->
              <div v-if="form.paymentMethod === 'cod'" class="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="p-6 bg-muted rounded-2xl space-y-3">
                  <div class="w-12 h-12 bg-background rounded-full flex items-center justify-center text-primary">
                    <Truck class="w-6 h-6" />
                  </div>
                  <div class="space-y-1">
                    <p class="font-bold">Cash payment upon delivery</p>
                    <p class="text-xs text-muted-foreground leading-relaxed">
                      Please keep the exact amount ({{ formatCurrency(totalDue) }}) ready for our delivery partner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UiButton class="w-full h-14 rounded-2xl text-lg font-bold gap-2" @click="handlePlaceOrder" :disabled="isProcessing">
              <ShieldCheck class="w-5 h-5" v-if="!isProcessing" />
              {{ isProcessing ? 'Authorizing Transaction...' : `Pay ${formatCurrency(totalDue)}` }}
            </UiButton>
          </div>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-background rounded-3xl p-8 border shadow-sm sticky top-32">
            <h3 class="text-xl font-display font-bold mb-6">Order Summary</h3>
            <div class="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2">
              <div v-for="item in cartStore.items" :key="item.productId || item.id || item.product?.id" class="flex gap-4">
                <div class="w-16 h-16 rounded-lg overflow-hidden border shrink-0 bg-muted">
                  <img :src="item.product?.images?.[0] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80'" :alt="decodeHtmlEntities(item.product?.name || 'Product')" class="w-full h-full object-cover" />
                </div>
                <div class="flex-grow">
                  <p class="font-bold text-sm line-clamp-1">{{ decodeHtmlEntities(item.product?.name || 'Product') }}</p>
                  <p class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</p>
                </div>
                <span class="font-bold text-sm">{{ formatCurrency((item.product?.price || 0) * item.quantity) }}</span>
              </div>
            </div>

            <div class="space-y-3 pt-6 border-t font-medium">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Subtotal</span>
                <span>{{ formatCurrency(cartStore.totalPrice) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Shipping ({{ selectedShippingOption?.name || 'Pending' }})</span>
                <span :class="selectedShippingOption ? (shippingChargeValue === 0 ? 'text-green-600 font-bold' : 'font-bold') : 'text-muted-foreground font-normal text-xs'">
                  {{ selectedShippingOption ? (shippingChargeValue === 0 ? 'FREE' : formatCurrency(shippingChargeValue)) : 'Select address & option' }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Estimated Tax</span>
                <span>{{ formatCurrency(0) }}</span>
              </div>
              <div class="flex justify-between text-xl font-display font-bold pt-4 text-primary">
                <span>Total Due</span>
                <span>{{ formatCurrency(totalDue) }}</span>
              </div>
            </div>

            <div v-if="selectedShippingOption" class="mt-8 p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
              <PackageCheck class="w-5 h-5 text-primary mt-1" />
              <p class="text-xs text-primary/80 leading-relaxed font-medium">
                Your order will be shipped via **{{ selectedShippingOption.name }}** <span v-if="selectedShippingOption.estimated_delivery">({{ selectedShippingOption.estimated_delivery }})</span>.
              </p>
            </div>
            <div v-else class="mt-8 p-4 bg-muted/50 rounded-2xl flex items-start gap-3">
              <Truck class="w-5 h-5 text-muted-foreground mt-1" />
              <p class="text-xs text-muted-foreground leading-relaxed font-medium">
                Please save your delivery address and choose a shipping method to finalize delivery charges and terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success State -->
    <div v-else class="container mx-auto px-4">
      <div class="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-in">
        <div class="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <ShieldCheck class="w-16 h-16 text-green-600" />
        </div>
        <div class="space-y-4">
          <h1 class="text-5xl font-display font-extrabold tracking-tight">Order Confirmed!</h1>
          <p class="text-xl text-muted-foreground">
            Thank you for your purchase. We've sent a detailed receipt and tracking link to **{{ form.email }}**.
          </p>
        </div>
        <div class="bg-card p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-left space-y-1">
            <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order Number</p>
            <p class="text-lg font-mono font-bold">{{ createdOrderNumber }}</p>
          </div>
          <UiButton @click="navigateTo('/')" size="lg" class="rounded-full">Back to Marketplace</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
</style>

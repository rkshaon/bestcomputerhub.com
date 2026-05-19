<script setup lang="ts">
import { 
  CreditCard, 
  Trash2, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Phone,
  ArrowRight,
  PackageCheck
} from 'lucide-vue-next';
import { useCartStore } from '~/stores/cart';
import { useAuthStore, type Order, type UserProfile } from '~/stores/auth';
import { cn } from '~/utils';

const cartStore = useCartStore();
const authStore = useAuthStore();

// Checkout form states
const formData = ref({
  name: '',
  email: '',
  address: '',
  city: '',
  country: 'Germany',
  postalCode: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
});

// Prefill form if user is logged in
onMounted(() => {
  if (authStore.user) {
    formData.value.name = authStore.user.name;
    formData.value.email = authStore.user.email;
    formData.value.address = authStore.user.address;
    formData.value.city = authStore.user.city;
    formData.value.country = authStore.user.country || 'Germany';
    formData.value.postalCode = authStore.user.postalCode;
  }
});

// Validation and errors
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

// Completed Order details (Success overlay state)
const orderCompleted = ref(false);
const completedOrderDetails = ref<Order | null>(null);

const validateForm = () => {
  const errs: Record<string, string> = {};
  if (!formData.value.name) errs.name = 'Full identity is required';
  if (!formData.value.email) {
    errs.email = 'Secure contact email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.value.email)) {
    errs.email = 'E-mail configuration is invalid';
  }
  if (!formData.value.address) errs.address = 'Destination address is required';
  if (!formData.value.city) errs.city = 'City register is required';
  if (!formData.value.postalCode) errs.postalCode = 'Postal code is required';
  
  // Card credentials
  if (!formData.value.cardNumber) {
    errs.cardNumber = 'Card node number is required';
  } else if (formData.value.cardNumber.replace(/\s/g, '').length < 16) {
    errs.cardNumber = 'Card credentials must span 16 digits';
  }
  if (!formData.value.cardExpiry) {
    errs.cardExpiry = 'Expiry lock gate is required';
  } else if (!/^\d{2}\/\d{2}$/.test(formData.value.cardExpiry)) {
    errs.cardExpiry = 'Format must adhere to MM/YY';
  }
  if (!formData.value.cardCvv) {
    errs.cardCvv = 'Security CVV code is required';
  } else if (formData.value.cardCvv.length < 3) {
    errs.cardCvv = 'Security codes are 3 digits minimum';
  }

  errors.value = errs;
  return Object.keys(errs).length === 0;
};

const handleCheckoutSubmit = async (e: Event) => {
  e.preventDefault();
  if (!validateForm()) return;

  isSubmitting.value = true;
  
  // Simulate transactional processing latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  const profile: UserProfile = {
    name: formData.value.name,
    email: formData.value.email,
    address: formData.value.address,
    city: formData.value.city,
    country: formData.value.country,
    postalCode: formData.value.postalCode
  };

  // Place order
  const orderObj = authStore.placeOrder(
    cartStore.items,
    cartStore.subtotal,
    cartStore.tax,
    cartStore.shipping,
    cartStore.total,
    profile
  );

  completedOrderDetails.value = orderObj;
  
  // Clear cart, stop loading, trigger success state
  cartStore.clearCart();
  isSubmitting.value = false;
  orderCompleted.value = true;
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left">
    
    <!-- SUCCESS PANEL OVERLAY -->
    <div 
      v-if="orderCompleted" 
      class="max-w-xl mx-auto bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8 text-center animate-in zoom-in-95 duration-300"
    >
      <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
        <PackageCheck class="w-8 h-8" />
      </div>

      <div class="space-y-2">
        <h1 class="text-xl sm:text-2xl font-display font-black uppercase tracking-tight">Order Executed Successfully</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Transaction confirmed. Your hardware cargo is being allocated across our logistics pipelines.
        </p>
      </div>

      <!-- Specific transaction ledger info -->
      <div v-if="completedOrderDetails" class="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800/80 text-left space-y-3.5">
        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>LOGISTIC LEDGER ID</span>
          <span class="font-mono text-slate-900 dark:text-white font-black">{{ completedOrderDetails.id }}</span>
        </div>
        
        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>DELIVERY ESTIMATION GATE</span>
          <span class="text-indigo-600 dark:text-indigo-400 font-bold">2 to 3 Business Days</span>
        </div>

        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>DESTINATION RECIPIENT</span>
          <span class="text-slate-900 dark:text-white font-bold truncate max-w-[170px]">{{ completedOrderDetails.shippingAddress.name }}</span>
        </div>

        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between text-xs font-black uppercase">
          <span class="text-slate-400">TOTAL CAPEX BILL</span>
          <span class="font-mono text-slate-900 dark:text-white text-sm">${{ completedOrderDetails.total.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Informational post check instructions -->
      <div class="text-slate-400 text-[10px] uppercase font-bold tracking-wider leading-relaxed space-y-1">
        <p>📡 Confirmation email and tracking token sent to: <span class="text-slate-800 dark:text-slate-200 underline font-black lowercase">{{ completedOrderDetails?.shippingAddress.email }}</span></p>
        <p>📦 Keep track of logs under the account panel console.</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <NuxtLink to="/account">
          <UiButton variant="primary" size="sm" class="w-full">
            Inspect My Orders
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/products">
          <UiButton variant="ghost" size="sm" class="text-slate-500">
            Back to Catalog
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- MAIN CHECKOUT WORKFLOW -->
    <div v-else class="space-y-10">
      
      <!-- Back Link -->
      <NuxtLink to="/products" class="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">
        <ArrowLeft class="w-4 h-4" /> Returns to Shop Products
      </NuxtLink>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        <!-- Left: Forms Fields (Shipping address + Credit Cards) -->
        <form @submit="handleCheckoutSubmit" class="lg:col-span-7 space-y-8">
          
          <!-- Shipping Address Area -->
          <div class="p-6 md:p-8 bg-white dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div class="border-b border-slate-100 dark:border-slate-900 pb-4">
              <h3 class="text-sm font-black uppercase tracking-[0.2em]">Sovereign Delivery Destination</h3>
              <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Specify destination coordinates correctly</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Recipient Full Identity</label>
                <input 
                  v-model="formData.name"
                  type="text" 
                  placeholder="RK Shaon" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.name" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.name }}</p>
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Secure Contact E-mail</label>
                <input 
                  v-model="formData.email"
                  type="email" 
                  placeholder="rkshaon.ist@gmail.com" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.email" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.email }}</p>
              </div>

              <!-- Street Address -->
              <div class="sm:col-span-2 space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sovereign Street Address</label>
                <input 
                  v-model="formData.address"
                  type="text" 
                  placeholder="123 Tech Central Pkwy, Suite 404" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.address" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.address }}</p>
              </div>

              <!-- City -->
              <div class="grid grid-cols-3 gap-4 sm:col-span-2">
                <div class="col-span-2 space-y-2 rounded-xl">
                  <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Regional City</label>
                  <input 
                    v-model="formData.city"
                    type="text" 
                    placeholder="Frankfurt" 
                    class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                    :class="errors.city ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                  />
                  <p v-if="errors.city" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.city }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Postal ZIP Code</label>
                  <input 
                    v-model="formData.postalCode"
                    type="text" 
                    placeholder="60311" 
                    class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                    :class="errors.postalCode ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                  />
                  <p v-if="errors.postalCode" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.postalCode }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Details Area -->
          <div class="p-6 md:p-8 bg-white dark:bg-slate-950 border border-slate-250/20 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div class="border-b border-slate-100 dark:border-slate-900 pb-4">
              <h3 class="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-rose-500" /> Transaction Gateway Security
              </h3>
              <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">PCI compliance certified. Encrypted tunnel execution.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Card Number -->
              <div class="sm:col-span-3 space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-bold">Credit Card Token Number</label>
                <input 
                  v-model="formData.cardNumber"
                  type="text" 
                  placeholder="4111 8888 5656 2026" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.cardNumber ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.cardNumber" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.cardNumber }}</p>
              </div>

              <!-- Card Expiration Date -->
              <div class="sm:col-span-2 space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Expiry Node Gate (MM/YY)</label>
                <input 
                  v-model="formData.cardExpiry"
                  type="text" 
                  placeholder="08/29" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.cardExpiry ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.cardExpiry" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.cardExpiry }}</p>
              </div>

              <!-- Card CVV -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Security CVV Code</label>
                <input 
                  v-model="formData.cardCvv"
                  type="text" 
                  placeholder="336" 
                  class="h-11 w-full px-4 rounded-xl border bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
                  :class="errors.cardCvv ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'"
                />
                <p v-if="errors.cardCvv" class="text-[8px] text-rose-500 uppercase tracking-widest">{{ errors.cardCvv }}</p>
              </div>
            </div>
          </div>

          <!-- Submission Trigger Button -->
          <UiButton 
            v-if="cartStore.items.length > 0"
            variant="rose" 
            size="lg" 
            type="submit" 
            class="w-full h-13 shadow-xl shadow-rose-500/20"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="animate-pulse">Authorizing Capex Funds Tunneling...</span>
            <span v-else class="flex items-center gap-2">Execute Financial Authorization <ArrowRight class="w-4 h-4" /></span>
          </UiButton>
        </form>

        <!-- Right: Basket summary & calculations panel -->
        <div class="lg:col-span-5 space-y-6">
          <div class="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-[2rem] space-y-6 shadow-sm">
            <div class="border-b border-slate-150 dark:border-slate-900 pb-4">
              <h3 class="text-sm font-black uppercase tracking-[0.2em]">Transactional Core Basket</h3>
              <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Review active capex units</p>
            </div>

            <!-- Empty baseline checkout guard -->
            <div v-if="cartStore.items.length === 0" class="py-8 text-center text-slate-400 space-y-4">
              <p class="text-xs font-black uppercase">Basket Cargo Empty</p>
              <NuxtLink to="/products">
                <UiButton variant="primary" size="sm">Populate Catalog Items</UiButton>
              </NuxtLink>
            </div>

            <div v-else class="space-y-4">
              <!-- Cart Items list -->
              <div class="max-h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                <div 
                  v-for="item in cartStore.items" 
                  :key="item.product.id"
                  class="flex items-center gap-4 bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-900/60"
                >
                  <img :src="item.product.image" :alt="item.product.name" class="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-200/45 dark:border-slate-800" />
                  
                  <div class="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 class="text-xs font-black truncate text-slate-950 dark:text-slate-50">{{ item.product.name }}</h4>
                      <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider font-mono">QTY: {{ item.quantity }} • ${{ item.product.price.toLocaleString() }} EACH</p>
                    </div>
                  </div>

                  <span class="text-xs font-mono font-black text-slate-950 dark:text-slate-50 shrink-0">${{ (item.product.price * item.quantity).toLocaleString() }}</span>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-slate-100 dark:bg-slate-900"></div>

              <!-- Financial ledger calculations -->
              <div class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Subtotal Amount</span>
                  <span class="font-mono text-slate-950 dark:text-slate-50">${{ cartStore.subtotal.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Calculated Sales Tax (8.25%)</span>
                  <span class="font-mono text-slate-950 dark:text-slate-50">${{ cartStore.tax.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Cargo Transportation & Logistics</span>
                  <span class="font-mono text-slate-950 dark:text-slate-50">
                    <span v-if="cartStore.shipping === 0" class="text-emerald-500 font-bold uppercase">FREE EXPRESS</span>
                    <span v-else>${{ cartStore.shipping.toLocaleString() }}</span>
                  </span>
                </div>
                
                <div class="h-px bg-slate-150 dark:bg-slate-900 my-2"></div>
                
                <div class="flex justify-between text-xs font-bold uppercase">
                  <span>Total Capital Outlay</span>
                  <span class="font-mono text-indigo-650 dark:text-indigo-400 text-sm font-black">${{ cartStore.total.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Guarantee Checklist -->
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col gap-2.5">
              <div class="flex items-center gap-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                <ShieldCheck class="w-4 h-4 text-emerald-500" /> SECURE TUNNEL PROTOCOLS ACTIVE
              </div>
              <div class="flex items-center gap-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                <Truck class="w-4 h-4 text-indigo-500" /> ELIGIBLE FOR EXPRESS CARGO DISPATCH
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

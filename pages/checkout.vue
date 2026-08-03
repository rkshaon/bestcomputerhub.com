<!-- File: /pages/checkout.vue -->
<script setup lang="ts">
import { ChevronRight, CreditCard, ShieldCheck, Truck, PackageCheck, AlertCircle, Smartphone, Banknote } from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';

const cartStore = useCartStore();
const step = ref(1);

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  zip: '',
  paymentMethod: 'card', // 'card' | 'mfs' | 'cod'
  cardNumber: '',
  expiry: '',
  cvv: '',
  mfsType: 'bkash', // 'bkash' | 'nagad' | 'rocket'
  mfsNumber: '',
  mfsTransactionId: ''
});

const isProcessing = ref(false);
const orderCompleted = ref(false);

const handlePlaceOrder = () => {
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
      <div class="container mx-auto px-4 flex items-center justify-between">
        <NuxtLink to="/">
          <UiBrandLogo size="md" />
        </NuxtLink>
        <div class="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span :class="{ 'text-primary': step >= 1 }">Shipping</span>
          <ChevronRight class="w-4 h-4" />
          <span :class="{ 'text-primary': step >= 2 }">Payment</span>
          <ChevronRight class="w-4 h-4" />
          <span>Success</span>
        </div>
        <div class="flex items-center gap-2 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
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
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                <input v-model="form.firstName" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                <input v-model="form.lastName" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input v-model="form.email" type="email" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Street Address</label>
                <input v-model="form.address" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">City</label>
                <input v-model="form.city" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">ZIP / Postal Code</label>
                <input v-model="form.zip" type="text" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
            </div>

            <UiButton class="w-full h-14 rounded-2xl text-lg font-bold" @click="step = 2">
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
                      Please keep the exact amount ({{ formatCurrency(cartStore.totalPrice) }}) ready for our delivery partner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UiButton class="w-full h-14 rounded-2xl text-lg font-bold gap-2" @click="handlePlaceOrder" :disabled="isProcessing">
              <ShieldCheck class="w-5 h-5" v-if="!isProcessing" />
              {{ isProcessing ? 'Authorizing Transaction...' : `Pay ${formatCurrency(cartStore.totalPrice)}` }}
            </UiButton>
          </div>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-background rounded-3xl p-8 border shadow-sm sticky top-32">
            <h3 class="text-xl font-display font-bold mb-6">Order Summary</h3>
            <div class="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2">
              <div v-for="item in cartStore.items" :key="item.productId" class="flex gap-4">
                <div class="w-16 h-16 rounded-lg overflow-hidden border shrink-0 bg-muted">
                  <img :src="item.product.images[0]" class="w-full h-full object-cover" />
                </div>
                <div class="flex-grow">
                  <p class="font-bold text-sm line-clamp-1">{{ item.product.name }}</p>
                  <p class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</p>
                </div>
                <span class="font-bold text-sm">{{ formatCurrency(item.product.price * item.quantity) }}</span>
              </div>
            </div>

            <div class="space-y-3 pt-6 border-t font-medium">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Subtotal</span>
                <span>{{ formatCurrency(cartStore.totalPrice) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Shipping (Global Express)</span>
                <span class="text-green-600 font-bold">FREE</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Estimated Tax</span>
                <span>$0.00</span>
              </div>
              <div class="flex justify-between text-xl font-display font-bold pt-4 text-primary">
                <span>Total Due</span>
                <span>{{ formatCurrency(cartStore.totalPrice) }}</span>
              </div>
            </div>

            <div class="mt-8 p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
              <PackageCheck class="w-5 h-5 text-primary mt-1" />
              <p class="text-xs text-primary/80 leading-relaxed font-medium">
                Your order is eligible for **Priority Tech Handling**. Expected delivery within 72 hours via Global Express.
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
            <p class="text-lg font-mono font-bold">#TC-8822-4910-XM</p>
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

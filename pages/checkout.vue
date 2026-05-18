<script setup lang="ts">
import { ChevronRight, CreditCard, ShieldCheck, Truck, PackageCheck, AlertCircle } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';

const cartStore = useCartStore();
const step = ref(1);

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  zip: '',
  cardNumber: '',
  expiry: '',
  cvv: ''
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
        <NuxtLink to="/" class="font-display font-bold text-2xl tracking-tight text-primary">TechCore</NuxtLink>
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
              <div class="p-4 bg-muted rounded-2xl flex items-center justify-between border-2 border-primary/20">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-8 bg-background border rounded flex items-center justify-center font-bold text-blue-800">VISA</div>
                  <div>
                    <p class="font-bold text-sm">Credit or Debit Card</p>
                    <p class="text-xs text-muted-foreground">Secure payment via Stripe Enterprise</p>
                  </div>
                </div>
                <div class="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Card Number</label>
                <input v-model="form.cardNumber" type="text" placeholder="0000 0000 0000 0000" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiry Date</label>
                  <input v-model="form.expiry" type="text" placeholder="MM / YY" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">CVC / CVV</label>
                  <input v-model="form.cvv" type="text" placeholder="123" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none" />
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

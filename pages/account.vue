<script setup lang="ts">
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Calendar, 
  ShieldCheck, 
  Truck,
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-vue-next';
import { useAuthStore, type UserProfile } from '~/stores/auth';
import { cn } from '~/utils';

const authStore = useAuthStore();

const activeTab = ref<'orders' | 'profile'>('orders');

const profileForm = ref({
  name: '',
  email: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
});

// Sync data on mount
onMounted(() => {
  if (authStore.user) {
    profileForm.value = { ...authStore.user };
  }
});

watch(() => authStore.user, (newVal) => {
  if (newVal) profileForm.value = { ...newVal };
}, { deep: true });

const saveSuccess = ref(false);

const handleProfileSave = (e: Event) => {
  e.preventDefault();
  authStore.updateProfile({ ...profileForm.value });
  saveSuccess.value = true;
  setTimeout(() => {
    saveSuccess.value = false;
  }, 4000);
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left animate-in fade-in duration-500">
    
    <!-- Account banner -->
    <div class="border-b border-slate-200/50 dark:border-slate-800 pb-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shrink-0 capitalize">
          {{ authStore.user?.name.slice(0, 2) || 'US' }}
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none uppercase">
            {{ authStore.user?.name || 'RK Shaon' }}
          </h1>
          <p class="text-[10px] text-slate-400 font-extrabold uppercase mt-1.5 tracking-wider">
            Verified Patron Account Console • ID: #TC-{{ authStore.user?.email.slice(0, 5).toUpperCase() }}
          </p>
        </div>
      </div>

      <!-- Quick Toggles -->
      <div class="flex items-center gap-3">
        <button 
          @click="activeTab = 'orders'"
          :class="cn(
            'h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer leading-none',
            activeTab === 'orders' 
              ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
          )"
        >
          Order Logs ({{ authStore.orders.length }})
        </button>
        <button 
          @click="activeTab = 'profile'"
          :class="cn(
            'h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer leading-none',
            activeTab === 'profile' 
              ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
          )"
        >
          Delivery Profile
        </button>
      </div>
    </div>

    <!-- Active Panels Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <!-- Right Side: Active Workspace views -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Tab 1: Orders list -->
        <div v-if="activeTab === 'orders'" class="space-y-6">
          <div class="border-b border-slate-100 dark:border-slate-900 pb-4 flex justify-between items-center">
            <h2 class="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-slate-50">Authorized Capex Orders</h2>
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono">Verified Logs</span>
          </div>

          <div v-if="authStore.orders.length === 0" class="p-12 text-center rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <ShoppingBag class="w-12 h-12 text-slate-450 mx-auto mb-4" />
            <p class="text-xs font-black uppercase text-slate-450">Billing History Inert</p>
            <p class="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">No gadget order payloads have been transacted under this authenticated context yet.</p>
            <NuxtLink to="/products" class="inline-block mt-4">
              <UiButton variant="rose" size="sm">Shop Products</UiButton>
            </NuxtLink>
          </div>

          <div v-else class="space-y-6">
            <div 
              v-for="ord in authStore.orders" 
              :key="ord.id"
              class="border border-slate-200/60 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 shadow-sm"
            >
              <!-- Order Header details -->
              <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-wrap items-center gap-6 text-xs font-semibold">
                  <div>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">LEDGER ID</p>
                    <p class="font-mono font-black text-slate-900 dark:text-white leading-none">{{ ord.id }}</p>
                  </div>
                  <div>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">PLACED ON</p>
                    <p class="text-slate-900 dark:text-white font-black leading-none flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> {{ ord.date }}</p>
                  </div>
                  <div>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CAPEX TOTAL</p>
                    <p class="font-mono text-slate-900 dark:text-white font-black leading-none">${{ ord.total.toLocaleString() }}</p>
                  </div>
                </div>

                <!-- Shipping / processing state -->
                <div class="flex items-center gap-2">
                  <span 
                    :class="cn(
                      'text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl leading-none',
                      ord.status === 'Delivered' && 'bg-emerald-500/10 text-emerald-500',
                      ord.status === 'Processing' && 'bg-amber-500/10 text-amber-500',
                      ord.status === 'Shipped' && 'bg-indigo-500/10 text-indigo-500'
                    )"
                  >
                    ● {{ ord.status }}
                  </span>
                </div>
              </div>

              <!-- Order items content -->
              <div class="p-6 divide-y divide-slate-100 dark:divide-slate-900">
                <div 
                  v-for="(item, idx) in ord.items" 
                  :key="idx"
                  class="py-4 first:pt-0 last:pb-0 flex gap-4 items-center"
                >
                  <img :src="item.product.image" :alt="item.product.name" class="w-14 h-14 object-cover rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0" />
                  
                  <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-black uppercase tracking-tight text-slate-950 dark:text-slate-50 truncate">{{ item.product.name }}</h4>
                    <p class="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1 leading-none">QTY: {{ item.quantity }} • ${{ item.product.price.toLocaleString() }} EACH</p>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-xs font-mono font-black text-slate-900 dark:text-white">${{ (item.product.price * item.quantity).toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Details footer -->
              <div class="px-6 py-4 bg-slate-50/20 dark:bg-slate-900/5 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <span>EXPECTED CARGO ROADMAP: 2-3 DAYS</span>
                <span class="text-rose-500 flex items-center gap-1 hover:underline cursor-pointer">TRACK LOGISTIC PACKAGE <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Profile settings -->
        <div v-else-if="activeTab === 'profile'" class="space-y-6">
          <div class="border-b border-slate-100 dark:border-slate-900 pb-4">
            <h2 class="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-slate-50">Delivery Destination Profiler</h2>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Setup your shipping destination variables statefully</p>
          </div>

          <form @submit="handleProfileSave" class="space-y-6 p-6 md:p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Recipient Designation</label>
                <input 
                  v-model="profileForm.name"
                  type="text" 
                  required
                  class="h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-colors outline-none"
                />
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block block">Secure Ledger Gmail</label>
                <input 
                  v-model="profileForm.email"
                  type="email" 
                  required
                  class="h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-colors outline-none disabled:opacity-50"
                  disabled
                />
              </div>

              <!-- Address -->
              <div class="sm:col-span-2 space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block block">Sovereign Physical Address</label>
                <input 
                  v-model="profileForm.address"
                  type="text" 
                  required
                  class="h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-colors outline-none"
                />
              </div>

              <!-- City -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">City</label>
                <input 
                  v-model="profileForm.city"
                  type="text" 
                  required
                  class="h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-colors outline-none"
                />
              </div>

              <!-- Postal Code -->
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">ZIP postal code</label>
                <input 
                  v-model="profileForm.postalCode"
                  type="text" 
                  required
                  class="h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-colors outline-none"
                />
              </div>
            </div>

            <div class="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-900">
              <UiButton variant="rose" size="sm" type="submit">
                Commit & Update Profile
              </UiButton>
              <span v-if="saveSuccess" class="text-[9px] font-black uppercase tracking-widest text-[#10b981] animate-pulse">
                Delivery parameters synced successfully!
              </span>
            </div>
          </form>
        </div>

      </div>

      <!-- Left Side: Informational cards block -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Address profile preview card -->
        <div class="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-[2.5rem] text-left space-y-6">
          <div class="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-slate-450 border-b border-slate-150 dark:border-slate-900 pb-3 leading-none">
            <MapPin class="w-4 h-4 text-rose-500" /> Destination Blueprint
          </div>

          <div class="space-y-1">
            <h4 class="text-xs font-black uppercase text-slate-950 dark:text-slate-50 leading-tight">{{ authStore.user?.name }}</h4>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{{ authStore.user?.address }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{{ authStore.user?.postalCode }} • {{ authStore.user?.city }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{{ authStore.user?.country }}</p>
          </div>

          <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-2">
            <ShieldCheck class="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <p class="text-[8px] text-slate-400 font-bold uppercase leading-normal">
              Active ledger shipping destinations verified and protected.
            </p>
          </div>
        </div>

        <!-- Help information card -->
        <div class="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-[2.5rem] text-left space-y-4">
          <div class="text-[9px] font-black uppercase tracking-widest text-slate-450 border-b border-slate-150 dark:border-slate-900 pb-3 leading-none">
            SUPPORT DIRECTORY
          </div>

          <ul class="space-y-2.5 text-xs font-semibold">
            <li><NuxtLink to="/support/help-center" class="text-slate-500 dark:text-slate-450 hover:text-rose-500 flex items-center gap-2">Help Center Direct <ExternalLink class="w-3.5 h-3.5" /></NuxtLink></li>
            <li><NuxtLink to="/support/shipping" class="text-slate-500 dark:text-slate-450 hover:text-rose-500 flex items-center gap-2">Shipping Pathways <ExternalLink class="w-3.5 h-3.5" /></NuxtLink></li>
            <li><NuxtLink to="/support/returns" class="text-slate-500 dark:text-slate-450 hover:text-rose-500 flex items-center gap-2">Returns Dispatch <ExternalLink class="w-3.5 h-3.5" /></NuxtLink></li>
          </ul>
        </div>
      </div>

    </div>

  </div>
</template>

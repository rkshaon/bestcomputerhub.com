<!-- File: /pages/account.vue -->
<script setup lang="ts">
import { 
  User, 
  Package, 
  MapPin, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Bell,
  Clock,
  ArrowRight
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency, cn } from '@/utils';

const authStore = useAuthStore();

// Redirect to login if not logged in
if (process.client && !authStore.isLoggedIn) {
  navigateTo('/login');
}

const activeTab = ref('orders');

const tabs = [
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const mockOrders = [
  {
    id: 'ORD-99234',
    date: '2024-05-12',
    total: 1249.99,
    status: 'Delivered',
    itemsCount: 3,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'ORD-98102',
    date: '2024-04-28',
    total: 350.00,
    status: 'Processing',
    itemsCount: 1,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'ORD-97551',
    date: '2024-03-15',
    total: 2199.00,
    status: 'Shipped',
    itemsCount: 2,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=200&auto=format&fit=crop'
  }
];

const handleLogout = async () => {
  const route = useRoute();
  await authStore.logout(route.fullPath);
  toastSuccess('Secure session terminated successfully.');
};
</script>

<template>
  <div class="min-h-screen pb-20 bg-muted/20">
    <!-- Account Header -->
    <section class="bg-black text-white pt-32 pb-20 overflow-hidden relative">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div class="container mx-auto px-4 relative">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="relative">
            <div class="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/10 ring-4 ring-primary/20">
              <img :src="authStore.user?.avatar" :alt="authStore.user?.name" class="w-full h-full object-cover" />
            </div>
            <button class="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-xl hover:scale-110 transition-transform">
              <Settings class="w-4 h-4" />
            </button>
          </div>
          
          <div class="text-center md:text-left space-y-2">
            <h1 class="text-4xl md:text-5xl font-display font-bold">{{ authStore.user?.name }}</h1>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span class="text-white/60 text-sm font-medium flex items-center gap-1.5">
                <Clock class="w-4 h-4" /> Member since Nov 2023
              </span>
              <span class="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary border border-white/5">
                Enterprise Member
              </span>
            </div>
          </div>

          <div class="md:ml-auto flex items-center gap-4">
            <UiButton variant="outline" class="rounded-full text-white border-white/20 hover:bg-white/10" @click="handleLogout">
              <LogOut class="w-4 h-4 mr-2" /> Logout
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Area -->
    <div class="container mx-auto px-4 -mt-10 relative z-10">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:w-80 shrink-0">
          <div class="bg-card border rounded-[2.5rem] overflow-hidden p-3 sticky top-24 shadow-sm">
            <nav class="space-y-1">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group',
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )"
              >
                <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'" />
                {{ tab.label }}
                <ChevronRight class="w-4 h-4 ml-auto opacity-40" />
              </button>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow">
          <!-- Order History Tab -->
          <div v-if="activeTab === 'orders'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-display font-bold">Recent Orders</h2>
              <UiButton variant="ghost" size="sm" class="rounded-full font-bold">Filter By <ChevronRight class="w-4 h-4 rotate-90 ml-1" /></UiButton>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div 
                v-for="order in mockOrders" 
                :key="order.id"
                class="bg-card border rounded-[2rem] p-6 hover:border-primary/40 transition-colors group"
              >
                <div class="flex flex-col md:flex-row gap-6">
                  <div class="w-full md:w-24 h-24 bg-muted rounded-2xl overflow-hidden shrink-0">
                    <img :src="order.image" class="w-full h-full object-cover" />
                  </div>
                  
                  <div class="flex-grow space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                      <div class="space-y-1">
                        <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">{{ order.id }}</p>
                        <p class="font-bold">Ordered on {{ new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
                      </div>
                      
                      <div class="flex items-center gap-6">
                        <div class="text-right">
                          <p class="text-xs text-muted-foreground font-bold uppercase tracking-tight">Total Value</p>
                          <p class="text-lg font-bold">{{ formatCurrency(order.total) }}</p>
                        </div>
                        <span :class="cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                          order.status === 'Delivered' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                          order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                          'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        )">
                          {{ order.status }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t">
                      <p class="text-sm text-muted-foreground">{{ order.itemsCount }} items in this package</p>
                      <div class="flex items-center gap-2">
                        <UiButton variant="ghost" size="sm" class="rounded-full text-xs font-bold gap-1.5">
                          View Invoice <ExternalLink class="w-3 h-3" />
                        </UiButton>
                        <UiButton variant="outline" size="sm" class="rounded-full text-xs font-bold px-4">
                          Track Shipment
                        </UiButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Settings Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-8 animate-in fade-in duration-500">
            <h2 class="text-2xl font-display font-bold">Profile Details</h2>
            
            <div class="bg-card border rounded-[2.5rem] p-8 md:p-10 space-y-10">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input type="text" :value="authStore.user?.name" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input type="email" :value="authStore.user?.email" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                  <input type="tel" value="+1 (555) 000-0000" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company</label>
                  <input type="text" value="Enterprise Systems Inc." class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                </div>
              </div>

              <div class="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-3 text-muted-foreground">
                  <ShieldCheck class="w-5 h-5 text-primary" />
                  <p class="text-xs font-medium">Your data is secured by enterprise-grade encryption.</p>
                </div>
                <UiButton class="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20">
                  Save Changes
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Other tabs placeholders -->
          <div v-if="['addresses', 'payment', 'security', 'notifications'].includes(activeTab)" class="h-96 flex flex-col items-center justify-center bg-card border border-dashed rounded-[2.5rem] text-center p-12">
            <div class="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6">
              <component :is="tabs.find(t => t.id === activeTab)?.icon" class="w-10 h-10 text-muted-foreground opacity-40" />
            </div>
            <h3 class="text-xl font-bold mb-2">{{ tabs.find(t => t.id === activeTab)?.label }}</h3>
            <p class="text-muted-foreground text-sm max-w-xs mx-auto">This section is currently being updated to enhance your enterprise experience. Please check back shortly.</p>
            <UiButton variant="outline" class="rounded-full mt-8 gap-2 font-bold" @click="activeTab = 'orders'">
               Back to Orders <ArrowRight class="w-4 h-4" />
            </UiButton>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

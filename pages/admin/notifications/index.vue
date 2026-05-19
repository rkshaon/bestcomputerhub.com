<script setup lang="ts">
import { 
  Bell, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Trash2, 
  MoreVertical, 
  Package, 
  User, 
  CreditCard, 
  Zap,
  Filter,
  Search,
  Settings,
  MailOpen,
  Mail,
  MoreHorizontal,
  Clock,
  ArrowRight
} from 'lucide-vue-next';
import { cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

interface Notification {
  id: string;
  type: 'order' | 'system' | 'security' | 'inventory';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'security',
    priority: 'critical',
    title: 'Unauthorized Access Attempt',
    message: 'Multiple failed login attempts detected from IP 192.168.1.105 targeting the super-admin console.',
    timestamp: '2 mins ago',
    isRead: false,
    actionUrl: '/admin/security/logs'
  },
  {
    id: '2',
    type: 'inventory',
    priority: 'high',
    title: 'Critical Stock Level: Core Series X1',
    message: 'Inventory for Core Series X1 has fallen below the 5% threshold in the EMEA region.',
    timestamp: '15 mins ago',
    isRead: false,
    actionUrl: '/admin/inventory'
  },
  {
    id: '3',
    type: 'order',
    priority: 'medium',
    title: 'High-Value Order Received',
    message: 'New order #ORD-9942 ($12,400) placed by TechCorp Solutions.',
    timestamp: '1 hour ago',
    isRead: true,
    user: { name: 'Sarah Chen' }
  },
  {
    id: '4',
    type: 'system',
    priority: 'low',
    title: 'System Optimization Complete',
    message: 'Global database synchronization completed successfully. Latency lowered by 42ms.',
    timestamp: '3 hours ago',
    isRead: true
  },
  {
    id: '5',
    type: 'order',
    priority: 'medium',
    title: 'Shipment Delayed: Route Blockage',
    message: 'Freight shipment for Batch B-42 is delayed due to weather conditions in the Pacific corridor.',
    timestamp: '5 hours ago',
    isRead: false,
    actionUrl: '/admin/orders/B-42'
  }
]);

const filter = ref('all');
const searchQuery = ref('');

const filteredNotifications = computed(() => {
  return notifications.value.filter(n => {
    const matchesFilter = filter.value === 'all' || 
                          (filter.value === 'unread' && !n.isRead) ||
                          (filter.value === n.type);
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesFilter && matchesSearch;
  });
});

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30';
    case 'high': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
    case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
    default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/50';
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case 'security': return ShieldAlert;
    case 'inventory': return Package;
    case 'order': return CreditCard;
    case 'system': return Zap;
    default: return Bell;
  }
};

const markAllAsRead = () => {
  notifications.value.forEach(n => n.isRead = true);
};

const deleteNotification = (id: string) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const toggleReadStatus = (notification: Notification) => {
  notification.isRead = !notification.isRead;
};
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Central Communications Hub
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Activity Feed</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Monitor real-time system alerts, security incidents, and operational logs.</p>
      </div>

      <div class="flex items-center gap-3">
        <UiButton variant="outline" class="rounded-2xl h-11 px-6 gap-2 border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest" @click="markAllAsRead">
          <MailOpen class="w-4 h-4" /> Mark all read
        </UiButton>
        <UiButton variant="outline" class="rounded-2xl h-11 px-4 border-slate-200 dark:border-slate-800">
          <Settings class="w-4 h-4" />
        </UiButton>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div v-for="stat in [
        { label: 'Unread Alerts', value: notifications.filter(n => !n.isRead).length, color: 'text-primary' },
        { label: 'Security Threats', value: notifications.filter(n => n.type === 'security').length, color: 'text-rose-500' },
        { label: 'Operational Tasks', value: notifications.filter(n => n.type === 'inventory').length, color: 'text-amber-500' }
      ]" :key="stat.label" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 shadow-sm overflow-hidden relative group">
        <div class="absolute -right-2 -bottom-2 w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
        <div class="relative z-10 flex items-center justify-between">
          <div>
             <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{{ stat.label }}</p>
             <p :class="cn('text-3xl font-display font-black tracking-tighter', stat.color)">{{ stat.value }}</p>
          </div>
          <div :class="cn('w-12 h-12 rounded-2xl flex items-center justify-center opacity-10', stat.color.replace('text-', 'bg-'))">
            <Bell class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <!-- Search & Filters -->
      <div class="p-4 md:p-6 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col lg:flex-row gap-4">
        <div class="flex-1 relative group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search activity by title, message, or SKU..." 
            class="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 transition-all text-xs font-medium"
          />
        </div>
        
        <div class="flex items-center gap-3">
          <select 
            v-model="filter"
            class="h-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 text-[10px] font-bold uppercase tracking-widest cursor-pointer appearance-none shadow-sm min-w-[160px]"
          >
            <option value="all">All Events</option>
            <option value="unread">Unread Only</option>
            <option value="security">Security</option>
            <option value="inventory">Logistics</option>
            <option value="order">Transactions</option>
          </select>
          
          <UiButton variant="outline" class="h-12 w-12 rounded-xl p-0 shadow-sm border-slate-200 dark:border-slate-800">
            <Filter class="w-4 h-4" />
          </UiButton>
        </div>
      </div>

      <!-- Feed List -->
      <div class="divide-y divide-slate-50 dark:divide-slate-900">
        <div 
          v-for="n in filteredNotifications" 
          :key="n.id" 
          :class="cn(
            'group p-6 md:px-8 transition-all duration-300 flex flex-col md:flex-row gap-6 relative',
            !n.isRead ? 'bg-primary/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
          )"
        >
          <!-- Unread Dot Indicator -->
          <div v-if="!n.isRead" class="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>

          <!-- Type Icon -->
          <div class="shrink-0 flex flex-col items-center">
            <div :class="cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500', 
              getPriorityColor(n.priority)
            )">
              <component :is="getIcon(n.type)" class="w-7 h-7" />
            </div>
            <div class="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <Clock class="w-3 h-3" /> {{ n.timestamp }}
            </div>
          </div>

          <!-- Content Body -->
          <div class="flex-1 space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <span :class="cn('px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest', getPriorityColor(n.priority))">
                    {{ n.priority }}
                  </span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ n.type }} report</span>
                </div>
                <h3 class="text-sm md:text-base font-display font-bold tracking-tight text-slate-900 dark:text-white">{{ n.title }}</h3>
              </div>
              
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  @click="toggleReadStatus(n)" 
                  class="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg bg-slate-100 dark:bg-slate-800"
                  v-tooltip="n.isRead ? 'Mark as unread' : 'Mark as read'"
                >
                  <component :is="n.isRead ? Mail : MailOpen" class="w-4 h-4" />
                </button>
                <button 
                   @click="deleteNotification(n.id)" 
                   class="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              {{ n.message }}
            </p>

            <div v-if="n.user || n.actionUrl" class="flex items-center gap-4 pt-2">
              <div v-if="n.user" class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
                <div class="w-5 h-5 rounded-full overflow-hidden bg-slate-200">
                  <img :src="`https://api.dicebear.com/7.x/initials/svg?seed=${n.user.name}`" />
                </div>
                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{{ n.user.name }}</span>
              </div>
              
              <NuxtLink 
                v-if="n.actionUrl" 
                :to="n.actionUrl" 
                class="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                Resolve Incident <ArrowRight class="w-3 h-3" />
              </NuxtLink>
            </div>
          </div>

          <!-- Vertical More Action -->
          <button class="shrink-0 p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 md:self-start">
            <MoreVertical class="w-5 h-5" />
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="filteredNotifications.length === 0" class="py-20 flex flex-col items-center text-center px-6">
          <div class="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-800 mb-6">
            <CheckCircle2 class="w-12 h-12" />
          </div>
          <h3 class="text-xl font-display font-bold text-slate-900 dark:text-white">Zero events found</h3>
          <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-xs text-sm">Your systems are operating within optimal parameters and no alerts match your current filter.</p>
          <UiButton @click="filter = 'all'; searchQuery = ''" variant="outline" class="mt-8 rounded-xl font-bold text-[10px] uppercase tracking-widest px-8">Reset Viewport</UiButton>
        </div>
      </div>

      <!-- Footer/Pagination -->
      <div class="p-6 border-t border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Showing <span class="text-slate-900 dark:text-white">{{ filteredNotifications.length }}</span> of {{ notifications.length }} registered events
        </div>
        <div class="flex items-center gap-1.5">
           <UiButton variant="outline" size="sm" class="h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest disabled:opacity-30" disabled>Previous</UiButton>
           <UiButton variant="outline" size="sm" class="h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest">Next</UiButton>
        </div>
      </div>
    </div>

    <!-- Subscription Card -->
    <UiCard class="p-8 bg-black text-white rounded-[2.5rem] border-none overflow-hidden relative">
      <div class="absolute right-0 top-0 w-1/3 h-full bg-primary/20 blur-[100px] pointer-events-none"></div>
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h3 class="text-2xl font-display font-extrabold tracking-tight mb-2">Automated Alerting Protocols</h3>
          <p class="text-slate-400 text-sm max-w-xl">Configure critical incident webhooks and email routing to ensure your dev-ops team is notified within sub-100ms of any network variance.</p>
        </div>
        <UiButton class="bg-white text-black hover:bg-slate-100 rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest shrink-0 shadow-2xl">
          CONFIGURE WEBHOOKS
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

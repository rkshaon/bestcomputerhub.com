<script setup lang="ts">
import { 
  Bell, 
  Mail, 
  MailOpen, 
  Trash2, 
  Check, 
  RefreshCcw, 
  BellOff, 
  ShieldAlert, 
  Clock 
} from 'lucide-vue-next';
import { cn } from '~/utils';

definePageMeta({
  layout: 'admin'
});

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

const notifications = ref<Notification[]>([
  {
    id: 'NOT-101',
    title: 'High Resource CPU Usage Detected',
    message: 'Hypervisor-08 reports aggregate core load exceeding 94%. Check resource scaling parameters.',
    isRead: false,
    severity: 'high',
    timestamp: '2 mins ago'
  },
  {
    id: 'NOT-102',
    title: 'WAF Rule Modified Successfully',
    message: 'Port forwarding configurations on rule core-ingress-02 updated by network_admin.',
    isRead: false,
    severity: 'low',
    timestamp: '1 hour ago'
  },
  {
    id: 'NOT-103',
    title: 'SSH Key Rolling Cycle Failed',
    message: 'Technician host cluster-07 reports connection timeout during scheduled ECDSA rotation.',
    isRead: true,
    severity: 'medium',
    timestamp: '3 hours ago'
  },
  {
    id: 'NOT-104',
    title: 'New Account Elevation Proposal',
    message: 'Account coordinator r_smith requested sudo elevation on billing-master Node.',
    isRead: true,
    severity: 'high',
    timestamp: '1 day ago'
  }
]);

const markAsRead = (id: string) => {
  const item = notifications.value.find(n => n.id === id);
  if (item) item.isRead = true;
};

const deleteNotification = (id: string) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const markAllRead = () => {
  notifications.value.forEach(n => n.isRead = true);
};

const deleteRead = () => {
  notifications.value = notifications.value.filter(n => !n.isRead);
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 font-display">
          <Bell class="w-3.5 h-3.5 animate-bounce" />
          Real-time Event Triggers
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Notification Center</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Configure active system webhook relays and monitor defensive network triggers.</p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton 
          v-if="notifications.some(n => !n.isRead)"
          variant="outline" 
          class="h-10 px-5 gap-2"
          @click="markAllRead"
        >
          <Check class="w-4 h-4" /> Mark All Read
        </UiButton>
        <UiButton 
          v-if="notifications.some(n => n.isRead)"
          variant="outline" 
          class="h-10 px-5 gap-2 border-slate-200/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-rose-500"
          @click="deleteRead"
        >
          <Trash2 class="w-4 h-4" /> Purge Read Events
        </UiButton>
      </div>
    </div>

    <!-- Main Workspace Container -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Notifications List Feed -->
      <div class="lg:col-span-8 space-y-4">
        <div v-if="notifications.length === 0" class="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-950/30">
          <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400 mb-6">
            <BellOff class="w-8 h-8" />
          </div>
          <h3 class="text-sm font-black uppercase tracking-[0.2em]">Absolute Serenity</h3>
          <p class="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">No pending system alarms or warning logs exist. Your defensive parameter looks perfectly nominal.</p>
        </div>

        <div 
          v-for="not in notifications" 
          :key="not.id"
          :class="cn(
            'p-6 rounded-[2rem] border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-950',
            not.isRead 
              ? 'opacity-70 border-slate-200/50 dark:border-slate-800/80 grayscale-[30%]' 
              : 'border-l-4 shadow-sm border-slate-200 dark:border-slate-800',
            !not.isRead && not.severity === 'high' && 'border-l-rose-500 shadow-rose-500/5',
            !not.isRead && not.severity === 'medium' && 'border-l-amber-500',
            !not.isRead && not.severity === 'low' && 'border-l-emerald-500'
          )"
        >
          <div class="flex items-start gap-4">
            <div :class="cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
              not.severity === 'high' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' :
              not.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' :
              'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
            )">
              <component :is="not.severity === 'high' ? ShieldAlert : Bell" class="w-5 h-5" />
            </div>
            
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-black text-slate-950 dark:text-slate-50 leading-none shadow-none border-none">{{ not.title }}</h3>
                <span :class="cn(
                  'px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest leading-none border',
                  not.severity === 'high' ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 text-rose-500' :
                  not.severity === 'medium' ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 text-amber-500' :
                  'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 text-emerald-500'
                )">
                  {{ not.severity }}
                </span>
                <span v-if="!not.isRead" class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed pr-4">{{ not.message }}</p>
              <div class="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                <code class="font-mono bg-slate-50 dark:bg-slate-900/50 px-1 rounded">{{ not.id }}</code>
                <span class="flex items-center gap-1"><Clock class="w-3 h-3" /> {{ not.timestamp }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrinks-0 md:pl-4">
            <button 
              v-if="!not.isRead"
              @click="markAsRead(not.id)"
              class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-xl transition-all h-9 w-9 flex items-center justify-center border-none cursor-pointer bg-slate-50 dark:bg-slate-900/50"
            >
              <MailOpen class="w-4 h-4" />
            </button>
            <button 
              @click="deleteNotification(not.id)"
              class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-all h-9 w-9 flex items-center justify-center border-none cursor-pointer bg-slate-50 dark:bg-slate-900/50"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Settings summary panel -->
      <UiCard class="lg:col-span-4 p-6 h-fit space-y-6 bg-white dark:bg-slate-950">
        <div>
          <h3 class="text-xs font-black uppercase tracking-[0.2em] mb-1 leading-none text-slate-950 dark:text-slate-50 border-none shadow-none">Relay Infrastructure Status</h3>
          <p class="text-[9px] text-slate-400 font-bold uppercase">Configure webhook pathways & notification triggers</p>
        </div>

        <div class="space-y-4">
          <div v-for="channel in [
            { name: 'Email Dispatch Channel', status: 'Optimal', active: true },
            { name: 'Slack Webhook Relayer', status: 'Optimal', active: true },
            { name: 'Console Log System', status: 'Enforced', active: true }
          ]" :key="channel.name" class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ channel.name }}</span>
            <div class="flex items-center gap-1.5">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               <span class="text-[9px] font-black uppercase tracking-widest text-emerald-600">{{ channel.status }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed italic">
          "Webhook notifications are sent over encrypted TLS 1.3 pathways to protect network event data structures."
        </div>
      </UiCard>

    </div>

  </div>
</template>

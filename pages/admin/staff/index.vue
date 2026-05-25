<!-- File: /pages/admin/staff/index.vue -->
<script setup lang="ts">
import { 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  MoreVertical, 
  Plus, 
  Mail, 
  Shield,
  Clock,
  Dot
} from 'lucide-vue-next';
import { cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

const staffMembers = [
  { id: 'st_1', name: 'Sarah Anderson', email: 'sarah.a@techcore.io', role: 'Super Admin', status: 'online', joinedAt: '2023-11-15', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop' },
  { id: 'st_2', name: 'Marcus Chen', email: 'm.chen@techcore.io', role: 'Support Lead', status: 'away', joinedAt: '2024-01-10', avatar: null },
  { id: 'st_3', name: 'Elena Rodriguez', email: 'elena@techcore.io', role: 'Inventory Manager', status: 'offline', joinedAt: '2023-12-05', avatar: null },
];

const statusColors: Record<string, string> = {
  online: 'text-emerald-500',
  away: 'text-amber-500',
  offline: 'text-slate-400',
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Staff Protocol</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Manage personnel access and workspace permissions.</p>
      </div>
      <button class="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
        <Plus class="w-4 h-4" /> Provision Staff Access
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="staff in staffMembers" :key="staff.id" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group hover:scale-[1.01] transition-all duration-300">
        <div class="flex items-start justify-between mb-6">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
             <img v-if="staff.avatar" :src="staff.avatar" class="w-full h-full object-cover" />
             <User v-else class="w-8 h-8 text-slate-400" />
          </div>
          <button class="p-2 text-slate-400 hover:text-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 rounded-xl transition-all">
            <MoreVertical class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-display font-bold leading-none">{{ staff.name }}</h3>
            <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
              <Mail class="w-3 h-3" /> {{ staff.email }}
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <ShieldCheck v-if="staff.role === 'Super Admin'" class="w-4 h-4 text-primary" />
              <Shield v-else class="w-4 h-4 text-slate-400" />
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">{{ staff.role }}</span>
            </div>
            <div class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest" :class="statusColors[staff.status]">
              <Dot class="w-6 h-6 -mx-1.5" stroke-width="8" /> {{ staff.status }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <Clock class="w-3 h-3" /> Activated {{ new Date(staff.joinedAt).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

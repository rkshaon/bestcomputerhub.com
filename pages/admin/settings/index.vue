<script setup lang="ts">
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Key, 
  Mail, 
  Save,
  CheckCircle2,
  Lock,
  User,
  Monitor,
  Database
} from 'lucide-vue-next';
import { cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

const activeTab = ref('general');
const isSaving = ref(false);
const showSuccess = ref(false);

const tabs = [
  { id: 'general', name: 'General', icon: Settings },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'localization', name: 'Localization', icon: Globe },
];

const handleSave = async () => {
  isSaving.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  isSaving.value = false;
  showSuccess.value = true;
  setTimeout(() => showSuccess.value = false, 3000);
};
</script>

<template>
  <div class="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">System Configuration</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Manage global enterprise settings and security protocols.</p>
      </div>
      <button 
        @click="handleSave"
        class="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        :disabled="isSaving"
      >
        <Save v-if="!isSaving" class="w-4 h-4" />
        <span v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-1"></span>
        {{ isSaving ? 'Saving...' : 'Persist Changes' }}
      </button>
    </div>

    <div v-if="showSuccess" class="bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
      <CheckCircle2 class="w-5 h-5" />
      <span class="text-sm font-bold">Configuration synchronized successfully.</span>
    </div>

    <div class="flex flex-col md:flex-row gap-8">
      <!-- Tabs sidebar -->
      <aside class="md:w-64 space-y-1">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm',
            activeTab === tab.id 
              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          )"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
        </button>
      </aside>

      <!-- Settings Panels -->
      <div class="flex-1 space-y-6">
        <!-- General Panel -->
        <div v-show="activeTab === 'general'" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <div class="space-y-6">
            <h3 class="text-lg font-display font-bold flex items-center gap-2">
              <Monitor class="w-5 h-5 text-primary" /> Store Configuration
            </h3>
            <div class="grid grid-cols-1 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Environment Name</label>
                <input type="text" value="TechCore Global Enterprise" class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Support Endpoint</label>
                <input type="email" value="ops@techcore.io" class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
              </div>
            </div>
          </div>

          <div class="pt-8 border-t border-slate-100 dark:border-slate-900 space-y-6">
            <h3 class="text-lg font-display font-bold flex items-center gap-2 text-rose-500">
              <Database class="w-5 h-5" /> Maintenance Zone
            </h3>
            <div class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</p>
                <p class="text-xs text-slate-400">Offline store for scheduled hardware updates.</p>
              </div>
              <div class="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full relative cursor-pointer group">
                <div class="absolute left-1 top-1 w-4 h-4 bg-white dark:bg-slate-600 rounded-full transition-all group-hover:bg-slate-300"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Panel -->
        <div v-show="activeTab === 'security'" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
           <h3 class="text-lg font-display font-bold flex items-center gap-2">
              <Lock class="w-5 h-5 text-primary" /> Access Control
            </h3>
            <div class="space-y-6">
              <div class="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Shield class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-emerald-700 dark:text-emerald-500">2FA is Enabled</p>
                    <p class="text-[10px] text-emerald-600/70 font-bold uppercase tracking-tight">Enterprise Compliance Grade</p>
                  </div>
                </div>
                <button class="text-xs font-bold text-emerald-700 hover:underline">Manage</button>
              </div>

              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Session Timeout (minutes)</label>
                  <input type="number" value="60" class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

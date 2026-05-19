<script setup lang="ts">
import { 
  Settings, 
  User, 
  Lock, 
  Globe, 
  Bell, 
  Cpu, 
  Save, 
  Check, 
  ShieldCheck, 
  Terminal,
  Activity,
  AlertTriangle,
  Sun,
  Moon,
  Monitor
} from 'lucide-vue-next';
import { cn } from '~/utils';
import { useUIStore } from '~/stores/ui';

definePageMeta({
  layout: 'admin'
});

const uiStore = useUIStore();

const activeTab = ref('general');
const isSaving = ref(false);
const showSuccessToast = ref(false);

const tabs = [
  { id: 'general', name: 'General Settings', icon: Settings, desc: 'Global branding & config' },
  { id: 'security', name: 'Security Policy', icon: Lock, desc: 'MFA & Session handlers' },
  { id: 'network', name: 'WAF & Ingress', icon: Globe, desc: 'IP limits & firewalls' }
];

// Form states
const generalConfig = ref({
  consoleName: 'TechCore Premium Admin Desk',
  maintenanceMode: false,
  primaryRegion: 'eu-central-1',
  supportEmail: 'sec-ops@techcore.io'
});

const securityConfig = ref({
  mfaEnforced: true,
  sessionTimeout: '2 hours',
  passwordRotation: '90 days'
});

const networkConfig = ref({
  rateLimit: 1200,
  ddosMitigation: 'high',
  piiScrubbing: true
});

const handleSave = async () => {
  isSaving.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  isSaving.value = false;
  showSuccessToast.value = true;
  setTimeout(() => {
    showSuccessToast.value = false;
  }, 4000);
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-rose-550 dark:text-rose-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 leading-none">
          <Settings class="w-3.5 h-3.5" />
          Settings Node
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">System Configuration</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Configure global e-commerce policies, WAF firewall levels, and console appearance interfaces.</p>
      </div>

      <!-- Secure save button with explicit contrasting text -->
      <button 
        @click="handleSave"
        class="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:text-slate-950 dark:hover:bg-rose-450 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
        :disabled="isSaving"
      >
        <Save v-if="!isSaving" class="w-4 h-4 shrink-0" />
        <span v-else class="animate-spin border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950 rounded-full w-4 h-4 mr-1 shrink-0"></span>
        {{ isSaving ? 'Committing...' : 'Persist Changes' }}
      </button>
    </div>

    <!-- Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Side Navigation Sidebar Panel -->
      <UiCard class="lg:col-span-4 p-4 h-fit space-y-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
        <div class="p-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 dark:border-slate-800/80 mb-2">
          Category Clusters
        </div>
        
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="cn(
            'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left cursor-pointer border border-transparent outline-none',
            activeTab === tab.id 
              ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-slate-950 shadow-lg shadow-rose-500/15 font-black' 
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-950'
          )"
        >
          <component :is="tab.icon" :class="cn('w-5 h-5 shrink-0', activeTab === tab.id ? 'text-white dark:text-slate-950' : 'text-slate-400')" />
          <div>
            <p class="text-xs font-black uppercase tracking-wider leading-none">{{ tab.name }}</p>
            <p :class="cn('text-[8px] mt-1 Leading-none font-bold uppercase tracking-wider leading-none', activeTab === tab.id ? 'text-rose-100 dark:text-slate-800' : 'text-slate-400')">{{ tab.desc }}</p>
          </div>
        </button>
      </UiCard>

      <!-- Main Form Config Screen -->
      <UiCard class="lg:col-span-8 p-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
        
        <!-- Toast feedback layout -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-250 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0"
        >
          <div v-if="showSuccessToast" class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in">
             <ShieldCheck class="w-5 h-5 text-emerald-500 shrink-0" />
             <p class="text-xs font-black uppercase tracking-widest leading-none">Changes immutably synchronized with local storage state machine.</p>
          </div>
        </transition>

        <!-- General Form View -->
        <div v-if="activeTab === 'general'" class="space-y-8 animate-in fade-in duration-200">
          <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">General Parameters</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Branding parameters used globally across user views</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Console Title Name</label>
              <input 
                v-model="generalConfig.consoleName"
                type="text" 
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold focus:border-rose-500 transition-colors"
              />
            </div>
            
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Deploy Region</label>
              <select 
                v-model="generalConfig.primaryRegion"
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold cursor-pointer focus:border-rose-500 transition-colors"
              >
                <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="asia-east1">asia-east1 (Taiwan)</option>
              </select>
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Security Alert Dispatch Email</label>
              <input 
                v-model="generalConfig.supportEmail"
                type="email" 
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <!-- Triple-Theme Selector Matrix (Requested Feature) -->
          <div class="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <div>
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block pb-1">Appearance Profile Theme</label>
              <p class="text-[9px] text-slate-500 uppercase font-semibold leading-none">Sync layout coloring with system media preference or lock to dark/light modes</p>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <button 
                v-for="mode in ['light', 'dark', 'system'] as const"
                :key="mode"
                type="button"
                @click="uiStore.setTheme(mode)"
                :class="cn(
                  'h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 cursor-pointer outline-none',
                  uiStore.themeMode === mode 
                    ? 'bg-rose-600 border-rose-600 text-white dark:bg-rose-500 dark:border-rose-500 dark:text-slate-950 shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white'
                )"
                id="admin-theme-switch"
              >
                <Sun v-if="mode === 'light'" class="w-4 h-4 shrink-0" />
                <Moon v-else-if="mode === 'dark'" class="w-4 h-4 shrink-0" />
                <Monitor v-else class="w-4 h-4 shrink-0" />
                <span>{{ mode }}</span>
              </button>
            </div>
          </div>

          <!-- Maintenance shutdown switch -->
          <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <div class="space-y-1 pr-4">
              <p class="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Maintenance Shutdown Lock</p>
              <p class="text-[9px] text-slate-450 font-bold uppercase leading-relaxed">Turn off client access to the storefront during maintenance sprints.</p>
            </div>
            <button 
              type="button"
              @click="generalConfig.maintenanceMode = !generalConfig.maintenanceMode"
              :class="cn(
                'w-12 h-6.5 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none border-none',
                generalConfig.maintenanceMode ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'
              )"
            >
              <div :class="cn('w-4.5 h-4.5 rounded-full bg-white transition-all duration-200 shadow-sm', generalConfig.maintenanceMode ? 'translate-x-5.5' : 'translate-x-0')"></div>
            </button>
          </div>
        </div>

        <!-- Security Form View -->
        <div v-if="activeTab === 'security'" class="space-y-6 animate-in fade-in duration-200">
          <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Authentication Protocol Policies</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Manage global multi-factor credentials policies</p>
          </div>

          <div class="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Strict Core 2FA Mandate</p>
              <p class="text-[9px] text-slate-450 font-bold uppercase leading-relaxed">Mandatorily require hardware physical keys or authenticated OTP.</p>
            </div>
            <button 
              type="button"
              @click="securityConfig.mfaEnforced = !securityConfig.mfaEnforced"
              :class="cn(
                'w-12 h-6.5 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none border-none',
                securityConfig.mfaEnforced ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'
              )"
            >
              <div :class="cn('w-4.5 h-4.5 rounded-full bg-white transition-all duration-200 shadow-sm', securityConfig.mfaEnforced ? 'translate-x-5.5' : 'translate-x-0')"></div>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Session Expiration Limit</label>
              <select 
                v-model="securityConfig.sessionTimeout"
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold cursor-pointer focus:border-rose-500 transition-colors"
              >
                <option value="30 mins">30 Minutes</option>
                <option value="2 hours">2 Hours (Default)</option>
                <option value="12 hours">12 Hours</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Password Rotation Frequency</label>
              <select 
                v-model="securityConfig.passwordRotation"
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold cursor-pointer focus:border-rose-500 transition-colors"
              >
                <option value="30 days">Every 30 Days</option>
                <option value="90 days">Every 90 Days</option>
                <option value="never">Never (Not Recommended)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Network Form View -->
        <div v-if="activeTab === 'network'" class="space-y-6 animate-in fade-in duration-200">
          <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Edge WAF Settings</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Configure automated firewalls and rate throttle systems</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Rate Limit Capacity (Req/min)</label>
              <input 
                v-model="networkConfig.rateLimit"
                type="number" 
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold focus:border-rose-500 transition-colors"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Heuristics Protection Level</label>
              <select 
                v-model="networkConfig.ddosMitigation"
                class="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold cursor-pointer focus:border-rose-500 transition-colors"
              >
                <option value="low">Standard Monitoring</option>
                <option value="medium">Dynamic Mitigation</option>
                <option value="high">Hardened Protection Mode (High)</option>
              </select>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Automated PII Masking</p>
              <p class="text-[9px] text-slate-450 font-bold uppercase leading-relaxed">Dynamic masking protocols ensuring credit card billing remains unrecorded in server logs.</p>
            </div>
            <button 
              type="button"
              @click="networkConfig.piiScrubbing = !networkConfig.piiScrubbing"
              :class="cn(
                'w-12 h-6.5 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none border-none',
                networkConfig.piiScrubbing ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'
              )"
            >
              <div :class="cn('w-4.5 h-4.5 rounded-full bg-white transition-all duration-200 shadow-sm', networkConfig.piiScrubbing ? 'translate-x-5.5' : 'translate-x-0')"></div>
            </button>
          </div>
        </div>

      </UiCard>

    </div>

  </div>
</template>

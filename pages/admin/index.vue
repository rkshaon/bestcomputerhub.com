<script setup lang="ts">
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Users, 
  ArrowUpRight, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Fingerprint,
  Mail,
  Lock,
  Globe
} from 'lucide-vue-next';
import { cn } from '~/utils';

definePageMeta({
  layout: 'admin'
});

const stats = [
  { name: 'Threats Intercepted', value: '48,250', change: '+12.5%', isPositive: true, icon: Activity, color: 'text-rose-500 bg-rose-500/10' },
  { name: 'Active Admin Logins', value: '1,248', change: 'Nominal', isPositive: true, icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
  { name: 'Avg Gate Response', value: '142.5ms', change: '+4.2%', isPositive: true, icon: Cpu, color: 'text-emerald-500 bg-emerald-500/10' },
  { name: 'Global Server Load', value: '3.2%', change: '+1.8%', isPositive: true, icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10' },
];

const primaryMetrics = [
  { item: 'Sanitizer Ingress', progress: 99.4, color: 'bg-emerald-500' },
  { item: 'IAM Vault Enforcer', progress: 100, color: 'bg-indigo-500' },
  { item: 'WAF Edge Filters', progress: 98.7, color: 'bg-rose-500' }
];

const feeds = ref([
  { id: 'ACT-092', message: 'WAF ruleset automated sync complete', type: 'success', time: '2 mins ago' },
  { id: 'ACT-091', message: 'SSH key rotation executed on cluster-04', type: 'info', time: '14 mins ago' },
  { id: 'ACT-090', message: 'Core VM cluster response nominal', type: 'success', time: '29 mins ago' },
  { id: 'ACT-089', message: 'Incoming query sanitized by edge layer', type: 'success', time: '1 hour ago' }
]);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-750">
    
    <!-- Top Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <Fingerprint class="w-3.5 h-3.5 animate-pulse" />
          Secure Core Workspace
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Enterprise Console</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Real-time status overview of cryptographic gates and system node logs.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <NuxtLink to="/admin/security">
          <UiButton variant="outline" class="gap-2">
            <Lock class="w-4 h-4" /> Security Center
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/admin/settings">
          <UiButton variant="primary" class="gap-2 shadow-lg shadow-rose-500/20">
            Configure Gateways
          </UiButton>
        </NuxtLink>
      </div>
    </div>
 
    <!-- Quick Numerical Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UiCard v-for="stat in stats" :key="stat.name" class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div :class="cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', stat.color)">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
          <span :class="cn(
            'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border',
            stat.isPositive 
              ? 'text-emerald-600 bg-emerald-500/5 border-emerald-500/10' 
              : 'text-amber-500 bg-amber-500/5 border-amber-500/10'
          )">
            {{ stat.change }}
          </span>
        </div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{{ stat.name }}</p>
        <p class="text-2xl font-display font-black tracking-tight mt-1.5 text-slate-900 dark:text-white">{{ stat.value }}</p>
      </UiCard>
    </div>
 
    <!-- Metric Charts / Telemetry View -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Threat Trends Visual chart container -->
      <UiCard class="lg:col-span-8 p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Threat Mitigation Flow</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Interception volume compiled across primary gateways</p>
          </div>
          
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button class="px-3 py-1 bg-white dark:bg-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">Real-time</button>
            <button class="px-3 py-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[9px] font-black uppercase tracking-wider">Weekly</button>
          </div>
        </div>

        <!-- Inline customized SVG Chart representing modern glowing layout -->
        <div class="h-64 relative w-full mb-4">
          <svg class="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradient-rose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e11d48" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#e11d48" stop-opacity="0.00"/>
              </linearGradient>
              <linearGradient id="gradient-indigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.00"/>
              </linearGradient>
            </defs>

            <!-- Guide grid lines -->
            <line x1="0" y1="50" x2="500" y2="50" stroke="currentColor" stroke-dasharray="4,4" class="text-slate-200 dark:text-slate-800/60" stroke-width="1" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" stroke-dasharray="4,4" class="text-slate-200 dark:text-slate-800/60" stroke-width="1" />
            <line x1="0" y1="150" x2="500" y2="150" stroke="currentColor" stroke-dasharray="4,4" class="text-slate-200 dark:text-slate-800/60" stroke-width="1" />

            <!-- Area & Path 1: Rose (Security blocks) -->
            <path d="M 0 170 Q 100 130 180 150 T 320 80 T 450 140 T 500 110 L 500 200 L 0 200 Z" fill="url(#gradient-rose)" />
            <path d="M 0 170 Q 100 130 180 150 T 320 80 T 450 140 T 500 110" fill="none" stroke="#e11d48" stroke-width="3" stroke-linecap="round" />

            <!-- Area & Path 2: Indigo (Standard traffic density) -->
            <path d="M 0 120 Q 80 80 160 100 T 280 40 T 420 120 T 500 70 L 500 200 L 0 200 Z" fill="url(#gradient-indigo)" />
            <path d="M 0 120 Q 80 80 160 100 T 280 40 T 420 120 T 500 70" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-dasharray="1,1" />
          </svg>

          <!-- Hotspots on line graph -->
          <div class="absolute top-[85px] left-[63%] w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-pulse"></div>
          <div class="absolute top-[45px] left-[55%] w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/30"></div>
        </div>

        <div class="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest pt-2 border-t border-slate-50 dark:border-slate-900">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Active Blocks</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Telemetry Traffic</span>
          </div>
          <span>Updated: Just Now</span>
        </div>
      </UiCard>

      <!-- Gauge of Secure Policy Standards -->
      <UiCard class="lg:col-span-4 p-6 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Hardening Protocols</h3>
          <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Status of individual protective gates</p>
        </div>

        <div class="space-y-6 my-6">
          <div v-for="metric in primaryMetrics" :key="metric.item" class="space-y-2">
            <div class="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              <span>{{ metric.item }}</span>
              <span class="font-mono text-slate-900 dark:text-white">{{ metric.progress }}%</span>
            </div>
            <div class="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div :class="cn('h-full rounded-full transition-all duration-1000', metric.color)" :style="{ width: `${metric.progress}%` }"></div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-1.5">
            <TrendingUp class="w-4 h-4 text-emerald-500" />
            <span class="text-[9px] font-black uppercase tracking-widest text-emerald-600">Compliance Grade: A+</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
            "We are fully compliant with ISO/IEC 27001 standard security protocols as of May 19, 2026."
          </p>
        </div>
      </UiCard>
    </div>

    <!-- Recent Interactive Activity Logs Block -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Intercept Reports Feed -->
      <UiCard class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Active Operational Feed</h3>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Real-time status markers and ledger events</p>
          </div>
          <NuxtLink to="/admin/security">
            <UiButton variant="ghost" size="sm">Audit Desk</UiButton>
          </NuxtLink>
        </div>

        <div class="space-y-4">
          <div v-for="feed in feeds" :key="feed.id" class="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between group hover:border-rose-500/20 transition-all duration-300">
            <div class="flex items-center gap-3">
              <div :class="cn(
                'w-2 h-2 rounded-full ring-4',
                feed.type === 'success' && 'bg-emerald-500 ring-emerald-500/20',
                feed.type === 'warning' && 'bg-rose-500 ring-rose-500/20',
                feed.type === 'info' && 'bg-indigo-500 ring-indigo-500/20'
              )"></div>
              <div>
                <p class="text-xs font-bold text-slate-900 dark:text-white">{{ feed.message }}</p>
                <p class="text-[9px] font-mono font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{{ feed.id }} • {{ feed.time }}</p>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 hover:translate-x-1 transition-all" />
          </div>
        </div>
      </UiCard>

      <!-- Shortcut Directory Cards -->
      <UiCard class="p-6">
        <div class="mb-6">
          <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">System Directories</h3>
          <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Quick launch secondary administration nodes</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NuxtLink to="/admin/security" class="block p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-rose-500/15">
            <div class="flex justify-between items-start mb-4">
              <Lock class="w-5 h-5 text-rose-100" />
              <ArrowUpRight class="w-4 h-4 text-rose-100" />
            </div>
            <p class="text-xs font-black uppercase tracking-widest">Audit Logs</p>
            <p class="text-[9px] text-rose-200 uppercase mt-1 font-semibold leading-relaxed">Immutably stored platform authorization events.</p>
          </NuxtLink>

          <NuxtLink to="/admin/notifications" class="block p-5 bg-slate-900 text-white rounded-2xl hover:scale-[1.02] transition-transform border border-slate-800">
            <div class="flex justify-between items-start mb-4">
              <Mail class="w-5 h-5 text-slate-400" />
              <ArrowUpRight class="w-4 h-4 text-slate-400" />
            </div>
            <p class="text-xs font-black uppercase tracking-widest">Notification Area</p>
            <p class="text-[9px] text-slate-400 uppercase mt-1 font-semibold leading-relaxed">Adjust active system triggers, alarms, and mail receivers.</p>
          </NuxtLink>

          <NuxtLink to="/admin/settings" class="block p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl hover:scale-[1.02] transition-transform">
            <div class="flex justify-between items-start mb-4">
              <Settings class="w-5 h-5 text-slate-400" />
              <ArrowUpRight class="w-4 h-4 text-slate-400" />
            </div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">System Settings</p>
            <p class="text-[9px] text-slate-400 uppercase mt-1 font-semibold leading-relaxed">Custom branding, timezone overrides, and developer API configuration.</p>
          </NuxtLink>

          <div class="p-5 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <Globe class="w-5 h-5 text-indigo-500" />
              <span class="px-2 py-0.5 rounded bg-indigo-500 text-white text-[8px] font-black uppercase">LIVE</span>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Threat Syncer</p>
              <p class="text-[9px] text-slate-400 uppercase mt-1 leading-relaxed">Global network IP intelligence feeds actively connected.</p>
            </div>
          </div>
        </div>
      </UiCard>

    </div>

  </div>
</template>

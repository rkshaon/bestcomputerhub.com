<script setup lang="ts">
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  Fingerprint, 
  Globe, 
  Terminal, 
  Activity,
  Zap,
  ArrowRight,
  Eye,
  Settings,
  AlertCircle,
  Clock
} from 'lucide-vue-next';
import { cn } from '@/utils';

definePageMeta({
  layout: 'admin'
});

const securityScore = ref(94);
const lastAudit = ref('20 minutes ago');

const systems = [
  { name: 'Identity Engine', status: 'optimal', icon: Fingerprint, uptime: '99.99%' },
  { name: 'WAF Gateway', status: 'optimal', icon: Globe, uptime: '100%' },
  { name: 'Payload Scrubbing', status: 'warning', icon: Zap, uptime: '98.5%' },
  { name: 'Auth Vault', status: 'optimal', icon: Lock, uptime: '100%' },
];

const activeThreats = [
  { id: 'TH-042', origin: '14.2.8.4', device: 'Web Console', severity: 'low', type: 'Credential Stuffing', timestamp: '5 mins ago' },
  { id: 'TH-041', origin: '102.4.1.20', device: 'API Gateway', severity: 'medium', type: 'Rate Limit Exhaustion', timestamp: '12 mins ago' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'optimal': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
    case 'warning': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
    case 'critical': return 'text-rose-500 bg-rose-50 dark:bg-rose-950/30';
    default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/50';
  }
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <Shield class="w-3 h-3" />
          Core Security Protocol
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Security Command Center</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Real-time threat detection and global encryption enforcement.</p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink to="/admin/security/logs">
          <UiButton variant="outline" class="rounded-2xl h-11 px-6 gap-2 border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest">
            <Terminal class="w-4 h-4" /> Audit Logs
          </UiButton>
        </NuxtLink>
        <UiButton class="rounded-2xl h-11 px-6 gap-2 shadow-xl shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white border-none">
          <ShieldAlert class="w-4 h-4" /> Hardened Mode
        </UiButton>
      </div>
    </div>

    <!-- Top Grid: Score & Systems -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Security Score -->
      <UiCard class="lg:col-span-4 p-8 bg-slate-900 text-white relative overflow-hidden group">
        <div class="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div class="relative z-10">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Security Health Index</h3>
          
          <div class="flex flex-col items-center justify-center py-4">
            <div class="relative w-40 h-40">
              <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8" class="text-white/5" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8" 
                  stroke-dasharray="283" 
                  :stroke-dashoffset="283 - (283 * securityScore) / 100" 
                  class="text-emerald-500 transition-all duration-1000 ease-out" 
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-5xl font-display font-black tracking-tighter">{{ securityScore }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimal</span>
              </div>
            </div>
          </div>

          <div class="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Infrastructure Audit</span>
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Passed</span>
            </div>
            <p class="text-xs font-medium text-slate-300 italic">"Identity protocols and WAF rules are currently synchronized with cloud-tier standards."</p>
          </div>
        </div>
      </UiCard>

      <!-- Critical Systems Status -->
      <UiCard class="lg:col-span-8 p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h3 class="text-sm font-black uppercase tracking-[0.2em]">Operational Infrastructure</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Real-time status of security sub-systems</p>
          </div>
          <UiButton variant="ghost" size="sm" class="text-[10px] font-bold p-0">SYSTEM RESTART</UiButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="sys in systems" :key="sys.name" class="p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 group hover:border-primary/20 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div :class="cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500', getStatusColor(sys.status))">
                <component :is="sys.icon" class="w-6 h-6" />
              </div>
              <div class="text-right">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Uptime</p>
                <p class="text-sm font-display font-black text-slate-900 dark:text-white">{{ sys.uptime }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{{ sys.name }}</h4>
              <div class="flex items-center gap-1.5">
                <div :class="cn('w-1.5 h-1.5 rounded-full', sys.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500')"></div>
                <span :class="cn('text-[9px] font-black uppercase tracking-widest', sys.status === 'optimal' ? 'text-emerald-600' : 'text-amber-600')">{{ sys.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Active Threat Monitor & Protocols -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Active Threats -->
      <UiCard class="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden relative">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          Active Threat Interception
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[8px] font-black group">
            <Activity class="w-2 h-2 animate-pulse" />
            LIVE
          </div>
        </h3>
        
        <div class="space-y-4">
          <div v-for="threat in activeThreats" :key="threat.id" class="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Globe class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                   <span class="text-xs font-bold text-slate-900 dark:text-white">{{ threat.type }}</span>
                   <span :class="cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest', 
                     threat.severity === 'high' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                   )">{{ threat.severity }}</span>
                </div>
                <p class="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Origin: {{ threat.origin }} • {{ threat.timestamp }}</p>
              </div>
            </div>
            <UiButton variant="ghost" size="icon" class="rounded-xl hover:bg-white dark:hover:bg-slate-800">
               <Eye class="w-4 h-4 text-slate-400" />
            </UiButton>
          </div>
          
          <div class="pt-4 text-center">
            <NuxtLink to="/admin/security/logs" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center justify-center gap-2">
              View All Mitigation Reports <ArrowRight class="w-3 h-3" />
            </NuxtLink>
          </div>
        </div>
      </UiCard>

      <!-- Encryption & Keys -->
      <UiCard class="p-8 bg-indigo-600 text-white rounded-[2.5rem] border-none overflow-hidden relative group">
        <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-10">
            <div>
              <h3 class="text-sm font-black uppercase tracking-[0.2em] text-indigo-100">Global Encryption Layer</h3>
              <p class="text-[10px] text-indigo-200 font-bold uppercase mt-1">Key Management & Certificate Authority</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <Key class="w-6 h-6 text-white" />
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-xs font-bold">RSA-4096 Protocol</p>
                  <p class="text-[9px] text-indigo-200 font-bold uppercase">SSL/TLS 1.3 Active</p>
                </div>
              </div>
              <div class="w-12 h-6 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center text-[8px] font-black uppercase tracking-widest">LOCKED</div>
            </div>

            <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Settings class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-xs font-bold">Automatic Key Rotation</p>
                  <p class="text-[9px] text-indigo-200 font-bold uppercase">Next session in 4 hours</p>
                </div>
              </div>
              <UiButton variant="outline" class="border-white/20 text-white hover:bg-white/10 h-8 text-[8px] uppercase font-black px-4 rounded-xl">ROTATE NOW</UiButton>
            </div>
          </div>

          <div class="mt-10 flex items-center gap-3 p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30">
            <AlertCircle class="w-5 h-5 text-amber-300 shrink-0" />
            <p class="text-[10px] text-amber-100 font-medium leading-relaxed italic">
              "Note: Forcing a manual key rotation will momentarily reset all active session tokens across the platform."
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Security Protocols -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
       <div v-for="protocol in [
         { name: 'Firewall Policy', desc: 'Managed by Edge Defenders', icon: Shield },
         { name: 'Data Masking', desc: 'Dynamic PII scrubbing enabled', icon: Eye },
         { name: 'Intrusion Detection', desc: 'AI-driven heuristic analysis', icon: Activity }
       ]" :key="protocol.name" class="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] group hover:border-primary/20 transition-all duration-500">
         <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors mb-6 shadow-inner">
           <component :is="protocol.icon" class="w-8 h-8" />
         </div>
         <h4 class="text-sm font-black uppercase tracking-[0.2em] mb-2">{{ protocol.name }}</h4>
         <p class="text-xs text-slate-500 leading-relaxed">{{ protocol.desc }}</p>
       </div>
    </div>
  </div>
</template>

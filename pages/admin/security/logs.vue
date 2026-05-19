<script setup lang="ts">
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Globe, 
  Terminal, 
  UserCheck, 
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCcw,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  Key,
  Eye
} from 'lucide-vue-next';
import { cn } from '~/utils';

definePageMeta({
  layout: 'admin'
});

interface SecurityLog {
  id: string;
  event: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  ip: string;
  location: string;
  timestamp: string;
  status: 'allowed' | 'blocked' | 'flagged';
  details: string;
}

const logs = ref<SecurityLog[]>([
  {
    id: 'SEC-10042',
    event: 'Failed Login Attempt',
    severity: 'critical',
    source: 'Auth Service',
    ip: '192.168.1.105',
    location: 'Frankfurt, DE',
    timestamp: '2026-05-19 12:42:01',
    status: 'blocked',
    details: 'User: admin_root - Invalid credentials sequence detected.'
  },
  {
    id: 'SEC-10041',
    event: 'SSH Key Rotation',
    severity: 'info',
    source: 'Infrastructure',
    ip: 'Internal System',
    location: 'Global',
    timestamp: '2026-05-19 11:20:45',
    status: 'allowed',
    details: 'Standard automated key rotation for cluster-04.'
  },
  {
    id: 'SEC-10040',
    event: 'Privilege Escalation',
    severity: 'high',
    source: 'IAM Controller',
    ip: '10.0.4.12',
    location: 'Internal Network',
    timestamp: '2026-05-19 10:15:33',
    status: 'flagged',
    details: 'Technician r_smith requested sudo elevation on database-master.'
  },
  {
    id: 'SEC-10039',
    event: 'Database Query Spike',
    severity: 'medium',
    source: 'SQL Guard',
    ip: '172.16.0.45',
    location: 'Tokyo, JP',
    timestamp: '2026-05-19 09:05:12',
    status: 'allowed',
    details: 'Large batch read from analytics-node. Expected load.'
  },
  {
    id: 'SEC-10038',
    event: 'Firewall Rule Modified',
    severity: 'critical',
    source: 'Network Firewall',
    ip: '10.0.1.2',
    location: 'HQ Console',
    timestamp: '2026-05-19 08:30:00',
    status: 'allowed',
    details: 'Port 443 inbound rules updated by network_admin.'
  }
]);

const searchQuery = ref('');
const severityFilter = ref('all');
const isLoading = ref(false);

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         log.ip.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         log.id.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesSeverity = severityFilter.value === 'all' || log.severity === severityFilter.value;
    return matchesSearch && matchesSeverity;
  });
});

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30';
    case 'high': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
    case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
    case 'low': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-900/50';
  }
};

const refreshLogs = async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  isLoading.value = false;
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          Secure Access Management Console
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight">Security Audit Logs</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Comprehensive immutable log of all authenticated and unauthenticated network events.</p>
      </div>

      <div class="flex items-center gap-3">
        <UiButton variant="outline" class="rounded-2xl h-11 px-6 gap-2 border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest" @click="refreshLogs">
          <RefreshCcw :class="cn('w-4 h-4', isLoading && 'animate-spin')" />
          Refresh Stream
        </UiButton>
        <UiButton class="rounded-2xl h-11 px-6 gap-2 shadow-xl shadow-rose-500/20 bg-slate-900 hover:bg-black text-white border-none">
          <Download class="w-4 h-4" /> Export Audit
        </UiButton>
      </div>
    </div>

    <!-- Security Meta Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard class="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WAF Status</p>
            <p class="text-sm font-black uppercase tracking-tight">Active & Guarding</p>
          </div>
        </div>
        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full w-full"></div>
        </div>
      </UiCard>

      <UiCard class="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
            <Lock class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enforced 2FA</p>
            <p class="text-sm font-black uppercase tracking-tight">Compliance 100%</p>
          </div>
        </div>
        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div class="h-full bg-rose-500 rounded-full w-full"></div>
        </div>
      </UiCard>

      <UiCard class="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center">
            <Globe class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threat Intelligence</p>
            <p class="text-sm font-black uppercase tracking-tight">Syncing Global DB</p>
          </div>
        </div>
        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full w-3/4 animate-pulse"></div>
        </div>
      </UiCard>
    </div>

    <!-- Main Table Container -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in">
      <!-- Table Filters -->
      <div class="p-6 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col lg:flex-row gap-4">
        <div class="flex-1 relative group animate-in">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search logs by IP, event name, or trace ID..." 
            class="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 transition-all text-xs font-medium"
          />
        </div>
        
        <div class="flex items-center gap-3">
          <select 
            v-model="severityFilter"
            class="h-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 text-[10px] font-bold uppercase tracking-widest cursor-pointer appearance-none shadow-sm min-w-[160px]"
          >
            <option value="all">Global Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High Level</option>
            <option value="medium">Medium</option>
            <option value="info">Information Only</option>
          </select>
          
          <UiButton variant="outline" class="h-12 w-12 rounded-xl p-0 shadow-sm border-slate-200 dark:border-slate-800">
            <Filter class="w-4 h-4" />
          </UiButton>
        </div>
      </div>

      <!-- Log Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 dark:border-slate-900 bg-slate-50/10 dark:bg-slate-900/10">
              <th class="px-8 py-5">Event Identifier</th>
              <th class="px-8 py-5">Magnitude</th>
              <th class="px-8 py-5">Origin (IP)</th>
              <th class="px-8 py-5">Response</th>
              <th class="px-8 py-5">Timeline</th>
              <th class="px-8 py-5 text-right">Payload</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
            <tr v-for="log in filteredLogs" :key="log.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
              <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                    <Terminal class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{{ log.event }}</p>
                    <p class="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{{ log.id }}</p>
                  </div>
                </div>
              </td>

              <td class="px-8 py-6">
                <span :class="cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest', getSeverityClass(log.severity))">
                  {{ log.severity }}
                </span>
              </td>

              <td class="px-8 py-6">
                <div class="flex flex-col gap-0.5">
                  <code class="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{{ log.ip }}</code>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    <Globe class="w-3" /> {{ log.location }}
                  </span>
                </div>
              </td>

              <td class="px-8 py-6">
                <div class="flex items-center gap-2">
                  <div v-if="log.status === 'blocked'" class="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div v-else-if="log.status === 'flagged'" class="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div v-else class="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span :class="cn('text-[10px] font-bold uppercase tracking-widest', 
                    log.status === 'blocked' ? 'text-rose-600' : log.status === 'flagged' ? 'text-amber-600' : 'text-emerald-600'
                  )">
                    {{ log.status }}
                  </span>
                </div>
              </td>

              <td class="px-8 py-6">
                <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock class="w-3.5 h-3.5" />
                  {{ log.timestamp }}
                </div>
              </td>

              <td class="px-8 py-6 text-right">
                <UiButton variant="ghost" size="icon" class="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all opacity-40 group-hover:opacity-100 scale-90 group-hover:scale-100">
                  <Eye class="w-4 h-4" />
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Decorator -->
      <div class="p-6 border-t border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between">
        <div class="flex items-center gap-8">
           <div class="flex items-center gap-3">
             <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logging Engine Status: Nominal</span>
           </div>
           <div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
           <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ logs.length }} Events Indexed</span>
        </div>

        <div class="flex items-center gap-1.5 font-mono text-[10px] font-bold">
           <button class="p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg opacity-30" disabled>PREV</button>
           <button class="p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-900 text-white">01</button>
           <button class="p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg">02</button>
           <button class="p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg">NEXT</button>
        </div>
      </div>
    </div>

    <!-- Security Protocols Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <UiCard class="p-8 bg-slate-900 border-none text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(225,29,72,0.1),transparent)] pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-sm font-black uppercase tracking-[0.2em]">Active Threat Map</h3>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              <span class="text-[8px] font-black uppercase tracking-widest text-rose-500">Live Stream</span>
            </div>
          </div>
          
          <div class="space-y-4">
             <div v-for="t in [
               { label: 'Brute Force Denial', val: 82, color: 'bg-rose-500' },
               { label: 'SQL Injection Block', val: 94, color: 'bg-primary' },
               { label: 'XSS Sanitization', val: 99, color: 'bg-emerald-500' }
             ]" :key="t.label" class="space-y-2">
               <div class="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                 <span>{{ t.label }}</span>
                 <span>{{ t.val }}% Success</span>
               </div>
               <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div :class="cn('h-full rounded-full transition-all duration-1000', t.color)" :style="{ width: `${t.val}%` }"></div>
               </div>
             </div>
          </div>

          <div class="mt-10 flex items-center justify-between pt-8 border-t border-white/5">
             <div class="flex items-center gap-3">
               <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                 <Database class="w-5 h-5 text-slate-400" />
               </div>
               <div>
                  <p class="text-xs font-bold leading-none">Cold Storage</p>
                  <p class="text-[9px] text-slate-500 uppercase font-black mt-1">Logs retained for 7 years</p>
               </div>
             </div>
             <UiButton variant="outline" class="border-white/10 text-white hover:bg-white/5 h-10 text-[10px] uppercase font-black px-6 rounded-xl">
               Manage Retention
             </UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6">Security Context</h3>
        <div class="space-y-6">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3 mb-3">
              <UserCheck class="w-4 h-4 text-primary" />
              <span class="text-[10px] font-black uppercase tracking-widest">Admin Elevation Policy</span>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed italic">
              "Privileged actions require secondary biometric verification through the TechCore ID app. Logs are automatically mirrored to the compliance vault."
            </p>
          </div>

          <div class="flex items-center gap-6">
             <div class="flex-1 space-y-4">
               <div class="flex items-center gap-4">
                 <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Key class="w-5 h-5" />
                 </div>
                 <div>
                    <p class="text-xs font-bold">Encrypted Endpoints</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">TLS 1.3 Mandatory</p>
                 </div>
               </div>
               <div class="flex items-center gap-4">
                 <div class="w-10 h-10 rounded-xl bg-indigo-100/30 text-indigo-500 flex items-center justify-center">
                   <ShieldAlert class="w-5 h-5" />
                 </div>
                 <div>
                    <p class="text-xs font-bold">DDoS Protection</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase font-black">Cloudflare Tier 1</p>
                 </div>
               </div>
             </div>
             <div class="w-32 h-32 rounded-3xl border-4 border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
                <div class="text-center">
                  <p class="text-2xl font-display font-black tracking-tighter">A+</p>
                  <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Global Score</p>
                </div>
             </div>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

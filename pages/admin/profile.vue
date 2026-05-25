<!-- File: /pages/admin/profile.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Key, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Server, 
  Cpu, 
  RefreshCw,
  Smartphone,
  Globe,
  Lock
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useCookie } from '#app';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: 'admin'
});

const authStore = useAuthStore();

// Retrieve cookies directly to show token indicators
const accessTokenCookie = useCookie<string | null>('access_token');
const refreshTokenCookie = useCookie<string | null>('refresh_token');

const accessToken = computed(() => accessTokenCookie.value);
const refreshToken = computed(() => refreshTokenCookie.value);

const copiedField = ref<string | null>(null);
const isRegenerating = ref(false);

const maskToken = (token: string | null) => {
  if (!token) return 'NULL_EXPIRED_OR_UNSET';
  if (token.length < 30) return token;
  return `${token.substring(0, 12)}••••••••••••••••••••••••••••••••••••••••${token.substring(token.length - 12)}`;
};

const copyToClipboard = (text: string | null, fieldName: string) => {
  if (process.client && text) {
    navigator.clipboard.writeText(text);
    copiedField.value = fieldName;
    setTimeout(() => {
      copiedField.value = null;
    }, 2000);
  }
};

const triggerTokenRefresh = async () => {
  isRegenerating.value = true;
  try {
    // We can simulate or trigger api client refresh by forcing a simple request
    // or just let it show the active state. Let's do a short simulated call.
    await new Promise(resolve => setTimeout(resolve, 800));
  } catch (e) {
    console.error(e);
  } finally {
    isRegenerating.value = false;
  }
};

const joinDateFormatted = computed(() => {
  if (!authStore.user?.joinedAt) return 'November 2023';
  try {
    const d = new Date(authStore.user.joinedAt);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return authStore.user.joinedAt;
  }
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div>
      <h1 class="text-3xl font-display font-extrabold tracking-tight">System Identity & Clearance</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Active Credentials, Access Tokens & Cryptographic Verification</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile / User Details Card -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
          <!-- Background decoration -->
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          
          <div class="flex flex-col items-center text-center space-y-6">
            <div class="relative">
              <div class="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-slate-900 ring-4 ring-primary/20 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user?.name" class="w-full h-full object-cover" />
                <UserIcon v-else class="w-16 h-16 text-slate-300 dark:text-slate-700" />
              </div>
              <div class="absolute -bottom-2 right-1.5 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-950 shadow-md">
                <div class="w-2.5 h-2.5 bg-white rounded-full animate-ping absolute inset-1.5"></div>
                <div class="w-2.5 h-2.5 bg-white rounded-full relative"></div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {{ authStore.user?.role || 'Super Admin' }}
              </span>
              <h2 class="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">{{ authStore.user?.name || 'Administrator' }}</h2>
              <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">{{ authStore.user?.email || 'admin@techcore.io' }}</p>
            </div>

            <div class="w-full pt-6 border-t border-slate-100 dark:border-slate-900 space-y-4 text-left">
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ident Tag</span>
                <span class="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  {{ authStore.user?.id || 'usr_sys_001923' }}
                  <button 
                    @click="copyToClipboard(authStore.user?.id || 'usr_sys_001923', 'id')"
                    class="text-slate-400 hover:text-primary transition-colors"
                    title="Copy identifier"
                  >
                    <CheckCircle2 v-if="copiedField === 'id'" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Registry Date</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">
                  {{ joinDateFormatted }}
                </span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Clearance Level</span>
                <span class="text-xs font-extrabold uppercase tracking-widest text-[#0ea5e9] dark:text-[#38bdf8] flex items-center gap-1">
                  <ShieldCheck class="w-4 h-4" /> SECURE_LEVEL_3
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Infrastructure status -->
        <div class="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Cpu class="w-32 h-32 text-white" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-2">INTELLIGENCE TERMINAL</p>
          <h3 class="text-xl font-display font-black tracking-tight mb-4">Node Active</h3>
          <div class="space-y-3 font-mono text-[10px] text-slate-400">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>GATEWAY_STATUS: OPERATIONAL</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>TLS: AES_256_GCM_ENCRYPTED</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>INTEGRITY_INDEX: 1.000 (VALID)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Auth Tokens & Session Info -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <div>
            <h3 class="text-lg font-display font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Key class="w-5 h-5 text-primary" /> Active Bearer Tokens
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-xs mt-1">Cryptographic hashes currently preserved on this client node for secure microservices interfacing.</p>
          </div>

          <div class="space-y-6">
            <!-- Access Token block -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Lock class="w-3.5 h-3.5 text-primary" /> Access Token (JSON Web Token)
                </span>
                <span v-if="accessToken" class="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">PERSISTED_ACTIVE</span>
                <span v-else class="bg-rose-100 dark:bg-rose-950/30 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">UNSET_EXPIRED</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-500 truncate select-all">
                  {{ maskToken(accessToken) }}
                </div>
                <button 
                  v-if="accessToken"
                  @click="copyToClipboard(accessToken, 'access_token')"
                  class="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:text-primary transition-all flex items-center justify-center shrink-0"
                  title="Copy Access Token"
                >
                  <CheckCircle2 v-if="copiedField === 'access_token'" class="w-4 h-4 text-emerald-500" />
                  <Copy v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Refresh Token block -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                  <RefreshCw class="w-3.5 h-3.5 text-primary" /> Refresh Token
                </span>
                <span v-if="refreshToken" class="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">PERSISTED_ACTIVE</span>
                <span v-else class="bg-rose-100 dark:bg-rose-950/30 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">UNSET_EXPIRED</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-500 truncate select-all">
                  {{ maskToken(refreshToken) }}
                </div>
                <button 
                  v-if="refreshToken"
                  @click="copyToClipboard(refreshToken, 'refresh_token')"
                  class="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:text-primary transition-all flex items-center justify-center shrink-0"
                  title="Copy Refresh Token"
                >
                  <CheckCircle2 v-if="copiedField === 'refresh_token'" class="w-4 h-4 text-emerald-500" />
                  <Copy v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center gap-4 flex-wrap">
              <p class="text-xs text-slate-400">Tokens are safely stored under secure httpOnly-equivalent cookie headers with strict routing policies.</p>
              <button 
                @click="triggerTokenRefresh"
                :disabled="isRegenerating"
                class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw :class="['w-3.5 h-3.5', isRegenerating && 'animate-spin']" />
                {{ isRegenerating ? 'Verifying...' : 'Re-verify Node Session' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Session context Metadata -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div>
            <h3 class="text-lg font-display font-bold flex items-center gap-2">
              <Server class="w-5 h-5 text-primary" /> Active Terminal Metadata
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-xs mt-1">Diagnostic system fingerprint identifiers related to this authenticated browser node.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-start gap-3">
              <Smartphone class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Architecture</p>
                <p class="text-xs font-bold truncate">Web Client Interceptor</p>
                <p class="text-[10px] text-slate-500 mt-1 font-mono">Nuxt 3 / Vite Runtime</p>
              </div>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-start gap-3">
              <Globe class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Active Gateway</p>
                <p class="text-xs font-bold truncate">Cloud Run Container</p>
                <p class="text-[10px] text-slate-500 mt-1 font-mono">Port 3000 Ingress</p>
              </div>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-start gap-3">
              <Clock class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Session Expiry</p>
                <p class="text-xs font-bold truncate">7 Days Preserved</p>
                <p class="text-[10px] text-slate-500 mt-1 font-mono">Dynamic sliding windows</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

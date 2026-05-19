<script setup lang="ts">
import { ShieldAlert, ShieldCheck, ArrowRight, Key, Cpu, Network } from 'lucide-vue-next';
</script>

<template>
  <div class="relative min-h-[calc(100vh-8.5rem)] flex items-center justify-center py-16 px-6 overflow-hidden">
    <!-- Grid decorative background -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(225,29,72,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(225,29,72,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,rgba(225,29,72,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(225,29,72,0.01)_1px,transparent_1px)]"></div>
    
    <!-- Pulse decorative blurred lights -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

    <div class="relative z-10 text-center max-w-3xl space-y-10 animate-in fade-in duration-700">
      
      <!-- Safe alert badge -->
      <div class="inline-flex items-center gap-2.5 px-3.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.15em] leading-none">
        <ShieldCheck class="w-3.5 h-3.5" /> Security Gateway Active
      </div>

      <!-- Main Headline -->
      <div class="space-y-4">
        <h1 class="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-[1.1]">
          Unified Defensive <br />
          <span class="bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
            Security Control Console
          </span>
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          The unified security administration console for high-scale tech entities. Establish global compliance, audit real-time authorization states, and block ingress threat vectors in a single control layer.
        </p>
      </div>

      <!-- Grid Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-left flex flex-col justify-between h-36">
          <Cpu class="w-6 h-6 text-rose-500" />
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Load</p>
            <p class="text-lg font-display font-black tracking-tight mt-0.5">Optimized 0.2ms</p>
          </div>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-left flex flex-col justify-between h-36">
          <Network class="w-6 h-6 text-indigo-500" />
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global CDN</p>
            <p class="text-lg font-display font-black tracking-tight mt-0.5">99.999% Active</p>
          </div>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-left flex flex-col justify-between h-36">
          <Key class="w-6 h-6 text-emerald-500" />
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">WAF Mitigation</p>
            <p class="text-lg font-display font-black tracking-tight mt-0.5">24/7 Hardened</p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink to="/admin">
          <UiButton size="lg" variant="rose" class="gap-3 shadow-xl shadow-rose-500/20 w-fit">
            Enter Admin Panel <ArrowRight class="w-4 h-4" />
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/admin/security">
          <UiButton size="lg" variant="outline" class="w-fit">
            Launch Security Center
          </UiButton>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

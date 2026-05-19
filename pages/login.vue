<script setup lang="ts">
import { ShieldCheck, User, Mail, Lock, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const name = ref('');
const password = ref('');
const isSubmitting = ref(false);
const error = ref('');

const handleLogin = (e: Event) => {
  e.preventDefault();
  if (!email.value) {
    error.value = 'E-mail identity is required';
    return;
  }
  
  isSubmitting.value = true;
  error.value = '';

  // Simulate latency
  setTimeout(() => {
    authStore.login(email.value, name.value || undefined);
    isSubmitting.value = false;
    navigateTo('/account');
  }, 1000);
};
</script>

<template>
  <div class="min-h-[640px] flex items-center justify-center py-12 px-4 sm:px-6 text-left animate-in fade-in duration-500">
    <div class="max-w-md w-full bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8">
      
      <!-- Brand title header -->
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-display font-black uppercase tracking-widest text-slate-950 dark:text-slate-50 mt-4 leading-none">TERMINAL GATEWAY</h1>
          <p class="text-[9px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider leading-none">Sign in to your client-side profile context</p>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="error" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[9px] uppercase font-black tracking-widest text-center">
        {{ error }}
      </div>

      <form @submit="handleLogin" class="space-y-4">
        <!-- Optional Name field -->
        <div class="space-y-2">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block block">Full Recipient Identity</label>
          <div class="relative">
            <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="name"
              type="text" 
              placeholder="RK Shaon (Optional)" 
              class="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-250/20 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block block mb-1">Authenticated Email Address</label>
          <div class="relative">
            <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="email"
              type="email" 
              required
              placeholder="rkshaon.ist@gmail.com" 
              class="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-250/20 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Personal Passphrase</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="password"
              type="password" 
              placeholder="••••••••" 
              class="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-250/20 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
            />
          </div>
        </div>

        <UiButton 
          variant="rose" 
          size="md" 
          type="submit" 
          class="w-full h-11 shadow-xl shadow-rose-500/15 !mt-6"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="animate-pulse">Authenticating Cargo Credentials...</span>
          <span v-else class="flex items-center gap-2">Establish Core Connection <ArrowRight class="w-4 h-4" /></span>
        </UiButton>
      </form>

      <div class="text-center pt-2">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Anonymous credentials default-sync to RK Shaon profile context.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, User, Mail, Lock, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const name = ref('');
const password = ref('');
const isSubmitting = ref(false);
const error = ref('');

const handleSignup = (e: Event) => {
  e.preventDefault();
  if (!name.value) {
    error.value = 'Identity name is required';
    return;
  }
  if (!email.value) {
    error.value = 'Secure contact email is required';
    return;
  }
  
  isSubmitting.value = true;
  error.value = '';

  setTimeout(() => {
    authStore.signup(name.value, email.value);
    isSubmitting.value = false;
    navigateTo('/account');
  }, 1000);
};
</script>

<template>
  <div class="min-h-[640px] flex items-center justify-center py-12 px-4 sm:px-6 text-left animate-in fade-in duration-500">
    <div class="max-w-md w-full bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8">
      
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-display font-black uppercase tracking-widest text-slate-950 dark:text-slate-50 mt-4 leading-none">CREATE LEDGER</h1>
          <p class="text-[9px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider leading-none">Register a new sovereign developer account</p>
        </div>
      </div>

      <div v-if="error" class="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[9px] uppercase font-black tracking-widest text-center">
        {{ error }}
      </div>

      <form @submit="handleSignup" class="space-y-4">
        <!-- Name -->
        <div class="space-y-2">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-1">Primary Recipient Identity</label>
          <div class="relative">
            <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="name"
              type="text" 
              required
              placeholder="RK Shaon" 
              class="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-250/20 dark:border-slate-800 bg-transparent text-xs font-semibold focus:border-rose-500 transition-all outline-none"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-1">Secure Contact Email</label>
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
          <label class="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-1">Passphrase</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="password"
              type="password" 
              required
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
          <span v-if="isSubmitting" class="animate-pulse">Provisioning Secure Node Profile...</span>
          <span v-else class="flex items-center gap-2">Initialize Credentials Registry <ArrowRight class="w-4 h-4" /></span>
        </UiButton>
      </form>

      <div class="text-center pt-2">
        <NuxtLink to="/login" class="text-[10px] font-black uppercase tracking-widest text-[#6366f1] hover:underline">
          Return to login portal console
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

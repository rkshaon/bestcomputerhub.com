<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ShieldCheck, ArrowRight, Mail, Key } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value) {
    errorMsg.value = 'Email address is required';
    return;
  }
  
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    // Perform mock login
    authStore.login(email.value);
    
    // Redirect
    if (email.value.includes('admin')) {
      router.push('/admin/analytics');
    } else {
      router.push('/');
    }
  } catch (e) {
    errorMsg.value = 'Failed to execute login sequence.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative overflow-hidden">
    <!-- Ambient mesh background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Login card -->
    <div class="w-full max-w-lg bg-card border border-border/80 rounded-[3rem] p-10 md:p-14 shadow-2xl relative z-10 space-y-10">
      <div class="space-y-4 text-center">
        <div class="w-14 h-14 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck class="w-7 h-7" />
        </div>
        <h1 class="text-3xl md:text-4xl font-display font-extrabold tracking-tight">Enterprise Access</h1>
        <p class="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Sign into your TechCore identity credentials to coordinate dynamic inventory orders.
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Error warning -->
        <div v-if="errorMsg" class="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold uppercase tracking-wider text-center">
          {{ errorMsg }}
        </div>

        <div class="space-y-4">
          <!-- Email Block -->
          <div class="space-y-2">
            <label class="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block">Corporate Email</label>
            <div class="relative flex items-center">
              <Mail class="absolute left-4 w-5 h-5 text-muted-foreground/60 pointer-events-none" />
              <input 
                v-model="email"
                type="email" 
                placeholder="name@company.com"
                class="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border/80 hover:border-border focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all"
                required
              />
            </div>
          </div>

          <!-- Password Block -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block">Identity Password</label>
              <NuxtLink to="/forgot-password" class="text-[10px] uppercase tracking-widest font-extrabold text-primary hover:underline">Forgot Keys?</NuxtLink>
            </div>
            <div class="relative flex items-center">
              <Key class="absolute left-4 w-5 h-5 text-muted-foreground/60 pointer-events-none" />
              <input 
                v-model="password"
                type="password" 
                placeholder="••••••••••••"
                class="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border/80 hover:border-border focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <div class="pt-4">
          <UiButton type="submit" :loading="isLoading" class="w-full h-14 rounded-full font-bold group">
            Authenticate Identity <ArrowRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
        </div>
      </form>

      <!-- Subtext tips -->
      <div class="text-center pt-4 border-t">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Mock Login: Use <span class="text-primary font-bold">admin@techcore.com</span> to testing dashboards
        </p>
      </div>
    </div>
  </div>
</template>

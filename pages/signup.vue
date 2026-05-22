<script setup lang="ts">
import { ref } from 'vue';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const name = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);
const error = ref('');

const handleSignUp = async () => {
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await authStore.signUp({
      name: name.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      phone: phone.value
    });
    isSuccess.value = true;
    setTimeout(async () => {
      try {
        await authStore.login({ email: email.value, password: password.value });
        navigateTo('/account');
      } catch (loginErr) {
        navigateTo('/login');
      }
    }, 2000);
  } catch (err: any) {
    error.value = authStore.error || err.data?.message || err.message || 'Sign up failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-muted/20 relative overflow-hidden">
    <!-- Grid Background Decoration -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>

    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-md mx-auto">
        <!-- Brand Header -->
        <div class="text-center mb-8 space-y-2">
          <NuxtLink to="/" class="inline-flex items-center gap-2 group mb-4">
            <div class="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <ShieldCheck class="w-6 h-6" />
            </div>
          </NuxtLink>
          <h1 class="text-3xl font-display font-extrabold tracking-tight">Sign Up</h1>
          <p class="text-muted-foreground text-sm">Join the TechCore enterprise ecosystem</p>
        </div>

        <!-- Sign Up Card -->
        <div class="bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">
          <!-- Success Overlay -->
          <div v-if="isSuccess" class="absolute inset-0 bg-background/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div class="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 class="w-10 h-10" />
            </div>
            <h2 class="text-2xl font-bold mb-2">Account Created!</h2>
            <p class="text-muted-foreground mb-8">Welcome aboard, {{ name.split(' ')[0] }}. We're preparing your enterprise dashboard...</p>
            <div class="flex items-center gap-2 text-primary font-bold animate-pulse">
              <Loader2 class="w-4 h-4 animate-spin" /> Redirecting...
            </div>
          </div>

          <form @submit.prevent="handleSignUp" class="space-y-4">
            <!-- Error Message -->
            <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-3 rounded-xl">
              {{ error }}
            </div>

            <!-- Name Field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User class="w-4 h-4" />
                </div>
                <input 
                  v-model="name"
                  type="text" 
                  placeholder="Sarah Anderson"
                  class="w-full h-12 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <!-- Email Field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail class="w-4 h-4" />
                </div>
                <input 
                  v-model="email"
                  type="email" 
                  placeholder="name@enterprise.com"
                  class="w-full h-12 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <!-- Phone Field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Business Phone (Optional)</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Phone class="w-4 h-4" />
                </div>
                <input 
                  v-model="phone"
                  type="text" 
                  placeholder="+1 (555) 019-2834"
                  class="w-full h-12 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium text-sm"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock class="w-4 h-4" />
                </div>
                <input 
                  v-model="password"
                  type="password" 
                  placeholder="••••••••"
                  class="w-full h-12 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium tracking-widest text-sm"
                  required
                />
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock class="w-4 h-4" />
                </div>
                <input 
                  v-model="confirmPassword"
                  type="password" 
                  placeholder="••••••••"
                  class="w-full h-12 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium tracking-widest text-sm"
                  required
                />
              </div>
            </div>

            <div class="pt-4">
              <UiButton 
                type="submit"
                class="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 gap-2"
                :disabled="isLoading"
              >
                <div v-if="isLoading" class="flex items-center gap-2">
                  <Loader2 class="w-5 h-5 animate-spin" /> Creating Account...
                </div>
                <div v-else class="flex items-center gap-2">
                  Complete Sign Up <ArrowRight class="w-5 h-5" />
                </div>
              </UiButton>
            </div>
          </form>

          <p class="text-center mt-8 text-xs text-muted-foreground">
            By signing up, you agree to our 
            <NuxtLink to="/terms" class="text-primary hover:underline">Terms of Service</NuxtLink> and 
            <NuxtLink to="/privacy" class="text-primary hover:underline">Privacy Policy</NuxtLink>
          </p>
        </div>

        <p class="text-center mt-10 text-sm text-muted-foreground">
          Already have an account? 
          <NuxtLink to="/login" class="text-primary font-bold hover:underline">Sign in instead</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

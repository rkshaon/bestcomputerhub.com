<!-- File: /pages/login.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { User, Lock, ArrowRight, Github, Chrome, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/utils';

useSeoMeta({
  title: 'Sign In',
  description: 'Sign in to your Best Computer Hub account to track orders, manage warranty passes, and access exclusive member prices.',
  robots: 'noindex, nofollow'
});

const authStore = useAuthStore();
const route = useRoute();
const credential = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');

const redirectTarget = computed(() => {
  const redirect = route.query.redirect as string;
  if (redirect) return redirect;
  return authStore.isAdmin ? '/admin' : '/account';
});

const handleLogin = async () => {
  if (!credential.value.trim() || !password.value) {
    error.value = 'Please enter your email, username or phone number and password.';
    toastWarning('Please enter your email, username or phone number and password to log in.');
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await authStore.login({ credential: credential.value.trim(), password: password.value });
    toastSuccess('Log in successful. Secure session established.');
    navigateTo(redirectTarget.value);
  } catch (err: any) {
    error.value = authStore.error || 'Invalid credentials. Please try again.';
    handleApiError(err, 'Invalid credentials. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

// If already logged in, redirect to target route
if (authStore.isLoggedIn) {
  navigateTo(redirectTarget.value);
}
</script>

<template>
  <div class="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-muted/20 relative overflow-hidden">
    <!-- Grid Background Decoration -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>

    <!-- Background Glows -->
    <div class="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-md mx-auto">
        <!-- Logo/Brand Header -->
        <div class="text-center mb-8 space-y-2">
          <NuxtLink to="/" class="inline-flex items-center justify-center mb-4">
            <UiBrandLogo size="lg" />
          </NuxtLink>
          <h1 class="text-3xl font-display font-extrabold tracking-tight">Sign In</h1>
          <p class="text-muted-foreground text-sm">Enter your account credentials to continue</p>
        </div>

        <!-- Login Card -->
        <div class="bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              {{ error }}
            </div>

            <!-- Credential Field -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email, Username or Phone Number</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User class="w-4 h-4" />
                </div>
                <input 
                  v-model="credential"
                  type="text" 
                  placeholder="Enter email, username or phone number"
                  class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
                  required
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <div class="flex items-center justify-between ml-1">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                <NuxtLink to="/forgot-password" class="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot password?</NuxtLink>
              </div>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock class="w-4 h-4" />
                </div>
                <input 
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="••••••••"
                  class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-12 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium tracking-widest"
                  required
                />
                <button 
                  type="button"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center gap-2 ml-1">
              <input type="checkbox" id="remember" class="w-4 h-4 rounded border-input text-primary focus:ring-primary/20" />
              <label for="remember" class="text-xs text-muted-foreground font-medium select-none">Remember this session for 30 days</label>
            </div>

            <!-- Login Button -->
            <UiButton 
              type="submit"
              class="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 gap-2 overflow-hidden relative"
              :disabled="isLoading"
            >
              <div v-if="isLoading" class="flex items-center gap-2">
                <Loader2 class="w-5 h-5 animate-spin" /> Verifying...
              </div>
              <div v-else class="flex items-center gap-2">
                Sign In to Best Computer Hub <ArrowRight class="w-5 h-5" />
              </div>
            </UiButton>
          </form>

          <!-- Divider -->
          <div class="relative my-10">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border/50"></div>
            </div>
            <div class="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
              <span class="bg-background px-4 text-muted-foreground">Account Access</span>
            </div>
          </div>

          <!-- Social Logins -->
          <div class="grid grid-cols-2 gap-4">
            <button type="button" aria-label="Sign in with Google" class="flex items-center justify-center gap-3 h-12 bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold hover:bg-muted/50 hover:border-border transition-all">
              <Chrome class="w-4 h-4" /> Google
            </button>
            <button type="button" aria-label="Sign in with GitHub" class="flex items-center justify-center gap-3 h-12 bg-muted/30 border border-border/50 rounded-2xl text-sm font-bold hover:bg-muted/50 hover:border-border transition-all">
              <Github class="w-4 h-4" /> GitHub
            </button>
          </div>
        </div>

        <!-- Footer Links -->
        <p class="text-center mt-10 text-sm text-muted-foreground">
          New to Best Computer Hub? 
          <NuxtLink to="/signup" class="text-primary font-bold hover:underline">Create an account</NuxtLink>
        </p>

        <!-- Trust Badge -->
        <div class="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale contrast-125">
          <div class="font-display font-extrabold text-xl tracking-tighter">TRUST<span class="text-primary">CORE</span></div>
          <div class="h-4 w-px bg-muted-foreground"></div>
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">ISO 27001<br/>Certified</div>
        </div>
      </div>
    </div>
  </div>
</template>

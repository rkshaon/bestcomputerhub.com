<!-- File: /pages/reset-password.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-vue-next';
import { useApiClient } from '@/composables/useApiClient';
import { useToast } from '@/composables/useToast';
import type { PasswordResetConfirmPayload } from '@/types';

const route = useRoute();
const router = useRouter();
const { toastSuccess, handleApiError } = useToast();
const { request } = useApiClient();

const uid = route.query.uid as string;
const token = route.query.token as string;
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const isSuccess = ref(false);
const error = ref('');

onMounted(() => {
  if (!uid || !token) {
    handleApiError(new Error('Reset UID or token is missing.'), 'Invalid or incomplete password reset link.');
    router.push('/forgot-password/');
  }
});

const handleResetConfirm = async () => {
  if (!uid || !token) {
    error.value = 'Missing reset identifier or token. Please request a new link.';
    return;
  }
  if (!password.value || !confirmPassword.value) {
    error.value = 'Please enter both password fields.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await request('/api/v1/auth/password-reset/confirm/', {
      method: 'POST',
      body: {
        uid,
        token,
        new_password: password.value,
        confirm_new_password: confirmPassword.value
      } as PasswordResetConfirmPayload
    });

    isSuccess.value = true;
    toastSuccess('Password reset successfully. You can now log in.');
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-muted/20 relative overflow-hidden">
    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-md mx-auto bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
        <!-- Missing Token / UID State -->
        <div v-if="!uid || !token" class="text-center space-y-6">
          <div class="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-display font-bold">Invalid Reset Link</h2>
          <p class="text-muted-foreground text-sm">The password reset link is missing required parameters or has expired.</p>
          <UiButton to="/forgot-password/" class="w-full h-14 rounded-2xl font-bold">Request New Link</UiButton>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="text-center space-y-6">
          <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-display font-bold">Password reset</h2>
          <p class="text-muted-foreground text-sm">Your password has been updated successfully.</p>
          <UiButton to="/login/" class="w-full h-14 rounded-2xl font-bold">Sign In</UiButton>
        </div>

        <!-- Reset Form -->
        <form v-else @submit.prevent="handleResetConfirm" class="space-y-6">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-display font-bold">Set New Password</h1>
          </div>

          <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-3 rounded-xl">
            {{ error }}
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
            <div class="relative group">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock class="w-4 h-4" />
              </div>
              <input 
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-12 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
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

          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
            <div class="relative group">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock class="w-4 h-4" />
              </div>
              <input 
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-12 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
                required 
              />
              <button 
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <UiButton type="submit" class="w-full h-14 rounded-2xl font-bold" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Reset Password <ArrowRight class="w-4 h-4 ml-2" /></span>
          </UiButton>
        </form>
      </div>
    </div>
  </div>
</template>

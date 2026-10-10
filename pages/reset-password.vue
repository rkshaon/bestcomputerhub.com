<!-- File: /pages/reset-password.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-vue-next';
import { useApiClient } from '@/composables/useApiClient';
import { useToast } from '@/composables/useToast';
import type { PasswordResetConfirmPayload } from '@/types';

const route = useRoute();
const router = useRouter();
const { toastSuccess, handleApiError } = useToast();
const { request } = useApiClient();

const token = route.query.token as string;
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);
const error = ref('');

onMounted(() => {
  if (!token) {
    handleApiError(new Error('Reset token is missing.'), 'Invalid password reset link.');
    router.push('/forgot-password/');
  }
});

const handleResetConfirm = async () => {
  if (!password.value || !confirmPassword.value) {
    error.value = 'Please enter both fields';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await request('/api/v1/auth/password-reset/confirm/', {
      method: 'POST',
      body: {
        token,
        password: password.value,
        confirm_password: confirmPassword.value
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
        <!-- Success State -->
        <div v-if="isSuccess" class="text-center space-y-6">
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
            <input v-model="password" type="password" class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl px-4 outline-none" required />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
            <input v-model="confirmPassword" type="password" class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl px-4 outline-none" required />
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

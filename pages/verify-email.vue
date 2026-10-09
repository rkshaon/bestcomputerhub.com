<!-- File: /pages/verify-email.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { useApiClient } from '@/composables/useApiClient';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const { toastSuccess, handleApiError } = useToast();
const apiClient = useApiClient();

const token = route.query.token as string;
const isLoading = ref(true);

onMounted(async () => {
  if (!token) {
    handleApiError(new Error('Verification token is missing.'), 'Verification token is missing.');
    isLoading.value = false;
    return;
  }

  try {
    const response: { message: string } = await apiClient.request('/api/v1/auth/email-verification/confirm/', {
      method: 'POST',
      body: { token }
    });

    toastSuccess(response.message || 'Email verified successfully.');
    
    // Redirect to account
    navigateTo('/account/');
  } catch (err: any) {
    handleApiError(err, 'Failed to verify email. Please try again or request a new verification link.');
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <Loader2 v-if="isLoading" class="w-10 h-10 animate-spin mx-auto text-primary" />
      <h1 v-else class="text-2xl font-bold">Verification Process Complete</h1>
      <p v-if="isLoading" class="mt-4 text-muted-foreground">Verifying your email address...</p>
    </div>
  </div>
</template>

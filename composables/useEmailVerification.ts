// File: /composables/useEmailVerification.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { useToast } from './useToast';

export const useEmailVerification = () => {
  const apiClient = useApiClient();
  const { toastSuccess, handleApiError } = useToast();
  
  const email = ref<string>('');
  const emailVerified = ref<boolean | null>(null);
  const loadingStatus = ref(false);
  const loadingResend = ref(false);

  const fetchStatus = async () => {
    loadingStatus.value = true;
    try {
      const res = await apiClient.request<{ email: string; email_verified: boolean }>('/api/v1/auth/email-verification/status/');
      email.value = res.email;
      emailVerified.value = res.email_verified;
    } catch (e) {
      handleApiError(e);
    } finally {
      loadingStatus.value = false;
    }
  };

  const resendEmail = async () => {
    loadingResend.value = true;
    try {
      const res = await apiClient.request<{ message: string }>('/api/v1/auth/email-verification/request/', { method: 'POST' });
      toastSuccess(res.message);
    } catch (e) {
      handleApiError(e);
    } finally {
      loadingResend.value = false;
    }
  };

  return { email, emailVerified, loadingStatus, loadingResend, fetchStatus, resendEmail };
};

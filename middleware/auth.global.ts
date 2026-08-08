// File: /middleware/auth.global.ts
import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }
  
  if (to.path.startsWith('/admin')) {
    if (!authStore.isLoggedIn) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }

    if (!authStore.isAdmin) {
      if (process.client) {
        const { toastWarning } = useToast();
        toastWarning('Access denied. Administrative privileges required.');
      }
      return navigateTo('/account');
    }
  }
});

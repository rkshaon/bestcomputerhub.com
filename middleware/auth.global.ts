// File: /middleware/auth.global.ts
import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  if (to.path.startsWith('/admin') && !authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${to.fullPath}`);
  }
});

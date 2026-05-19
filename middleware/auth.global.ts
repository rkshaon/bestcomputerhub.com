import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  if (to.path.startsWith('/admin') && !authStore.isLoggedIn) {
    return navigateTo('/login');
  }
});

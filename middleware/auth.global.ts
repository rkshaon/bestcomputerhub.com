// File: /middleware/auth.global.ts
import { callWithNuxt, useNuxtApp } from '#app';
import { useAuthStore } from '@/stores/auth';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const nuxtApp = useNuxtApp();
  const authStore = useAuthStore();
  
  if (!authStore.isInitialized) {
    await callWithNuxt(nuxtApp, () => authStore.initialize());
  }
  
  if (to.path.startsWith('/admin')) {
    if (!authStore.isLoggedIn) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }

    if (!authStore.isAdmin) {
      if (to.path !== '/admin/forbidden') {
        if (process.client) {
          const { toastWarning } = useToast();
          toastWarning('Access denied. Administrative privileges required.');
        }
        return navigateTo('/admin/forbidden');
      }
    } else {
      // Direct route permission check
      if (to.path !== '/admin/forbidden') {
        const { canViewModule, canCreateInModule, hasPermission } = useAdminPermissions();
        if (to.path === '/admin/products/new') {
          if (!hasPermission('product_api.add_product') && !canCreateInModule('/admin/products')) {
            return navigateTo('/admin/forbidden');
          }
        } else if (!canViewModule(to.path)) {
          return navigateTo('/admin/forbidden');
        }
      }
    }
  }

  if (to.path.startsWith('/account')) {
    if (!authStore.isLoggedIn) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }
  }
});



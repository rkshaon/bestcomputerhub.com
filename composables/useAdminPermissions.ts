// File: /composables/useAdminPermissions.ts
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export interface AdminModuleConfig {
  key: string;
  route: string;
  name: string;
  iconKey?: string;
  viewPermission?: string | string[] | null;
  createPermission?: string | string[] | null;
  editPermission?: string | string[] | null;
  deletePermission?: string | string[] | null;
}

export const ADMIN_MODULES: Record<string, AdminModuleConfig> = {
  dashboard: {
    key: 'dashboard',
    route: '/admin',
    name: 'Dashboard',
    iconKey: 'LayoutDashboard',
    viewPermission: ['dashboard.view_dashboard', 'view_dashboard', 'analytics.view_dashboard', 'admin.view_dashboard']
  },
  products: {
    key: 'products',
    route: '/admin/products',
    name: 'Products',
    iconKey: 'Package',
    viewPermission: ['store.view_product', 'view_product', 'products.view_product', 'product_api.add_product', 'product_api.view_product'],
    createPermission: ['store.add_product', 'add_product', 'products.add_product', 'product_api.add_product'],
    editPermission: ['store.change_product', 'change_product', 'products.change_product', 'product_api.change_product'],
    deletePermission: ['store.delete_product', 'delete_product', 'products.delete_product', 'product_api.delete_product']
  },
  categories: {
    key: 'categories',
    route: '/admin/categories',
    name: 'Categories',
    iconKey: 'Layers',
    viewPermission: ['store.view_category', 'view_category', 'categories.view_category'],
    createPermission: ['store.add_category', 'add_category', 'categories.add_category'],
    editPermission: ['store.change_category', 'change_category', 'categories.change_category'],
    deletePermission: ['store.delete_category', 'delete_category', 'categories.delete_category']
  },
  brands: {
    key: 'brands',
    route: '/admin/brands',
    name: 'Brands',
    iconKey: 'Tag',
    viewPermission: ['store.view_brand', 'view_brand', 'brands.view_brand'],
    createPermission: ['store.add_brand', 'add_brand', 'brands.add_brand'],
    editPermission: ['store.change_brand', 'change_brand', 'brands.change_brand'],
    deletePermission: ['store.delete_brand', 'delete_brand', 'brands.delete_brand']
  },
  inventory: {
    key: 'inventory',
    route: '/admin/inventory',
    name: 'Inventory',
    iconKey: 'Boxes',
    viewPermission: ['store.view_product', 'view_product', 'inventory.view_inventory'],
    editPermission: ['store.change_product', 'change_product', 'inventory.change_inventory']
  },
  orders: {
    key: 'orders',
    route: '/admin/orders',
    name: 'Orders',
    iconKey: 'ShoppingCart',
    viewPermission: ['store.view_order', 'view_order', 'orders.view_order'],
    createPermission: ['store.add_order', 'add_order', 'orders.add_order'],
    editPermission: ['store.change_order', 'change_order', 'orders.change_order'],
    deletePermission: ['store.delete_order', 'delete_order', 'orders.delete_order']
  },
  customers: {
    key: 'customers',
    route: '/admin/customers',
    name: 'Customers',
    iconKey: 'Users',
    viewPermission: ['store.view_customer', 'view_customer', 'customers.view_customer', 'user_api.view_customer']
  },
  users: {
    key: 'users',
    route: '/admin/users',
    name: 'Users & Staff',
    iconKey: 'ShieldCheck',
    viewPermission: ['user_api.view_user', 'view_user', 'auth.view_user'],
    createPermission: ['user_api.add_user', 'add_user', 'auth.add_user'],
    editPermission: ['user_api.change_user', 'change_user', 'auth.change_user'],
    deletePermission: ['user_api.delete_user', 'delete_user', 'auth.delete_user']
  },
  staff: {
    key: 'staff',
    route: '/admin/staff',
    name: 'Staff Management',
    iconKey: 'ShieldCheck',
    viewPermission: ['user_api.view_user', 'view_user', 'auth.view_user']
  },
  roles: {
    key: 'roles',
    route: '/admin/roles',
    name: 'Roles',
    iconKey: 'ShieldAlert',
    viewPermission: ['auth.view_group', 'view_group'],
    createPermission: ['auth.add_group', 'add_group'],
    editPermission: ['auth.change_group', 'change_group'],
    deletePermission: ['auth.delete_group', 'delete_group']
  },
  analytics: {
    key: 'analytics',
    route: '/admin/analytics',
    name: 'Analytics',
    iconKey: 'BarChart3',
    viewPermission: ['analytics.view_analytics', 'view_analytics']
  },
  profile: {
    key: 'profile',
    route: '/admin/profile',
    name: 'Profile',
    iconKey: 'UserIcon',
    viewPermission: null
  },
  security: {
    key: 'security',
    route: '/admin/security',
    name: 'Security',
    iconKey: 'ShieldAlert',
    viewPermission: ['admin.view_logentry', 'view_logentry', 'security.view_security']
  },
  notifications: {
    key: 'notifications',
    route: '/admin/notifications',
    name: 'Notifications',
    iconKey: 'Bell',
    viewPermission: ['notifications.view_notification', 'view_notification']
  },
  settings: {
    key: 'settings',
    route: '/admin/settings',
    name: 'Settings',
    iconKey: 'Settings',
    viewPermission: ['settings.view_setting', 'view_setting', 'settings.change_setting']
  }
};

export const useAdminPermissions = () => {
  const authStore = useAuthStore();

  const isSuperadmin = computed(() => {
    const u = authStore.user;
    if (!u) return false;
    return !!(u.is_superadmin || u.is_superuser);
  });

  const userPermissionsSet = computed<Set<string>>(() => {
    const u = authStore.user;
    const set = new Set<string>();
    if (!u || !Array.isArray(u.permissions)) return set;

    for (const item of u.permissions) {
      if (typeof item === 'string') {
        set.add(item);
        const parts = item.split('.');
        if (parts.length > 1 && parts[1]) {
          set.add(parts[1]);
        }
      } else if (item && typeof item === 'object') {
        if (item.codename) {
          set.add(item.codename);
          const parts = item.codename.split('.');
          if (parts.length > 1 && parts[1]) {
            set.add(parts[1]);
          }
        }
        if (item.name) {
          set.add(item.name);
        }
      }
    }
    return set;
  });

  const hasPermission = (permission: string | string[] | null | undefined): boolean => {
    if (!permission) return true;
    if (!authStore.isLoggedIn || !authStore.user) return false;
    if (isSuperadmin.value) return true;

    const reqs = Array.isArray(permission) ? permission : [permission];
    const set = userPermissionsSet.value;

    return reqs.some(req => {
      if (set.has(req)) return true;
      const parts = req.split('.');
      if (parts.length > 1 && parts[1] && set.has(parts[1])) {
        return true;
      }
      return false;
    });
  };

  const hasAnyPermission = (permissions: (string | string[])[]): boolean => {
    if (isSuperadmin.value) return true;
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: (string | string[])[]): boolean => {
    if (isSuperadmin.value) return true;
    return permissions.every(p => hasPermission(p));
  };

  const findModule = (keyOrRoute: string): AdminModuleConfig | undefined => {
    if (ADMIN_MODULES[keyOrRoute]) return ADMIN_MODULES[keyOrRoute];
    const norm = keyOrRoute.replace(/\/$/, '');
    return Object.values(ADMIN_MODULES).find(m => m.route === norm || m.route === keyOrRoute);
  };

  const canViewModule = (keyOrRoute: string): boolean => {
    const mod = findModule(keyOrRoute);
    if (!mod) return true;
    return hasPermission(mod.viewPermission);
  };

  const canCreateInModule = (keyOrRoute: string): boolean => {
    const mod = findModule(keyOrRoute);
    if (!mod) return false;
    return hasPermission(mod.createPermission);
  };

  const canEditInModule = (keyOrRoute: string): boolean => {
    const mod = findModule(keyOrRoute);
    if (!mod) return false;
    return hasPermission(mod.editPermission);
  };

  const canDeleteInModule = (keyOrRoute: string): boolean => {
    const mod = findModule(keyOrRoute);
    if (!mod) return false;
    return hasPermission(mod.deletePermission);
  };

  return {
    isSuperadmin,
    userPermissions: computed(() => Array.from(userPermissionsSet.value)),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewModule,
    canCreateInModule,
    canEditInModule,
    canDeleteInModule,
    ADMIN_MODULES
  };
};

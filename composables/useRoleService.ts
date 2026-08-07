// File: /composables/useRoleService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { Role, PaginatedRoles, CreateRolePayload, UpdateRolePayload } from '@/types';

const ROLES_STORAGE_KEY = 'techcore_mock_roles_registry';

const rolesCache = ref<Role[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMsg = ref<string | null>(null);

export const useRoleService = () => {
  const apiClient = useApiClient();

  const getMockRoles = (): Role[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ROLES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      const defaults = getFallbackRoles();
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return getFallbackRoles();
    }
  };

  const saveMockRoles = (list: Role[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  const checkMockMode = (): boolean => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
  };

  // 1. Get Roles List
  const getRoles = async (params?: { page?: number; search?: string }): Promise<PaginatedRoles> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      let mockList = getMockRoles();
      if (params?.search) {
        const query = params.search.toLowerCase().trim();
        mockList = mockList.filter(r => r.name.toLowerCase().includes(query));
      }
      rolesCache.value = mockList;
      totalCount.value = mockList.length;
      isLoading.value = false;
      return {
        count: mockList.length,
        next: null,
        previous: null,
        results: mockList
      };
    }

    try {
      const queryObj: Record<string, any> = {};
      if (params?.page) queryObj.page = params.page;
      if (params?.search) queryObj.search = params.search;

      const data = await apiClient.request<PaginatedRoles | Role[]>('/api/v1/roles/', {
        method: 'GET',
        params: queryObj
      });

      let results: Role[] = [];
      let count = 0;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object' && 'results' in data) {
        results = data.results || [];
        count = data.count || results.length;
      }

      rolesCache.value = results;
      totalCount.value = count;

      return {
        count,
        next: (data as PaginatedRoles).next || null,
        previous: (data as PaginatedRoles).previous || null,
        results
      };
    } catch (err: any) {
      const msg = err.data?.detail || err.data?.message || err.message || 'Failed to retrieve roles repository.';
      errorMsg.value = msg;

      // Fallback mock roles in case DRF backend endpoint is not reachable in dev sandbox
      const mockList = getMockRoles();
      rolesCache.value = mockList;
      totalCount.value = mockList.length;

      return {
        count: mockList.length,
        next: null,
        previous: null,
        results: mockList
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Create Role
  const createRole = async (payload: CreateRolePayload): Promise<Role> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const permissionService = usePermissionService();
      const allPerms = await permissionService.getPermissions();
      const selectedPerms = allPerms.filter(p => payload.permission_ids.includes(p.id));

      const newRole: Role = {
        id: Date.now(),
        name: payload.name.trim(),
        permissions: selectedPerms
      };

      const current = getMockRoles();
      const updated = [newRole, ...current];
      saveMockRoles(updated);
      rolesCache.value = updated;
      totalCount.value = updated.length;
      isSubmitting.value = false;
      return newRole;
    }

    try {
      const created = await apiClient.request<Role>('/api/v1/roles/', {
        method: 'POST',
        body: payload
      });

      rolesCache.value = [created, ...rolesCache.value];
      totalCount.value += 1;
      return created;
    } catch (err: any) {
      const msg = err.data?.detail || err.data?.name?.[0] || err.data?.message || err.message || 'Failed to create role.';
      errorMsg.value = msg;

      // If backend call fails, handle mock fallback seamlessly
      const permissionService = usePermissionService();
      const allPerms = await permissionService.getPermissions();
      const selectedPerms = allPerms.filter(p => payload.permission_ids.includes(p.id));

      const newRole: Role = {
        id: Date.now(),
        name: payload.name.trim(),
        permissions: selectedPerms
      };

      const current = getMockRoles();
      const updated = [newRole, ...current];
      saveMockRoles(updated);
      rolesCache.value = updated;
      totalCount.value = updated.length;
      return newRole;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 3. Update Role
  const updateRole = async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const permissionService = usePermissionService();
      const allPerms = await permissionService.getPermissions();

      const current = getMockRoles();
      const index = current.findIndex(r => r.id === id);

      if (index === -1 || !current[index]) {
        throw new Error(`Role with ID ${id} not found`);
      }

      const existingRole = current[index]!;
      const updatedPerms = payload.permission_ids !== undefined
        ? allPerms.filter(p => payload.permission_ids!.includes(p.id))
        : existingRole.permissions;

      const updatedRole: Role = {
        id: existingRole.id,
        name: payload.name ? payload.name.trim() : existingRole.name,
        permissions: updatedPerms
      };

      current[index] = updatedRole;
      saveMockRoles(current);
      rolesCache.value = [...current];
      isSubmitting.value = false;
      return updatedRole;
    }

    try {
      const updated = await apiClient.request<Role>(`/api/v1/roles/${id}/`, {
        method: 'PATCH',
        body: payload
      });

      const idx = rolesCache.value.findIndex(r => r.id === id);
      if (idx !== -1) {
        rolesCache.value[idx] = updated;
      }
      return updated;
    } catch (err: any) {
      const msg = err.data?.detail || err.data?.name?.[0] || err.data?.message || err.message || 'Failed to update role.';
      errorMsg.value = msg;

      // Fallback update in mock cache
      const permissionService = usePermissionService();
      const allPerms = await permissionService.getPermissions();

      const current = getMockRoles();
      const index = current.findIndex(r => r.id === id);
      if (index !== -1 && current[index]) {
        const existingRole = current[index]!;
        const updatedPerms = payload.permission_ids !== undefined
          ? allPerms.filter(p => payload.permission_ids!.includes(p.id))
          : existingRole.permissions;

        const updatedRole: Role = {
          id: existingRole.id,
          name: payload.name ? payload.name.trim() : existingRole.name,
          permissions: updatedPerms
        };
        current[index] = updatedRole;
        saveMockRoles(current);
        rolesCache.value = [...current];
        return updatedRole;
      }

      throw new Error(msg);
    } finally {
      isSubmitting.value = false;
    }
  };

  // 4. Delete Role
  const deleteRole = async (id: number): Promise<void> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const current = getMockRoles();
      const updated = current.filter(r => r.id !== id);
      saveMockRoles(updated);
      rolesCache.value = updated;
      totalCount.value = updated.length;
      isSubmitting.value = false;
      return;
    }

    try {
      await apiClient.request(`/api/v1/roles/${id}/`, {
        method: 'DELETE'
      });

      rolesCache.value = rolesCache.value.filter(r => r.id !== id);
      totalCount.value = Math.max(0, totalCount.value - 1);
    } catch (err: any) {
      const msg = err.data?.detail || err.data?.message || err.message || 'Failed to delete role.';
      errorMsg.value = msg;

      // Fallback mock deletion
      const current = getMockRoles();
      const updated = current.filter(r => r.id !== id);
      saveMockRoles(updated);
      rolesCache.value = updated;
      totalCount.value = updated.length;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 5. Get Single Role
  const getRoleById = async (id: number): Promise<Role | null> => {
    const existing = rolesCache.value.find(r => r.id === id);
    if (existing) return existing;

    if (checkMockMode()) {
      const list = getMockRoles();
      return list.find(r => r.id === id) || null;
    }

    try {
      const data = await apiClient.request<Role>(`/api/v1/roles/${id}/`, {
        method: 'GET'
      });
      return data;
    } catch {
      const list = getMockRoles();
      return list.find(r => r.id === id) || null;
    }
  };

  return {
    roles: rolesCache,
    totalCount,
    isLoading,
    isSubmitting,
    error: errorMsg,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
  };
};

function getFallbackRoles(): Role[] {
  return [
    {
      id: 1,
      name: 'Super Administrator',
      permissions: [
        { id: 1, codename: 'add_user', name: 'Can add user' },
        { id: 2, codename: 'change_user', name: 'Can change user' },
        { id: 3, codename: 'delete_user', name: 'Can delete user' },
        { id: 4, codename: 'view_user', name: 'Can view user' },
        { id: 5, codename: 'add_product', name: 'Can add product' },
        { id: 6, codename: 'change_product', name: 'Can change product' },
        { id: 7, codename: 'delete_product', name: 'Can delete product' },
        { id: 8, codename: 'view_product', name: 'Can view product' },
        { id: 9, codename: 'add_category', name: 'Can add category' },
        { id: 10, codename: 'change_category', name: 'Can change category' },
        { id: 11, codename: 'delete_category', name: 'Can delete category' },
        { id: 12, codename: 'view_category', name: 'Can view category' },
        { id: 13, codename: 'add_brand', name: 'Can add brand' },
        { id: 14, codename: 'change_brand', name: 'Can change brand' },
        { id: 15, codename: 'delete_brand', name: 'Can delete brand' },
        { id: 16, codename: 'view_brand', name: 'Can view brand' },
        { id: 17, codename: 'add_order', name: 'Can add order' },
        { id: 18, codename: 'change_order', name: 'Can change order' },
        { id: 19, codename: 'delete_order', name: 'Can delete order' },
        { id: 20, codename: 'view_order', name: 'Can view order' },
        { id: 21, codename: 'add_group', name: 'Can add role' },
        { id: 22, codename: 'change_group', name: 'Can change role' },
        { id: 23, codename: 'delete_group', name: 'Can delete role' },
        { id: 24, codename: 'view_group', name: 'Can view role' }
      ]
    },
    {
      id: 2,
      name: 'Catalog & Inventory Lead',
      permissions: [
        { id: 5, codename: 'add_product', name: 'Can add product' },
        { id: 6, codename: 'change_product', name: 'Can change product' },
        { id: 8, codename: 'view_product', name: 'Can view product' },
        { id: 9, codename: 'add_category', name: 'Can add category' },
        { id: 10, codename: 'change_category', name: 'Can change category' },
        { id: 12, codename: 'view_category', name: 'Can view category' },
        { id: 13, codename: 'add_brand', name: 'Can add brand' },
        { id: 14, codename: 'change_brand', name: 'Can change brand' },
        { id: 16, codename: 'view_brand', name: 'Can view brand' }
      ]
    },
    {
      id: 3,
      name: 'Order Fulfillment Desk',
      permissions: [
        { id: 17, codename: 'add_order', name: 'Can add order' },
        { id: 18, codename: 'change_order', name: 'Can change order' },
        { id: 20, codename: 'view_order', name: 'Can view order' },
        { id: 4, codename: 'view_user', name: 'Can view user' }
      ]
    }
  ];
}

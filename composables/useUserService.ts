// File: /composables/useUserService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { UserItem, PaginatedUsers, CreateUserPayload, UpdateUserPayload, ChangePasswordPayload } from '@/types';

const usersCache = ref<UserItem[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

export const useUserService = () => {
  const apiClient = useApiClient();

  // 1. Get Users List (GET /api/v1/users/)
  const getUsers = async (params?: { page?: number; page_size?: number; search?: string }): Promise<PaginatedUsers> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const queryObj: Record<string, any> = {};
      if (params?.page) queryObj.page = params.page;
      if (params?.page_size) queryObj.page_size = params.page_size;
      if (params?.search) queryObj.search = params.search;

      const data = await apiClient.request<PaginatedUsers | UserItem[]>('/api/v1/users/', {
        method: 'GET',
        params: queryObj
      });

      let results: UserItem[] = [];
      let count = 0;
      let nextUrl: string | null = null;
      let previousUrl: string | null = null;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object' && 'results' in data) {
        results = data.results || [];
        count = typeof data.count === 'number' ? data.count : results.length;
        nextUrl = data.next || null;
        previousUrl = data.previous || null;
      }

      usersCache.value = results;
      totalCount.value = count;

      return {
        count,
        next: nextUrl,
        previous: previousUrl,
        results
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve users repository.');
      errorMsg.value = msg;
      usersCache.value = [];
      totalCount.value = 0;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Get User By ID (GET /api/v1/users/{id}/)
  const getUserById = async (id: number | string): Promise<UserItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<UserItem>(`/api/v1/users/${id}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      // Fallback: Check if cached in list
      const cached = usersCache.value.find(u => u.id == id);
      if (cached) return cached;

      const msg = extractErrorMessage(err, `Failed to retrieve user #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Create User (POST /api/v1/users/)
  const createUser = async (payload: CreateUserPayload): Promise<UserItem> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    try {
      const created = await apiClient.request<UserItem>('/api/v1/users/', {
        method: 'POST',
        body: payload
      });

      usersCache.value = [created, ...usersCache.value];
      totalCount.value += 1;
      return created;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create user account.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 4. Update User (PATCH /api/v1/users/{id}/)
  const updateUser = async (id: number | string, payload: UpdateUserPayload): Promise<UserItem> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    try {
      const updated = await apiClient.request<UserItem>(`/api/v1/users/${id}/`, {
        method: 'PATCH',
        body: payload
      });

      const idx = usersCache.value.findIndex(u => u.id == id);
      if (idx !== -1) {
        usersCache.value[idx] = updated;
      }
      return updated;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update user account.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 5. Delete User (DELETE /api/v1/users/{id}/)
  const deleteUser = async (id: number | string): Promise<void> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request(`/api/v1/users/${id}/`, {
        method: 'DELETE'
      });

      usersCache.value = usersCache.value.filter(u => u.id != id);
      if (totalCount.value > 0) {
        totalCount.value -= 1;
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete user account.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 6. Assign Role to User (POST /api/v1/users/{id}/assign-role/)
  const assignRole = async (userId: number | string, roleId: number): Promise<void> => {
    isSubmitting.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request(`/api/v1/users/${userId}/assign-role/`, {
        method: 'POST',
        body: { role_id: roleId }
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to assign role to user.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 7. Remove Role from User (POST /api/v1/users/{id}/remove-role/)
  const removeRole = async (userId: number | string, roleId: number): Promise<void> => {
    isSubmitting.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request(`/api/v1/users/${userId}/remove-role/`, {
        method: 'POST',
        body: { role_id: roleId }
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to remove role from user.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 8. Change Self Password (PATCH /api/v1/users/me/change-password/)
  const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    isSubmitting.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request('/api/v1/users/me/change-password/', {
        method: 'PATCH',
        body: payload
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to change password.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  // 9. Update Self Profile (PATCH /api/v1/users/me/)
  const updateSelfProfile = async (payload: Partial<UpdateUserPayload>): Promise<UserItem> => {
    isSubmitting.value = true;
    errorMsg.value = null;
    try {
      const updated = await apiClient.request<UserItem>('/api/v1/users/me/', {
        method: 'PATCH',
        body: payload
      });
      return updated;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update self profile.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    users: usersCache,
    totalCount,
    isLoading,
    isSubmitting,
    error: errorMsg,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    assignRole,
    removeRole,
    changePassword,
    updateSelfProfile
  };
};



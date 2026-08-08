// File: /composables/useUserService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type { UserItem, PaginatedUsers, CreateUserPayload } from '@/types';

const USERS_STORAGE_KEY = 'techcore_mock_users_registry';

const usersCache = ref<UserItem[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

export const useUserService = () => {
  const apiClient = useApiClient();

  const getMockUsers = (): UserItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      const defaults = getFallbackUsers();
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return getFallbackUsers();
    }
  };

  const saveMockUsers = (list: UserItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  const checkMockMode = (): boolean => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
  };

  // 1. Get Users List (GET /api/v1/users/)
  const getUsers = async (params?: { page?: number; page_size?: number; search?: string }): Promise<PaginatedUsers> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      let mockList = getMockUsers();
      if (params?.search) {
        const query = params.search.toLowerCase().trim();
        mockList = mockList.filter(u => 
          (u.full_name && u.full_name.toLowerCase().includes(query)) ||
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }
      usersCache.value = mockList;
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
      const msg = err.data?.detail || err.data?.message || err.message || 'Failed to retrieve users repository.';
      errorMsg.value = msg;

      // Fallback mock users if backend endpoint is unreachable in sandbox environment
      const mockList = getMockUsers();
      usersCache.value = mockList;
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

  // 2. Create User (POST /api/v1/users/)
  const createUser = async (payload: CreateUserPayload): Promise<UserItem> => {
    isSubmitting.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const fullName = [payload.first_name, payload.middle_name, payload.last_name].filter(Boolean).join(' ') || payload.username;
      
      const newUser: UserItem = {
        id: Date.now(),
        full_name: fullName,
        first_name: payload.first_name || '',
        middle_name: payload.middle_name || '',
        last_name: payload.last_name || '',
        email: payload.email,
        username: payload.username,
        groups: payload.groups || [],
        permissions: [],
        is_superuser: false
      };

      const current = getMockUsers();
      const updated = [newUser, ...current];
      saveMockUsers(updated);
      usersCache.value = updated;
      totalCount.value = updated.length;
      isSubmitting.value = false;
      return newUser;
    }

    try {
      const created = await apiClient.request<UserItem>('/api/v1/users/', {
        method: 'POST',
        body: payload
      });

      usersCache.value = [created, ...usersCache.value];
      totalCount.value += 1;
      return created;
    } catch (err: any) {
      // Parse validation errors from DRF response
      let msg = 'Failed to create user account.';
      if (err.data) {
        if (typeof err.data === 'string') {
          msg = err.data;
        } else if (err.data.detail) {
          msg = err.data.detail;
        } else if (typeof err.data === 'object') {
          const fieldErrors = Object.entries(err.data)
            .map(([field, errs]) => {
              const formattedField = field.replace(/_/g, ' ');
              const errStr = Array.isArray(errs) ? errs.join(', ') : String(errs);
              return `${formattedField}: ${errStr}`;
            })
            .join(' | ');
          if (fieldErrors) msg = fieldErrors;
        }
      } else if (err.message) {
        msg = err.message;
      }

      errorMsg.value = msg;

      // Fallback mock creation if backend fails in local sandbox dev environment
      const fullName = [payload.first_name, payload.middle_name, payload.last_name].filter(Boolean).join(' ') || payload.username;
      const newUser: UserItem = {
        id: Date.now(),
        full_name: fullName,
        first_name: payload.first_name || '',
        middle_name: payload.middle_name || '',
        last_name: payload.last_name || '',
        email: payload.email,
        username: payload.username,
        groups: payload.groups || [],
        permissions: [],
        is_superuser: false
      };

      const current = getMockUsers();
      const updated = [newUser, ...current];
      saveMockUsers(updated);
      usersCache.value = updated;
      totalCount.value = updated.length;

      // Re-throw if error was a validation error so form component can show field details
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
    createUser
  };
};

function getFallbackUsers(): UserItem[] {
  return [
    {
      id: 1,
      full_name: 'Sarah Anderson',
      first_name: 'Sarah',
      middle_name: '',
      last_name: 'Anderson',
      email: 'sarah.a@techcore.io',
      username: 'sarah.anderson',
      groups: [1],
      permissions: ['add_user', 'change_user', 'delete_user'],
      is_superuser: true
    },
    {
      id: 2,
      full_name: 'Marcus Chen',
      first_name: 'Marcus',
      middle_name: '',
      last_name: 'Chen',
      email: 'm.chen@techcore.io',
      username: 'marcus.chen',
      groups: [2],
      permissions: ['add_product', 'change_product'],
      is_superuser: false
    },
    {
      id: 3,
      full_name: 'Elena Rodriguez',
      first_name: 'Elena',
      middle_name: '',
      last_name: 'Rodriguez',
      email: 'elena@techcore.io',
      username: 'elena.rodriguez',
      groups: [3],
      permissions: ['view_order'],
      is_superuser: false
    }
  ];
}

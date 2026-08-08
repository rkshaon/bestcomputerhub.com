// File: /stores/auth.ts
import { defineStore } from 'pinia';
import { useCookie, navigateTo } from '#app';
import { useApiClient } from '@/composables/useApiClient';
import type { User, Customer, RegisterPayload, LoginPayload, LoginResponse } from '@/types';

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const userCookie = useCookie<User | null>('auth_user', { path: '/' });
    const accessToken = useCookie<string | null>('access_token', { path: '/' });
    
    return {
      user: userCookie.value || null,
      isLoggedIn: !!accessToken.value,
      isLoading: false,
      error: null as string | null,
    };
  },

  getters: {
    isAdmin: (state): boolean => {
      if (!state.user) return false;
      if (state.user.role === 'admin' || state.user.role === 'staff') return true;
      if (state.user.is_superuser || state.user.is_staff) return true;
      if (Array.isArray(state.user.roles) && state.user.roles.length > 0) {
        return state.user.roles.some((r: any) => {
          const roleName = typeof r === 'string' ? r.toLowerCase() : (r?.name || '').toLowerCase();
          return roleName === 'admin' || roleName === 'staff' || roleName === 'superuser';
        });
      }
      return false;
    }
  },
  
  actions: {
    // 1. Core Registration Integration
    async signUp(payload: any) {
      const client = useApiClient();
      this.isLoading = true;
      this.error = null;
      
      try {
        const body = {
          full_name: payload.name || payload.full_name,
          email: payload.email,
          password: payload.password,
          confirm_password: payload.confirmPassword || payload.confirm_password,
          phone: payload.phone || ''
        };

        const response = await client.request<any>('/api/v1/auth/register/', {
          method: 'POST',
          body
        });
        
        // Handle response mapping
        const customer = response.customer || response;
        
        this.isLoading = false;
        return customer;
      } catch (err: any) {
        this.isLoading = false;
        this.error = err.data?.message || err.message || 'Registration failed. Please check validation rules.';
        throw err;
      }
    },

    // 2. Core Login Integration
    async login(payload: { credential?: string; email?: string; password?: string }) {
      const client = useApiClient();
      this.isLoading = true;
      this.error = null;

      // Reformat to match POST /api/v1/auth/login/ body interface: { credential, password }
      const loginPayload: LoginPayload = {
        credential: payload.credential || payload.email,
        password: payload.password
      };

      try {
        const response = await client.request<LoginResponse>('/api/v1/auth/login/', {
          method: 'POST',
          body: loginPayload
        });

        // Store access and refresh tokens returned from backend if available
        const token = response.accessToken || (response as any).access_token || (response as any).access;
        const rToken = response.refreshToken || (response as any).refresh_token || (response as any).refresh;

        if (token) {
          const accessTokenCookie = useCookie<string | null>('access_token', { maxAge: 60 * 60 * 24 * 7, path: '/' });
          accessTokenCookie.value = token;
        }
        if (rToken) {
          const refreshTokenCookie = useCookie<string | null>('refresh_token', { maxAge: 60 * 60 * 24 * 30, path: '/' });
          refreshTokenCookie.value = rToken;
        }

        // Store active user profile from nested user object or flat response attributes
        let userProfile: User | null = null;
        const rawUser = response.user || response;
        const jwtData = token ? parseJwt(token) : null;

        if (rawUser) {
          const emailStr = (rawUser as any).email || jwtData?.email || payload.email || payload.credential || '';
          const nameStr = (rawUser as any).name || (rawUser as any).full_name || (rawUser as any).username || jwtData?.name || jwtData?.full_name || jwtData?.username || (emailStr ? emailStr.split('@')[0].toUpperCase() : '');
          const userIdStr = (rawUser as any).user_id || (rawUser as any).id || jwtData?.user_id || jwtData?.id || jwtData?.sub || '';

          const rolesList = (rawUser as any).roles || jwtData?.roles || [];
          const isStaff = (rawUser as any).is_staff ?? jwtData?.is_staff ?? false;
          const isSuperuser = (rawUser as any).is_superuser ?? jwtData?.is_superuser ?? false;
          
          let roleVal: 'admin' | 'staff' | 'customer' = (rawUser as any).role || jwtData?.role || 'customer';
          if (isSuperuser || isStaff || (Array.isArray(rolesList) && rolesList.some((r: any) => {
            const name = typeof r === 'string' ? r.toLowerCase() : (r?.name || '').toLowerCase();
            return name === 'admin' || name === 'staff' || name === 'superuser';
          }))) {
            roleVal = isStaff && !isSuperuser ? 'staff' : 'admin';
          }

          userProfile = {
            id: userIdStr,
            name: nameStr,
            email: emailStr,
            role: roleVal,
            roles: rolesList,
            is_staff: isStaff,
            is_superuser: isSuperuser,
            joinedAt: (rawUser as any).joinedAt || (rawUser as any).created_at || new Date().toISOString()
          };
        }

        this.user = userProfile;
        const userCookie = useCookie<User | null>('auth_user', { maxAge: 60 * 60 * 24 * 7, path: '/' });
        userCookie.value = userProfile;
        
        this.isLoggedIn = true;
        this.isLoading = false;
        this.error = null;
        
        return response;
      } catch (err: any) {
        this.isLoading = false;
        this.isLoggedIn = false;
        this.user = null;
        
        this.error = err.data?.message || err.message || 'Invalid enterprise credentials. Please try again.';
        throw err;
      }
    },

    // 3. Core Logout Integration
    async logout(redirectPath?: string) {
      const client = useApiClient();
      this.isLoading = true;
      
      try {
        // Retrieve current access token before clearing the state/cookies
        const accessTokenCookie = useCookie<string | null>('access_token', { path: '/' });
        const token = accessTokenCookie.value;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Retrieve current refresh token to include in the request body
        const refreshTokenCookie = useCookie<string | null>('refresh_token', { path: '/' });
        const rToken = refreshTokenCookie.value;
        const body: Record<string, string> = {};
        if (rToken) {
          body['refresh'] = rToken;
          body['refresh_token'] = rToken;
          body['refresh'] = rToken;
        }

        // Use POST /api/v1/auth/logout/ to notify backend with auth token and refresh token body
        await client.request('/api/v1/auth/logout/', {
          method: 'POST',
          headers,
          body
        });
      } catch (err) {
        // Fall through so local session is cleared even if server-side checkout fails
        console.error('Logout request failed on server', err);
      } finally {
        // Clear all local auth state and persistent cookies
        this.user = null;
        this.isLoggedIn = false;
        this.isLoading = false;
        this.error = null;

        const authUserCookie = useCookie('auth_user', { path: '/' });
        const accessTokenCookie = useCookie('access_token', { path: '/' });
        const refreshTokenCookie = useCookie('refresh_token', { path: '/' });

        authUserCookie.value = null;
        accessTokenCookie.value = null;
        refreshTokenCookie.value = null;

        // Redirect safely
        const target = redirectPath || (useRoute().path !== '/login' && useRoute().path !== '/signup' ? useRoute().fullPath : '');
        if (target) {
          navigateTo(`/login?redirect=${encodeURIComponent(target)}`);
        } else {
          navigateTo('/login');
        }
      }
    },

    // Centralized Helper to check credentials and initialize auth state dynamically
    initialize() {
      const userCookie = useCookie<User | null>('auth_user', { path: '/' });
      const accessToken = useCookie<string | null>('access_token', { path: '/' });
      
      if (accessToken.value && userCookie.value) {
        this.user = userCookie.value;
        this.isLoggedIn = true;
      } else {
        this.user = null;
        this.isLoggedIn = false;
      }
    }
  }
});

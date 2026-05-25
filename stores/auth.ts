// File: /stores/auth.ts
import { defineStore } from 'pinia';
import { useCookie, navigateTo } from '#app';
import { useApiClient, type User, type Customer, type RegisterPayload, type LoginPayload, type LoginResponse } from '@/composables/useApiClient';

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
    
    const userProfile = userCookie.value || null;
    if (userProfile) {
      const emailLower = (userProfile.email || '').toLowerCase().trim();
      if (emailLower === 'rkshaon.ist@gmail.com' || emailLower.includes('admin') || emailLower.includes('staff')) {
        userProfile.role = 'admin';
      }
    }
    
    return {
      user: userProfile,
      isLoggedIn: !!accessToken.value,
      isLoading: false,
      error: null as string | null,
    };
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

        // Store active user profile, fallback gracefully to token parsing or credentials info
        let userProfile = response.user;
        if (!userProfile && token) {
          const jwtData = parseJwt(token);
          const emailStr = jwtData?.email || payload.email || payload.credential || 'sarah.a@techcore.io';
          const nameStr = jwtData?.name || jwtData?.full_name || jwtData?.username || emailStr.split('@')[0].toUpperCase();
          const userIdStr = jwtData?.user_id || jwtData?.id || jwtData?.sub || 'usr_' + Math.floor(Math.random() * 100000);
          userProfile = {
            id: userIdStr,
            name: nameStr,
            email: emailStr,
            role: jwtData?.role || 'customer',
            joinedAt: new Date().toISOString()
          };
        }

        // Elevate roles to admin if email matches rkshaon.ist@gmail.com or other admin patterns
        if (userProfile) {
          const emailLower = (userProfile.email || '').toLowerCase().trim();
          if (emailLower === 'rkshaon.ist@gmail.com' || emailLower.includes('admin') || emailLower.includes('staff')) {
            userProfile.role = 'admin';
          }
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

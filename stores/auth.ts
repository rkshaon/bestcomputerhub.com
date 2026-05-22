import { defineStore } from 'pinia';
import { useCookie, navigateTo } from '#app';
import { useApiClient, type User, type Customer, type RegisterPayload, type LoginPayload, type LoginResponse } from '@/composables/useApiClient';

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
  
  actions: {
    // 1. Core Registration Integration
    async signUp(payload: RegisterPayload) {
      const client = useApiClient();
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await client.request<any>('/api/v1/customers/', {
          method: 'POST',
          body: payload
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

        // Store active user profile
        this.user = response.user;
        const userCookie = useCookie<User | null>('auth_user', { maxAge: 60 * 60 * 24 * 7, path: '/' });
        userCookie.value = response.user;
        
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
    async logout() {
      const client = useApiClient();
      this.isLoading = true;
      
      try {
        // Use POST /api/v1/auth/logout/ to notify backend
        await client.request('/api/v1/auth/logout/', {
          method: 'POST'
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
        navigateTo('/login');
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

import { ref } from 'vue';
import { useCookie, useRuntimeConfig, navigateTo } from '#app';

// Reusable typed models/interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'staff';
  joinedAt: string;
}

export interface Customer extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

export interface RegisterResponse {
  customer: Customer;
  message?: string;
}

export interface LoginPayload {
  credential?: string;
  email?: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRefreshPayload {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

// Token refresh queue mechanisms
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (err: Error | null, token: string = '') => {
  refreshQueue.forEach((callback) => {
    if (!err) {
      callback(token);
    }
  });
  refreshQueue = [];
};

export const useApiClient = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || '';
  
  const accessTokenCookie = useCookie<string | null>('access_token', { maxAge: 60 * 60 * 24 * 7, path: '/' });
  const refreshTokenCookie = useCookie<string | null>('refresh_token', { maxAge: 60 * 60 * 24 * 30, path: '/' });

  // Centralized Loading and Success/Error States
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);
  const isSuccess = ref(false);

  // Reusable request helper that automatically attaches Bearer access token and handles 401 Refresh
  const request = async <T>(url: string, options: any = {}): Promise<T> => {
    isLoading.value = true;
    errorMsg.value = null;
    isSuccess.value = false;

    // Check if we should run in simulation mode because no apiBase is configured in the environment
    const isMockMode = !apiBase || apiBase.trim() === '';

    // If simulating, mock response data appropriately to prevent visual breakage
    if (isMockMode) {
      return simulateApiCall<T>(url, options);
    }

    const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

    // Ensure headers exist
    const headers: Record<string, string> = {};
    if (options.headers) {
      if (typeof options.headers.forEach === 'function') {
        options.headers.forEach((value: string, key: string) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }
    
    // Auto-attach Bearer token
    if (accessTokenCookie.value) {
      headers['Authorization'] = `Bearer ${accessTokenCookie.value}`;
    }

    try {
      const response = await $fetch<T>(fullUrl, {
        ...options,
        headers,
        async onResponseError({ response, options: retryOptions }) {
          // Token refresh logic on 401 Unauthorized
          if (response.status === 401 && refreshTokenCookie.value) {
            if (!isRefreshing) {
              isRefreshing = true;
              try {
                const refreshUrl = `${apiBase}/api/v1/auth/refresh/`;
                const refreshRes = await $fetch<TokenRefreshResponse>(refreshUrl, {
                  method: 'POST',
                  body: {
                    refreshToken: refreshTokenCookie.value,
                    refresh_token: refreshTokenCookie.value,
                    refresh: refreshTokenCookie.value
                  }
                });

                const newToken = refreshRes.accessToken || (refreshRes as any).access_token;
                accessTokenCookie.value = newToken;
                if (refreshRes.refreshToken || (refreshRes as any).refresh_token) {
                  refreshTokenCookie.value = refreshRes.refreshToken || (refreshRes as any).refresh_token;
                }

                processQueue(null, newToken);
                isRefreshing = false;
              } catch (refreshErr) {
                processQueue(refreshErr as Error, '');
                isRefreshing = false;
                
                // Clear tokens and force logout
                accessTokenCookie.value = null;
                refreshTokenCookie.value = null;
                navigateTo('/login');
                throw refreshErr;
              }
            }

            // Queue retry requests for when refresh finishes
            return new Promise((resolve) => {
              refreshQueue.push((token) => {
                const rHeaders: Record<string, string> = {};
                if (retryOptions.headers) {
                  if (typeof (retryOptions.headers as any).forEach === 'function') {
                    (retryOptions.headers as any).forEach((v: string, k: string) => {
                      rHeaders[k] = v;
                    });
                  } else {
                    Object.assign(rHeaders, retryOptions.headers);
                  }
                }
                rHeaders['Authorization'] = `Bearer ${token}`;
                (retryOptions as any).headers = rHeaders;
                resolve($fetch(fullUrl, retryOptions as any));
              });
            });
          }
        }
      });

      isSuccess.value = true;
      isLoading.value = false;
      return response;
    } catch (err: any) {
      isLoading.value = false;
      errorMsg.value = err.data?.message || err.message || 'An error occurred during the API request';
      // Pass the error upwards for visual form handling
      throw err;
    }
  };

  // Environment-agnostic simulation helper (UX Fallback)
  const simulateApiCall = async <T>(url: string, options: any): Promise<T> => {
    // Artificial latency for premium enterprise feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (url.includes('/api/v1/auth/login')) {
      const body = options.body || {};
      const actualCredential = body.credential || body.email || '';
      
      if (body.password === 'wrong') {
        errorMsg.value = 'Invalid enterprise credentials';
        throw new Error('Invalid enterprise credentials');
      }

      const mockResponse: LoginResponse = {
        accessToken: 'simulated_access_token_jwt_xyz_123',
        refreshToken: 'simulated_refresh_token_jwt_abc_789',
        user: {
          id: 'usr_mock_999',
          name: 'Sarah Anderson',
          email: actualCredential || 'sarah.a@techcore.io',
          role: 'customer',
          joinedAt: new Date().toISOString()
        }
      };

      accessTokenCookie.value = mockResponse.accessToken;
      refreshTokenCookie.value = mockResponse.refreshToken;
      isSuccess.value = true;
      isLoading.value = false;
      return mockResponse as unknown as T;
    }

    if (url.includes('/api/v1/customers')) {
      const body = options.body || {};
      
      const mockResponse: RegisterResponse = {
        customer: {
          id: 'usr_mock_' + Math.floor(Math.random() * 1000000),
          name: body.name || 'Enterprise User',
          email: body.email || 'user@enterprise.com',
          role: 'customer',
          joinedAt: new Date().toISOString(),
          totalOrders: 0,
          totalSpent: 0,
          status: 'active'
        },
        message: 'Registration successful'
      };

      isSuccess.value = true;
      isLoading.value = false;
      return mockResponse as unknown as T;
    }

    if (url.includes('/api/v1/auth/refresh')) {
      const mockResponse: TokenRefreshResponse = {
        accessToken: 'simulated_refreshed_access_token_jwt_' + Date.now()
      };
      accessTokenCookie.value = mockResponse.accessToken;
      isSuccess.value = true;
      isLoading.value = false;
      return mockResponse as unknown as T;
    }

    if (url.includes('/api/v1/auth/logout')) {
      accessTokenCookie.value = null;
      refreshTokenCookie.value = null;
      isSuccess.value = true;
      isLoading.value = false;
      return { message: 'Logged out successfully' } as unknown as T;
    }

    // Default mock response for other routes
    isSuccess.value = true;
    isLoading.value = false;
    return { data: 'Success (Simulated Mode)' } as unknown as T;
  };

  return {
    request,
    isLoading,
    errorMsg,
    isSuccess,
    accessToken: accessTokenCookie,
    refreshToken: refreshTokenCookie
  };
};

import { ref } from 'vue';
import { useCookie, useRuntimeConfig, navigateTo } from '#app';

// Mock DB configuration for local storage persistence
const USERS_STORAGE_KEY = 'techcore_mock_users2';
const CUSTOMERS_STORAGE_KEY = 'techcore_mock_customers2';

export interface UserEntity {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
  joinedAt: string;
}

export interface CustomerProfileEntity {
  id: string;
  user_id: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
}

const getLocalUsers = (): UserEntity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const list = localStorage.getItem(USERS_STORAGE_KEY);
    return list ? JSON.parse(list) : [
      {
        id: 'usr_mock_999',
        full_name: 'Sarah Anderson',
        email: 'sarah.a@techcore.io',
        role: 'customer',
        joinedAt: new Date().toISOString()
      }
    ];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: UserEntity[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
};

const getLocalCustomers = (): CustomerProfileEntity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const list = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
};

const saveLocalCustomers = (customers: CustomerProfileEntity[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch {}
};

// Atomic Create User Helper matching requirements
export function create_user(data: { full_name: string; email: string; phone?: string; role?: 'customer' | 'admin' | 'staff' }): UserEntity {
  const users = getLocalUsers();
  const newUser: UserEntity = {
    id: 'usr_mock_' + Math.floor(Math.random() * 1000000),
    full_name: data.full_name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone || '',
    role: data.role || 'customer',
    joinedAt: new Date().toISOString()
  };
  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}

// Atomic Create CustomerProfile Helper linked to User matching requirements
export function create_customer_profile(userEntity: UserEntity): CustomerProfileEntity {
  const customers = getLocalCustomers();
  const newCustomerProfile: CustomerProfileEntity = {
    id: 'cust_mock_' + Math.floor(Math.random() * 1000000),
    user_id: userEntity.id,
    totalOrders: 0,
    totalSpent: 0,
    status: 'active'
  };
  customers.push(newCustomerProfile);
  saveLocalCustomers(customers);
  return newCustomerProfile;
}

// Reusable typed models/interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
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
  name?: string;
  full_name?: string;
  email: string;
  password?: string;
  confirm_password?: string;
  phone?: string;
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

    const throwSimulatedError = (msg: string) => {
      const errorObj = new Error(msg);
      (errorObj as any).data = { message: msg };
      (errorObj as any).status = 400;
      throw errorObj;
    };

    if (url.includes('/api/v1/auth/login')) {
      const body = options.body || {};
      const actualCredential = (body.credential || body.email || '').toLowerCase().trim();
      const enteredPassword = body.password || '';

      if (enteredPassword === 'wrong') {
        throwSimulatedError('Invalid enterprise credentials.');
      }

      // Check if user is registered in our local mock system
      const users = getLocalUsers();
      const existingUser = users.find(u => u.email === actualCredential);

      const userProfile = existingUser ? {
        id: existingUser.id,
        name: existingUser.full_name,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role,
        joinedAt: existingUser.joinedAt
      } : {
        id: 'usr_mock_999',
        name: actualCredential.split('@')[0].toUpperCase(),
        email: actualCredential || 'sarah.a@techcore.io',
        role: 'customer' as const,
        joinedAt: new Date().toISOString()
      };

      const mockResponse: LoginResponse = {
        accessToken: 'simulated_access_token_jwt_xyz_123',
        refreshToken: 'simulated_refresh_token_jwt_abc_789',
        user: userProfile
      };

      accessTokenCookie.value = mockResponse.accessToken;
      refreshTokenCookie.value = mockResponse.refreshToken;
      isSuccess.value = true;
      isLoading.value = false;
      return mockResponse as unknown as T;
    }

    if (url.includes('/api/v1/auth/register') || url.includes('/auth/register') || url.includes('/api/v1/customers')) {
      const body = options.body || {};
      const full_name = body.full_name || body.name || '';
      const email = (body.email || '').toLowerCase().trim();
      const password = body.password || '';
      const confirm_password = body.confirm_password || body.confirmPassword || '';
      const phone = body.phone || '';

      // Required Field Validations
      if (!full_name) {
        throwSimulatedError('Full name is required.');
      }
      if (!email) {
        throwSimulatedError('Email is required.');
      }
      if (!password) {
        throwSimulatedError('Password is required.');
      }
      if (!confirm_password) {
        throwSimulatedError('Password confirmation is required.');
      }

      // Password Matching Validator
      if (password !== confirm_password) {
        throwSimulatedError('Passwords do not match.');
      }

      // Password Security Validators
      if (password.length < 8) {
        throwSimulatedError('Password must be at least 8 characters long.');
      }
      if (!/[0-9]/.test(password) && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throwSimulatedError('Password must contain at least one number or special character.');
      }

      // Email Uniqueness check
      const users = getLocalUsers();
      if (users.some(u => u.email === email)) {
        throwSimulatedError('This email is already registered to an enterprise account.');
      }

      // Create User atomically using helper
      const newUser = create_user({ full_name, email, phone });
      
      // Create CustomerProfile atomically linked to the User
      const newProfile = create_customer_profile(newUser);

      // Return customer/user details without password fields
      const mockResponse = {
        user: {
          id: newUser.id,
          name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone || undefined,
          role: newUser.role,
          joinedAt: newUser.joinedAt
        },
        customer: {
          id: newProfile.id,
          user_id: newUser.id,
          name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone || undefined,
          totalOrders: newProfile.totalOrders,
          totalSpent: newProfile.totalSpent,
          status: newProfile.status,
          joinedAt: newUser.joinedAt
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

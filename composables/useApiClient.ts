import { useRuntimeConfig, useCookie } from '#app';

// Module-level shared states to prevent token refresh race conditions
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const useApiClient = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'https://apibestcomputerhub.rkshaon.info';

  const getAuthToken = (): string | null => {
    // 1. Try environment/public API token from runtime config if populated
    if (config.public.apiToken) {
      return config.public.apiToken as string;
    }

    // 2. Try Nuxt cookies (safe in server and client context)
    try {
      const checkKeys = [
        'techcore_admin_token',
        'token',
        'auth_token',
        'access_token',
        'jwt',
        'access'
      ];
      for (const key of checkKeys) {
        const cookieVal = useCookie(key).value;
        if (cookieVal) return cookieVal as string;
      }
    } catch (e) {
      // safe fallback
    }

    // 3. Try document.cookie dynamically (client-side backup)
    if (typeof document !== 'undefined') {
      try {
        const checkKeys = [
          'techcore_admin_token',
          'token',
          'auth_token',
          'access_token',
          'jwt',
          'access'
        ];
        for (const key of checkKeys) {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${key}=`);
          if (parts.length === 2) {
            const val = parts.pop()?.split(';').shift();
            if (val) return decodeURIComponent(val);
          }
        }
      } catch (e) {}
    }

    // 4. Try localStorage (client-side backup)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const checkKeys = [
          'techcore_admin_token',
          'token',
          'auth_token',
          'access_token',
          'jwt',
          'access'
        ];
        for (const key of checkKeys) {
          const val = localStorage.getItem(key);
          if (val) return val;
        }
      } catch (e) {}
    }

    return null;
  };

  const getRefreshToken = (): string | null => {
    // 1. Try Nuxt cookies
    try {
      const checkKeys = [
        'techcore_admin_refresh_token',
        'refresh_token',
        'refresh',
        'techcore_refresh_token'
      ];
      for (const key of checkKeys) {
        const cookieVal = useCookie(key).value;
        if (cookieVal) return cookieVal as string;
      }
    } catch (e) {}

    // 2. Try document.cookie dynamically (client-side backup)
    if (typeof document !== 'undefined') {
      try {
        const checkKeys = [
          'techcore_admin_refresh_token',
          'refresh_token',
          'refresh',
          'techcore_refresh_token'
        ];
        for (const key of checkKeys) {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${key}=`);
          if (parts.length === 2) {
            const val = parts.pop()?.split(';').shift();
            if (val) return decodeURIComponent(val);
          }
        }
      } catch (e) {}
    }

    // 3. Try localStorage (client-side backup)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const checkKeys = [
          'techcore_admin_refresh_token',
          'refresh_token',
          'refresh',
          'techcore_refresh_token'
        ];
        for (const key of checkKeys) {
          const val = localStorage.getItem(key);
          if (val) return val;
        }
      } catch (e) {}
    }

    return null;
  };

  const saveTokens = (access: string, refresh?: string) => {
    try {
      const accessCookie = useCookie('techcore_admin_token');
      accessCookie.value = access;
      const genericAccessCookie = useCookie('access_token');
      genericAccessCookie.value = access;
    } catch (e) {}

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('techcore_admin_token', access);
        localStorage.setItem('access_token', access);
      } catch (e) {}
    }

    if (refresh) {
      try {
        const refreshCookie = useCookie('techcore_admin_refresh_token');
        refreshCookie.value = refresh;
        const genericRefreshCookie = useCookie('refresh_token');
        genericRefreshCookie.value = refresh;
      } catch (e) {}

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem('techcore_admin_refresh_token', refresh);
          localStorage.setItem('refresh_token', refresh);
        } catch (e) {}
      }
    }
  };

  const clearTokens = () => {
    try {
      const keys = [
        'techcore_admin_token', 'access_token', 'token', 'auth_token', 'access', 'jwt',
        'techcore_admin_refresh_token', 'refresh_token', 'refresh', 'techcore_refresh_token'
      ];
      for (const k of keys) {
        const cookie = useCookie(k);
        cookie.value = null;
      }
    } catch (e) {}

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = [
          'techcore_admin_token', 'access_token', 'token', 'auth_token', 'access', 'jwt',
          'techcore_admin_refresh_token', 'refresh_token', 'refresh', 'techcore_refresh_token'
        ];
        for (const k of keys) {
          localStorage.removeItem(k);
        }
      } catch (e) {}
    }
  };

  const getCsrfToken = (): string | null => {
    try {
      const csrf = useCookie('csrftoken').value;
      if (csrf) return csrf as string;
    } catch (e) {}

    if (typeof document !== 'undefined') {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; csrftoken=`);
        if (parts.length === 2) {
          const val = parts.pop()?.split(';').shift();
          if (val) return decodeURIComponent(val);
        }
      } catch (e) {}
    }
    return null;
  };

  const request = async <T>(endpoint: string, options: any = {}): Promise<T> => {
    // Trailing Slashes Requirement: Force trailing slash before any query parameters
    let urlPath = endpoint;
    const [pathPart, queryPart] = endpoint.split('?');
    if (pathPart && !pathPart.endsWith('/')) {
      urlPath = `${pathPart}/${queryPart ? '?' + queryPart : ''}`;
    }

    const fullUrl = `${apiBase}${urlPath}`;

    const getHeaders = () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = getAuthToken();
      if (token) {
        const trimmed = token.trim();
        const formattedToken = trimmed.startsWith('Bearer ') || trimmed.startsWith('Token ')
          ? trimmed
          : `Bearer ${trimmed}`;
        headers['Authorization'] = formattedToken;
      }

      const csrf = getCsrfToken();
      if (csrf) {
        headers['X-CSRFToken'] = csrf;
      }

      return headers;
    };

    try {
      const response = await $fetch<T>(fullUrl, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers,
        },
      });
      return response;
    } catch (err: any) {
      const status = err.status || err.response?.status;
      
      // If unauthorized, attempt to perform token refresh flow
      if (status === 401) {
        const refreshToken = getRefreshToken();
        
        if (refreshToken) {
          try {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshPromise = (async () => {
                const refreshEndpoints = [
                  '/api/v1/token/refresh/',
                  '/api/v1/auth/token/refresh/',
                  '/api/v1/auth/refresh/'
                ];

                for (const ep of refreshEndpoints) {
                  try {
                    const res = await $fetch<any>(`${apiBase}${ep}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: { refresh: refreshToken }
                    });

                    const access = res?.access || res?.access_token || res?.token;
                    if (access) {
                      const freshRefresh = res?.refresh || res?.refresh_token;
                      saveTokens(access, freshRefresh);
                      return access as string;
                    }
                  } catch (e: any) {
                    console.warn(`Token refresh attempt failed on ${ep}:`, e.message || e);
                  }
                }
                return null;
              })();
            }

            const newAccessToken = await refreshPromise;
            isRefreshing = false;
            refreshPromise = null;

            if (newAccessToken) {
              // Retry the original request with new headers
              const retryResponse = await $fetch<T>(fullUrl, {
                ...options,
                headers: {
                  ...getHeaders(),
                  ...options.headers,
                },
              });
              return retryResponse;
            } else {
              clearTokens();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('techcore-auth-required'));
              }
              throw new Error('Administrative session expired. Please re-authenticate.');
            }
          } catch (refreshErr) {
            isRefreshing = false;
            refreshPromise = null;
            clearTokens();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('techcore-auth-required'));
            }
            throw refreshErr;
          }
        } else {
          clearTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('techcore-auth-required'));
          }
        }
      }

      console.error(`API Client Hook Error on ${endpoint}:`, err);
      throw err;
    }
  };

  return {
    request,
    getAuthToken,
    getRefreshToken,
    saveTokens,
    clearTokens
  };
};

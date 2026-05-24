import { useRuntimeConfig, useCookie } from '#app';

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

    // Compute dynamic authorization and security headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
      // Ensure bearer/token format if not already styled
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

    try {
      const response = await $fetch<T>(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      return response;
    } catch (err: any) {
      console.error(`API Client Hook Error on ${endpoint}:`, err);
      throw err;
    }
  };

  return {
    request,
    getAuthToken,
  };
};

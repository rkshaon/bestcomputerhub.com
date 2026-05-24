import { useRuntimeConfig } from '#app';

export const useApiClient = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'https://apibestcomputerhub.rkshaon.info';

  const request = async <T>(endpoint: string, options: any = {}): Promise<T> => {
    // Trailing Slashes Requirement: Force trailing slash before any query parameters
    let urlPath = endpoint;
    const [pathPart, queryPart] = endpoint.split('?');
    if (pathPart && !pathPart.endsWith('/')) {
      urlPath = `${pathPart}/${queryPart ? '?' + queryPart : ''}`;
    }

    const fullUrl = `${apiBase}${urlPath}`;

    try {
      const response = await $fetch<T>(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
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
  };
};

// File: /composables/useRequestLogService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { RequestLog, PaginatedRequestLogs, RequestLogQueryParams } from '@/types';

const requestLogsCache = ref<RequestLog[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

export const useRequestLogService = () => {
  const apiClient = useApiClient();

  /**
   * Fetch paginated list of request logs (GET /api/v1/request-logs/)
   */
  const getRequestLogs = async (params?: RequestLogQueryParams): Promise<PaginatedRequestLogs> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const queryObj: Record<string, any> = {};
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            queryObj[key] = value;
          }
        }
      }

      const data = await apiClient.request<PaginatedRequestLogs | RequestLog[]>('/api/v1/request-logs/', {
        method: 'GET',
        params: queryObj
      });

      let results: RequestLog[] = [];
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

      requestLogsCache.value = results;
      totalCount.value = count;

      return {
        count,
        next: nextUrl,
        previous: previousUrl,
        results
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve request logs.');
      errorMsg.value = msg;
      requestLogsCache.value = [];
      totalCount.value = 0;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch single request log detail by ID (GET /api/v1/request-logs/{id}/)
   */
  const getRequestLogById = async (id: number | string): Promise<RequestLog> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<RequestLog>(`/api/v1/request-logs/${id}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      const cached = requestLogsCache.value.find(item => String(item.id) === String(id));
      if (cached) return cached;

      const msg = extractErrorMessage(err, `Failed to retrieve request log #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    requestLogs: requestLogsCache,
    totalCount,
    isLoading,
    error: errorMsg,
    getRequestLogs,
    getRequestLogById
  };
};

export const useRequestLogsService = useRequestLogService;

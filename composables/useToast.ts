// File: /composables/useToast.ts
import { toast } from 'vue-sonner';

/**
 * Robust utility to parse API errors in TechCore Enterprise applications.
 * Extracts messages from various response models:
 *   - { "detail": "..." }
 *   - { "message": "..." }
 *   - { "errors": { "field": ["err1", ...] } }
 *   - { "non_field_errors": ["..."] }
 */
/**
 * Helper to identify raw HTTP/FetchError messages that should never be shown to end users.
 */
function isRawHttpErrorString(msg: any): boolean {
  if (typeof msg !== 'string' || !msg.trim()) return false;
  const str = msg.trim();
  if (/^\[(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\]/i.test(str)) return true;
  if (str.includes('http://') || str.includes('https://')) return true;
  if (str.startsWith('FetchError:') || str.includes('FetchError')) return true;
  if (/^\d{3}\s+[A-Za-z\s]+$/.test(str) && (str.includes('403') || str.includes('Forbidden') || str.includes('Unauthorized'))) return true;
  return false;
}

/**
 * Robust utility to parse API errors in TechCore Enterprise applications.
 * Extracts messages from various response models:
 *   - { "detail": "..." }
 *   - { "message": "..." }
 *   - { "error": "..." }
 *   - { "non_field_errors": ["..."] }
 *   - { "errors": { "field": ["err1", ...] } }
 */
export function extractErrorMessage(err: any, fallbackMessage = 'An unexpected error occurred.'): string {
  if (!err) return fallbackMessage;

  const status = err.status || err.statusCode || err.response?.status || err.data?.statusCode || err.data?.status;

  // Inspect actual backend response payload if present
  const data = err.data || err.response?.data;

  if (data && typeof data === 'object') {
    // 1. Direct message/detail/error string checks
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }

    // 2. non_field_errors (often arrays of string messages from DRF)
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      const first = data.non_field_errors[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
    }

    // 3. Nested "errors" key check
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) {
        const value = data.errors[firstKey];
        if (Array.isArray(value) && value.length > 0) {
          return `${firstKey.replace(/_/g, ' ')}: ${value[0]}`;
        }
        if (typeof value === 'string' && value) {
          return `${firstKey.replace(/_/g, ' ')}: ${value}`;
        }
        return `${firstKey.replace(/_/g, ' ')}: ${JSON.stringify(value)}`;
      }
    }

    // 4. Any generic key error array or string representation
    for (const key of Object.keys(data)) {
      if (['data', 'success', 'statusCode', 'status'].includes(key)) {
        continue;
      }
      const val = data[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
        return `${key.replace(/_/g, ' ')}: ${val[0]}`;
      }
      if (typeof val === 'string' && val.trim() && val.length < 200) {
        return `${key.replace(/_/g, ' ')}: ${val.trim()}`;
      }
    }
  } else if (typeof data === 'string' && data.trim() && !data.includes('<html') && !isRawHttpErrorString(data)) {
    return data.trim();
  }

  // If status is 403 Forbidden and no specific message was in payload
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  // Check err.message, but reject raw HTTP error strings
  if (typeof err.message === 'string' && err.message.trim() && !isRawHttpErrorString(err.message)) {
    return err.message.trim();
  }

  if (typeof err === 'string' && err.trim() && !isRawHttpErrorString(err)) {
    return err.trim();
  }

  return fallbackMessage;
}

/**
 * Main Direct Global Notifications API matching user specs.
 * Directly autoimported in Nuxt 3 templates of this workspace.
 */
export const toastSuccess = (message: string, options?: any) => {
  return toast.success(message, options);
};

export const toastError = (message: string, options?: any) => {
  return toast.error(message, options);
};

export const toastInfo = (message: string, options?: any) => {
  return toast.info(message, options);
};

export const toastWarning = (message: string, options?: any) => {
  return toast.warning(message, options);
};

/**
 * Centralized API error displayer implementing requirements.
 */
export const handleApiError = (err: any, fallbackMessage = 'An unexpected error occurred.') => {
  const parsed = extractErrorMessage(err, fallbackMessage);
  const msg = parsed && parsed !== '{}' ? parsed : fallbackMessage;
  toastError(msg);
  return msg;
};

/**
 * useToast Composable Wrapper conforming to standard Nuxt patterns
 */
export const useToast = () => {
  return {
    toastSuccess,
    toastError,
    toastInfo,
    toastWarning,
    handleApiError,
    extractErrorMessage,
    toast
  };
};

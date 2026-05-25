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
export function extractErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  
  // Check if it's a standard network/FetchError holding a .data element
  const data = err.data || err.response?.data || err;
  
  if (data && typeof data === 'object') {
    // 1. Direct message/detail/error string checks
    if (typeof data.detail === 'string' && data.detail) {
      return data.detail;
    }
    if (typeof data.message === 'string' && data.message) {
      return data.message;
    }
    if (typeof data.error === 'string' && data.error) {
      return data.error;
    }
    
    // 2. non_field_errors (often arrays of string messages)
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    
    // 3. Nested "errors" key check
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) {
        const value = data.errors[firstKey];
        if (Array.isArray(value) && value.length > 0) {
          return `${firstKey}: ${value[0]}`;
        }
        if (typeof value === 'string' && value) {
          return `${firstKey}: ${value}`;
        }
        return `${firstKey}: ${JSON.stringify(value)}`;
      }
    }
    
    // 4. Any generic key error array or string representation
    for (const key of Object.keys(data)) {
      if (['data', 'success', 'statusCode', 'status'].includes(key)) {
        continue;
      }
      const val = data[key];
      if (Array.isArray(val) && val.length > 0) {
        return `${key}: ${val[0]}`;
      }
      if (typeof val === 'string' && val.length < 150 && val) {
        return `${key}: ${val}`;
      }
    }
  }
  
  // Final native string fallbacks
  return err.message || (typeof err === 'string' ? err : 'An unexpected error occurred.');
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
  const parsed = extractErrorMessage(err);
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

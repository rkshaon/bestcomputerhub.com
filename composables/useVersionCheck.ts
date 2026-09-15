// File: /composables/useVersionCheck.ts
import { ref, readonly } from 'vue';

export interface VersionInfo {
  version: string;
  buildTime?: string;
}

// Module-level state shared across all components and layout instances
const currentVersion = ref<string>('');
const latestVersion = ref<string>('');
const latestBuildTime = ref<string>('');
const hasUpdate = ref<boolean>(false);
const isChecking = ref<boolean>(false);
const lastChecked = ref<Date | null>(null);
const dismissedVersion = ref<string | null>(null);

export function useVersionCheck() {
  const runtimeConfig = useRuntimeConfig();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let initialTimerId: ReturnType<typeof setTimeout> | null = null;
  let isVisibilityListenerAttached = false;

  // Initialize current loaded version from runtime config
  if (!currentVersion.value && runtimeConfig.public?.appVersion) {
    currentVersion.value = String(runtimeConfig.public.appVersion);
  }

  const checkForUpdates = async (): Promise<boolean> => {
    if (!process.client || isChecking.value) {
      return false;
    }

    isChecking.value = true;
    try {
      // Append high-entropy timestamp to query string to bypass browser & CDN caching
      const timestamp = Date.now();
      const response = await fetch(`/version.json?_t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as VersionInfo;
      if (data && typeof data.version === 'string' && data.version.trim()) {
        const fetchedVersion = data.version.trim();
        lastChecked.value = new Date();

        // If current client version is not yet initialized, store current version
        if (!currentVersion.value) {
          currentVersion.value = fetchedVersion;
          return false;
        }

        // Compare deployed version with currently loaded client application version
        if (fetchedVersion !== currentVersion.value) {
          latestVersion.value = fetchedVersion;
          if (data.buildTime) {
            latestBuildTime.value = data.buildTime;
          }

          // Do not re-notify if user dismissed this specific version in current session
          if (dismissedVersion.value !== fetchedVersion) {
            hasUpdate.value = true;
            return true;
          }
        }
      }
    } catch {
      // Gracefully handle network errors/offline states without throwing unhandled exceptions
    } finally {
      isChecking.value = false;
    }

    return false;
  };

  const refreshApp = () => {
    if (process.client) {
      // Perform a full browser window reload to fetch fresh HTML, JS chunks, CSS, and layouts
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    if (latestVersion.value) {
      dismissedVersion.value = latestVersion.value;
    }
    hasUpdate.value = false;
  };

  const handleVisibilityChange = () => {
    if (process.client && document.visibilityState === 'visible') {
      checkForUpdates();
    }
  };

  const startPeriodicCheck = (intervalMs = 60000) => {
    if (!process.client) return () => {};

    // Initial check after short delay so it does not compete with critical page hydration
    initialTimerId = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    // Periodic timer
    if (!intervalId) {
      intervalId = setInterval(() => {
        checkForUpdates();
      }, intervalMs);
    }

    // Check when user brings tab to foreground
    if (!isVisibilityListenerAttached) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      isVisibilityListenerAttached = true;
    }

    // Return cleanup callback
    return () => {
      if (initialTimerId) {
        clearTimeout(initialTimerId);
        initialTimerId = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (isVisibilityListenerAttached) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        isVisibilityListenerAttached = false;
      }
    };
  };

  return {
    currentVersion: readonly(currentVersion),
    latestVersion: readonly(latestVersion),
    latestBuildTime: readonly(latestBuildTime),
    hasUpdate: readonly(hasUpdate),
    isChecking: readonly(isChecking),
    lastChecked: readonly(lastChecked),
    checkForUpdates,
    refreshApp,
    dismissUpdate,
    startPeriodicCheck
  };
}

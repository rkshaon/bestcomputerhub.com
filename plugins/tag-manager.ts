// File: /plugins/tag-manager.ts
// Loads Google Tag Manager when NUXT_PUBLIC_GTM_ID is set. GA4 is configured
// inside the GTM container; this plugin only bootstraps the dataLayer, loads
// the container and reports SPA page views. Admin routes are never tracked.
import { isTrackedPath } from '@/utils/analytics';

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export default defineNuxtPlugin((nuxtApp) => {
  const gtmId = String(useRuntimeConfig().public.gtmId || '').trim();
  if (!GTM_ID_PATTERN.test(gtmId)) return;

  const router = useRouter();

  if (import.meta.server) {
    if (isTrackedPath(useRoute().path)) {
      useHead({
        noscript: [
          {
            tagPosition: 'bodyOpen',
            innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe>`
          }
        ]
      });
    }
    return;
  }

  const { trackPageView } = useAnalytics();
  let isLoaded = false;
  let lastTrackedPath: string | null = null;

  // Created before any page setup runs so early events queue until GTM loads.
  window.dataLayer = window.dataLayer || [];

  const loadContainer = () => {
    if (isLoaded) return;
    isLoaded = true;
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(script);
  };

  const trackRoute = (delayMs: number) => {
    const { path, fullPath } = router.currentRoute.value;
    if (!isTrackedPath(path) || fullPath === lastTrackedPath) return;
    loadContainer();
    lastTrackedPath = fullPath;
    if (delayMs === 0) {
      trackPageView(fullPath);
    } else {
      // Let the head manager apply the new page title before reading it.
      window.setTimeout(() => trackPageView(fullPath), delayMs);
    }
  };

  // The server-rendered title is already correct for the landing page.
  trackRoute(0);
  nuxtApp.hook('page:finish', () => trackRoute(50));
});

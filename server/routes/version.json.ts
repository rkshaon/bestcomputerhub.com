// File: /server/routes/version.json.ts
import { defineEventHandler, setHeaders } from 'h3';

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  setHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Robots-Tag': 'noindex, nofollow'
  });

  return {
    version: config.public.appVersion || '0.0.0',
    buildTime: config.public.buildTime || new Date().toISOString()
  };
});

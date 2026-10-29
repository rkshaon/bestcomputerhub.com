// File: /nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

const buildTime = new Date().toISOString()
const appVersion = process.env.APP_VERSION || process.env.npm_package_version || `v-${Date.now()}`

export default defineNuxtConfig({
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },
  app: {
    head: {
      titleTemplate: '%s | Best Computer Hub',
      title: 'Best Computer Hub | Gaming PC, Laptop & Computer Accessories in Bangladesh',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'description', content: 'Best Computer Hub is your trusted destination for gaming PCs, laptops, computer components, networking devices, accessories, and enterprise hardware in Bangladesh. Shop authentic products at competitive prices with reliable support.' },
        { name: 'brand', content: 'Best Computer Hub' },
        
        // Theme Colors
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#237BEA' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#090d16' },
        { name: 'theme-color', content: '#237BEA' },

        // Open Graph Metadata
        { property: 'og:site_name', content: 'Best Computer Hub' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Best Computer Hub | Gaming PC, Laptop & Computer Accessories in Bangladesh' },
        { property: 'og:description', content: 'Best Computer Hub is your trusted destination for authentic computer hardware, gaming components, laptops, networking equipment, and accessories.' },
        { property: 'og:image', content: '/logo.png' },

        // Twitter Card Metadata
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Best Computer Hub' },
        { name: 'twitter:description', content: 'Gaming PCs, Laptops, Components & Accessories.' },
        { name: 'twitter:image', content: '/logo.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap'
  ],
  // Canonical origin for sitemap <loc> values and the sitemap viewer heading.
  // Override per deployment at runtime with NUXT_PUBLIC_SITE_URL and
  // NUXT_PUBLIC_SITE_NAME (no rebuild needed; empty values are ignored).
  site: {
    url: 'https://best-computers.rkshaon.info',
    name: 'Best Computer Hub',
    trailingSlash: true
  },
  sitemap: {
    // Allowlist only: page files are not auto-listed, so placeholder,
    // private and mock-data routes never leak into the sitemap.
    excludeAppSources: true,
    // Public, indexable static pages with real content.
    urls: [
      '/',
      '/shop-now/',
      '/blog/',
      '/about-us/',
      '/privacy-policy/',
      '/return-refund-after-sales-policy/',
      '/warranty-policy/',
      '/disclaimer/',
      '/digital-commerce-guidelines/'
    ],
    // Products, categories, brands and blog posts from the backend,
    // fetched at request time (see server/api/__sitemap__/urls.ts).
    sources: [
      ['/api/__sitemap__/urls', { timeout: 30000 }]
    ],
    // Rendered sitemap is cached server-side for 10 minutes, then
    // revalidated, so catalog changes appear without a rebuild.
    cacheMaxAgeSeconds: 600
  },
  css: [
    'assets/css/main.css'
  ],
  typescript: {
    strict: true
  },
  sourcemap: {
    client: false,
    server: false
  },
  vite: {
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      include: [
        'clsx',
        'lucide-vue-next',
        'tailwind-merge',
        'vue-sonner'
      ]
    }
  },
  nitro: {
    preset: 'node-server',
    prerender: {
      failOnError: false
    }
  },
  runtimeConfig: {
    public: {
      appUrl: '',
      apiBase: '',
      // Google Tag Manager container ID (NUXT_PUBLIC_GTM_ID). Empty disables tracking.
      gtmId: '',
      appVersion,
      buildTime
    }
  },
  hooks: {
    'build:before': async () => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const publicDir = path.resolve(process.cwd(), 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        fs.writeFileSync(
          path.join(publicDir, 'version.json'),
          JSON.stringify({ version: appVersion, buildTime }, null, 2),
          'utf-8'
        )
      } catch {
        // Ignore fallback if filesystem is read-only
      }
    }
  },
  compatibilityDate: '2025-11-01',
  routeRules: {
    '/products/**': { redirect: '/shop-now/' },
    '/account/**': { redirect: '/my-account/' }
  }
})

// File: /nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' }
      ]
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  css: [
    '@/assets/css/main.css'
  ],
  typescript: {
    strict: true
  },
  sourcemap: {
    client: false,
    server: false
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'clsx',
        'lucide-vue-next',
        'tailwind-merge'
      ]
    }
  },
  nitro: {
    prerender: {
      failOnError: false
    }
  },
  runtimeConfig: {
    public: {
      appUrl: '',
      apiBase: ''
    }
  },
  compatibilityDate: '2025-11-01'
})

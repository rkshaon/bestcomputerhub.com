import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
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
  compatibilityDate: '2025-11-01'
})

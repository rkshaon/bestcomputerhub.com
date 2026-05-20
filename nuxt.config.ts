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
  nitro: {
    prerender: {
      failOnError: false
    }
  },
  compatibilityDate: '2025-11-01'
})

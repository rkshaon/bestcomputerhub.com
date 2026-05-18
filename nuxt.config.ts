// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap' }
      ]
    }
  },
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
  runtimeConfig: {
    // Private keys
    geminiApiKey: process.env.GEMINI_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL,
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    }
  },
  typescript: {
    strict: true
  }
})

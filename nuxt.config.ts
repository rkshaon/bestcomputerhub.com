// File: /nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
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
        { property: 'og:image', content: '/logo.svg' },

        // Twitter Card Metadata
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Best Computer Hub' },
        { name: 'twitter:description', content: 'Gaming PCs, Laptops, Components & Accessories.' },
        { name: 'twitter:image', content: '/logo.svg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
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

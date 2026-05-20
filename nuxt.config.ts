// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-05-19',
  ssr: false,
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0d0d12' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      htmlAttrs: {
        lang: 'ru',
      },
      link: [
        { rel: 'preconnect', href: '/' },
      ],
    },
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router'],
            'vendor-pinia': ['pinia', '@pinia/nuxt'],
            'vendor-capacitor': ['@capacitor/core'],
          },
        },
      },
    },
    css: {
      devSourcemap: false,
    },
  },
})

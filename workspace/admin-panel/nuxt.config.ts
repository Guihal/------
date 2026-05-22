export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
    },
  },
  imports: {
    dirs: ['stores'],
  },
  app: {
    head: {
      title: 'Admin Panel',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
    },
  },
})

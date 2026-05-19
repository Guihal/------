// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-05-19',
  ssr: false,
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
})

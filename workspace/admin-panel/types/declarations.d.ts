import { useAuthStore as _useAuthStore } from '../app/stores/auth'

declare global {
  const useAuthStore: typeof _useAuthStore
  const definePageMeta: typeof import('nuxt/dist/pages/runtime/composables').definePageMeta
}

export {}

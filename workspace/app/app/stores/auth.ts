import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { AuthResponse, RegisterResponse, User } from '~/types/api'

export const useAuthStore = defineStore('app-auth', () => {
  const token = ref('')
  const refreshToken = ref('')
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')

  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  function setTokens(access: string, refresh: string) {
    token.value = access
    refreshToken.value = refresh
    localStorage.setItem('app_token', access)
    localStorage.setItem('app_refresh_token', refresh)
  }

  function setUser(u: User) {
    user.value = u
    localStorage.setItem('app_user', JSON.stringify(u))
  }

  function clearAuth() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_refresh_token')
    localStorage.removeItem('app_user')
  }

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const res = await $fetch<AuthResponse>('/auth/login', {
        baseURL,
        method: 'POST',
        body: { email, password },
      })
      setTokens(res.access_token, res.refresh_token)
      setUser(res.user)
      return true
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка входа'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      await $fetch<RegisterResponse>('/auth/register', {
        baseURL,
        method: 'POST',
        body: { email, password },
      })
      return true
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка регистрации'
      return false
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<boolean> {
    if (!refreshToken.value) return false
    try {
      const res = await $fetch<AuthResponse>('/auth/refresh', {
        baseURL,
        method: 'POST',
        body: { refresh_token: refreshToken.value },
      })
      setTokens(res.access_token, res.refresh_token)
      if (res.user) setUser(res.user)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  function logout() {
    clearAuth()
  }

  async function init() {
    const t = localStorage.getItem('app_token')
    const rt = localStorage.getItem('app_refresh_token')
    const u = localStorage.getItem('app_user')
    if (t) token.value = t
    if (rt) refreshToken.value = rt
    if (u) {
      try {
        user.value = JSON.parse(u)
      } catch {
        user.value = null
      }
    }
    if (token.value) {
      try {
        const me = await useApi().fetch<{ id: number; email: string }>('/auth/me')
        setUser(me)
      } catch {
        // token invalid — clear and let caller redirect
        clearAuth()
      }
    }
  }

  return {
    token,
    refreshToken,
    user,
    loading,
    error,
    login,
    register,
    refresh,
    logout,
    init,
  }
})

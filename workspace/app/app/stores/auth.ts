import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('app-auth', () => {
  const token = ref('')
  const userId = ref<number | null>(null)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('app_token', t)
  }

  function setUserId(id: number) {
    userId.value = id
    localStorage.setItem('app_user_id', String(id))
  }

  function logout() {
    token.value = ''
    userId.value = null
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_user_id')
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await $fetch<{
        access_token: string
        user: { id: number }
      }>('/auth/login', {
        baseURL: useRuntimeConfig().public.apiBase as string,
        method: 'POST',
        body: { email, password },
      })
      setToken(res.access_token)
      setUserId(res.user.id)
      return true
    } catch {
      return false
    }
  }

  function init() {
    const t = localStorage.getItem('app_token')
    const id = localStorage.getItem('app_user_id')
    if (t) token.value = t
    if (id) userId.value = Number(id)
  }

  return { token, userId, login, logout, init, setToken, setUserId }
})

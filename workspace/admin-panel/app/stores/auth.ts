import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('admin-auth', () => {
  const token = ref('')
  const role = ref('')

  const isAdmin = computed(() => role.value === 'admin')

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('admin_token', t)
  }

  function setRole(r: string) {
    role.value = r
    localStorage.setItem('admin_role', r)
  }

  function logout() {
    token.value = ''
    role.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_role')
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await $fetch<{ access_token: string; user: { role: string } }>('/auth/login', {
        baseURL: useRuntimeConfig().public.apiBase as string,
        method: 'POST',
        body: { email, password },
      })
      setToken(res.access_token)
      setRole(res.user.role)
      return true
    } catch {
      return false
    }
  }

  function init() {
    const t = localStorage.getItem('admin_token')
    const r = localStorage.getItem('admin_role')
    if (t) token.value = t
    if (r) role.value = r
  }

  return { token, role, isAdmin, login, logout, init, setToken, setRole }
})

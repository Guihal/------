import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'

const storage: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem(key: string) { return storage[key] ?? null },
    setItem(key: string, value: string) { storage[key] = value },
    removeItem(key: string) { delete storage[key] },
    clear() { for (const k of Object.keys(storage)) delete storage[k] },
  },
  writable: true,
})

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('isAdmin returns true for admin role', () => {
    const store = useAuthStore()
    store.setRole('admin')
    expect(store.isAdmin).toBe(true)
  })

  it('isAdmin returns false for user role', () => {
    const store = useAuthStore()
    store.setRole('user')
    expect(store.isAdmin).toBe(false)
  })

  it('token and role persist to localStorage', () => {
    const store = useAuthStore()
    store.setToken('test-token')
    store.setRole('admin')
    expect(localStorage.getItem('admin_token')).toBe('test-token')
    expect(localStorage.getItem('admin_role')).toBe('admin')
  })

  it('logout clears state and localStorage', () => {
    const store = useAuthStore()
    store.setToken('test-token')
    store.setRole('admin')
    store.logout()
    expect(store.token).toBe('')
    expect(store.role).toBe('')
    expect(localStorage.getItem('admin_token')).toBeNull()
    expect(localStorage.getItem('admin_role')).toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockFetch = vi.fn()

const lsStore: Record<string, string> = {}

const localStorageMock: Storage = {
  getItem: (key: string) => lsStore[key] ?? null,
  setItem: (key: string, value: string) => { lsStore[key] = value },
  removeItem: (key: string) => { delete lsStore[key] },
  clear: () => { for (const k in lsStore) delete lsStore[k] },
  key: (i: number) => Object.keys(lsStore)[i] ?? null,
  get length() { return Object.keys(lsStore).length },
}

// @ts-ignore
globalThis.localStorage = localStorageMock
// @ts-ignore
globalThis.useRuntimeConfig = () => ({ public: { apiBase: 'http://localhost:3000' } })
// @ts-ignore
globalThis.useApi = () => ({ fetch: mockFetch })
// @ts-ignore
globalThis.$fetch = mockFetch
// @ts-ignore
globalThis.useAuthStore = () => ({
  token: { value: 'tok' },
  refreshToken: { value: '' },
  user: { value: null },
  loading: { value: false },
  error: { value: '' },
})
// @ts-ignore
globalThis.useRouter = () => ({ push: vi.fn() })
// @ts-ignore
globalThis.useRoute = () => ({ params: {} })
// @ts-ignore
globalThis.navigateTo = vi.fn()
// @ts-ignore
globalThis.defineNuxtRouteMiddleware = (fn: unknown) => fn
// @ts-ignore
globalThis.definePageMeta = () => {}

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ fetch: mockFetch }),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { apiBase: 'http://localhost:3000' } }),
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
  navigateTo: vi.fn(),
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  definePageMeta: () => {},
}))

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('fetchSettings loads settings from server', async () => {
    mockFetch.mockResolvedValue({
      settings: {
        theme: 'dark',
        language: 'en',
        notifications_enabled: false,
        reminder_time: '09:00',
      },
    })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    await store.fetchSettings()

    expect(store.settings).not.toBeNull()
    expect(store.settings!.theme).toBe('dark')
    expect(store.settings!.language).toBe('en')
    expect(store.settings!.notifications_enabled).toBe(false)
    expect(store.settings!.reminder_time).toBe('09:00')
    expect(store.error).toBe('')
  })

  it('saveSettings sends PUT and updates state', async () => {
    mockFetch.mockResolvedValue({
      settings: {
        theme: 'light',
        language: 'ru',
        notifications_enabled: true,
        reminder_time: '10:00',
      },
    })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    const ok = await store.saveSettings({ theme: 'light' })

    expect(ok).toBe(true)
    expect(store.settings!.theme).toBe('light')
    expect(mockFetch).toHaveBeenCalledWith('/settings', expect.objectContaining({
      method: 'PUT',
      body: { theme: 'light' },
    }))
  })

  it('patchSettings sends PATCH and updates state', async () => {
    mockFetch.mockResolvedValue({
      settings: {
        theme: 'system',
        language: 'ru',
        notifications_enabled: false,
        reminder_time: null,
      },
    })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    const ok = await store.patchSettings({ notifications_enabled: false })

    expect(ok).toBe(true)
    expect(store.settings!.notifications_enabled).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith('/settings', expect.objectContaining({
      method: 'PATCH',
      body: { notifications_enabled: false },
    }))
  })

  it('fetchSettings sets error on failure', async () => {
    mockFetch.mockRejectedValue({ data: { detail: 'Сервер недоступен' } })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    await store.fetchSettings()

    expect(store.error).toBe('Сервер недоступен')
    expect(store.settings).toBeNull()
  })

  it('saveSettings sets saveError on failure', async () => {
    mockFetch.mockRejectedValue({ data: { detail: 'Неверные данные' } })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    const ok = await store.saveSettings({ theme: 'invalid' })

    expect(ok).toBe(false)
    expect(store.saveError).toBe('Неверные данные')
  })

  it('clear resets state', async () => {
    mockFetch.mockResolvedValue({
      settings: { theme: 'dark', language: 'en', notifications_enabled: true, reminder_time: '08:00' },
    })

    const { useSettingsStore } = await import('../../app/stores/settings.store')
    const store = useSettingsStore()
    await store.fetchSettings()
    store.clear()

    expect(store.settings).toBeNull()
    expect(store.error).toBe('')
    expect(store.saveError).toBe('')
  })
})

describe('visual store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('fetchVisual loads visual state from server', async () => {
    mockFetch.mockResolvedValue({
      display_name: 'Test User',
      avatar_url: 'http://example.com/avatar.png',
      xp: 150,
      level: 3,
      equipped_item: {
        id: 1,
        name: 'Меч',
        rarity: 'rare',
        asset_url: 'http://example.com/sword.png',
      },
    })

    const { useVisualStore } = await import('../../app/stores/visual.store')
    const store = useVisualStore()
    await store.fetchVisual()

    expect(store.visual).not.toBeNull()
    expect(store.visual!.display_name).toBe('Test User')
    expect(store.visual!.xp).toBe(150)
    expect(store.visual!.level).toBe(3)
    expect(store.visual!.equipped_item).not.toBeNull()
    expect(store.visual!.equipped_item!.name).toBe('Меч')
    expect(store.error).toBe('')
  })

  it('fetchVisual handles null equipped_item', async () => {
    mockFetch.mockResolvedValue({
      display_name: 'User',
      avatar_url: null,
      xp: 0,
      level: 1,
      equipped_item: null,
    })

    const { useVisualStore } = await import('../../app/stores/visual.store')
    const store = useVisualStore()
    await store.fetchVisual()

    expect(store.visual!.equipped_item).toBeNull()
    expect(store.visual!.avatar_url).toBeNull()
  })

  it('fetchVisual sets error on failure', async () => {
    mockFetch.mockRejectedValue({ data: { detail: 'Ошибка сервера' } })

    const { useVisualStore } = await import('../../app/stores/visual.store')
    const store = useVisualStore()
    await store.fetchVisual()

    expect(store.error).toBe('Ошибка сервера')
    expect(store.visual).toBeNull()
  })

  it('clear resets state', async () => {
    mockFetch.mockResolvedValue({
      display_name: 'User',
      avatar_url: null,
      xp: 10,
      level: 1,
      equipped_item: null,
    })

    const { useVisualStore } = await import('../../app/stores/visual.store')
    const store = useVisualStore()
    await store.fetchVisual()
    store.clear()

    expect(store.visual).toBeNull()
    expect(store.error).toBe('')
  })
})

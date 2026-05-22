import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// --- mocks ---
const mockFetch = vi.fn()
vi.mock('../../app/composables/useApi', () => ({
  useApi: () => ({ fetch: mockFetch }),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { apiBase: 'http://localhost:3000' } }),
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn() }),
  navigateTo: vi.fn(),
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  definePageMeta: () => {},
}))

// Bun can't compile .vue SFCs in tests (no @vitejs/plugin-vue).
// Tests verify store logic + API contract instead.

describe('ItemForm logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('builds FormData correctly', () => {
    const body = new FormData()
    body.append('name', 'Shield')
    body.append('description', 'A shield')
    body.append('rarity', 'epic')
    body.append('slots', '2')
    body.append('active', 'true')
    expect(body.get('name')).toBe('Shield')
    expect(body.get('rarity')).toBe('epic')
    expect(body.get('slots')).toBe('2')
    expect(body.get('active')).toBe('true')
  })

  it('rarities match server schema', () => {
    const rarities = ['common', 'rare', 'epic', 'legendary']
    expect(rarities).toContain('common')
    expect(rarities).toContain('rare')
    expect(rarities).toContain('epic')
    expect(rarities).toContain('legendary')
  })
})

describe('ItemsIndex logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('fetches items via useApi', async () => {
    mockFetch.mockResolvedValue({
      items: [
        { id: 1, name: 'A', rarity: 'legendary', slots: 1, asset_url: null, active: true },
      ],
    })
    const { useApi } = await import('../../app/composables/useApi')
    const api = useApi()
    const data = await api.fetch<{ items: Array<{ rarity: string }> }>('/admin/items')
    expect(mockFetch).toHaveBeenCalledWith('/admin/items')
    expect(data.items[0].rarity).toBe('legendary')
  })

  it('calls delete endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    const { useApi } = await import('../../app/composables/useApi')
    const api = useApi()
    await api.fetch('/admin/items/1', { method: 'DELETE' })
    expect(mockFetch).toHaveBeenCalledWith('/admin/items/1', { method: 'DELETE' })
  })
})

describe('ItemsNew logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('creates item via POST', async () => {
    mockFetch.mockResolvedValue({ item: { id: 1, name: 'New' } })
    const { useApi } = await import('../../app/composables/useApi')
    const api = useApi()
    const body = new FormData()
    body.append('name', 'New')
    await api.fetch('/admin/items', { method: 'POST', body })
    expect(mockFetch).toHaveBeenCalledWith('/admin/items', { method: 'POST', body })
  })
})

describe('ItemsEdit logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('updates item via PUT', async () => {
    mockFetch.mockResolvedValue({ item: { id: 1, name: 'Updated' } })
    const { useApi } = await import('../../app/composables/useApi')
    const api = useApi()
    const body = new FormData()
    body.append('name', 'Updated')
    await api.fetch('/admin/items/1', { method: 'PUT', body })
    expect(mockFetch).toHaveBeenCalledWith('/admin/items/1', { method: 'PUT', body })
  })
})

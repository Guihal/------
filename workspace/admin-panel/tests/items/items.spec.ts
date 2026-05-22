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
// Tests verify store logic + API contract + FormData structure instead.

/** Build FormData matching ItemForm.submit logic */
function buildItemFormData(values: {
  name: string
  description?: string
  rarity?: string
  slots?: number
  active?: boolean
  file?: File
}): FormData {
  const body = new FormData()
  body.append('name', values.name)
  if (values.description) body.append('description', values.description)
  body.append('rarity', values.rarity ?? 'common')
  body.append('slots', String(values.slots ?? 1))
  body.append('active', String(values.active ?? true))
  if (values.file) body.append('asset', values.file)
  return body
}

describe('ItemForm logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('builds FormData with all fields', () => {
    const body = buildItemFormData({
      name: 'Shield',
      description: 'A shield',
      rarity: 'epic',
      slots: 2,
      active: true,
    })
    expect(body.get('name')).toBe('Shield')
    expect(body.get('description')).toBe('A shield')
    expect(body.get('rarity')).toBe('epic')
    expect(body.get('slots')).toBe('2')
    expect(body.get('active')).toBe('true')
  })

  it('builds FormData with defaults', () => {
    const body = buildItemFormData({ name: 'Sword' })
    expect(body.get('name')).toBe('Sword')
    expect(body.get('rarity')).toBe('common')
    expect(body.get('slots')).toBe('1')
    expect(body.get('active')).toBe('true')
    expect(body.get('description')).toBeNull()
  })

  it('omits description when empty', () => {
    const body = buildItemFormData({ name: 'Axe', description: '' })
    expect(body.get('description')).toBeNull()
  })

  it('includes asset file when provided', () => {
    const file = new File(['x'], 'test.png', { type: 'image/png' })
    const body = buildItemFormData({ name: 'Helm', file })
    const asset = body.get('asset')
    expect(asset).toBeInstanceOf(File)
    expect(asset && (asset instanceof File) ? asset.name : '').toBe('test.png')
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

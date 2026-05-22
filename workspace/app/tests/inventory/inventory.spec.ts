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

describe('inventory store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('fetchInventory loads items', async () => {
    mockFetch.mockResolvedValue({
      items: [
        { id: 1, item_id: 101, name: 'Меч', rarity: 'rare', asset_url: '', quantity: 1, equipped: false },
        { id: 2, item_id: 102, name: 'Щит', rarity: 'common', asset_url: '', quantity: 2, equipped: true },
      ],
    })

    const { useInventoryStore } = await import('../../app/stores/use-inventory.store')
    const store = useInventoryStore()
    await store.fetchInventory()

    expect(store.items.length).toBe(2)
    expect(store.items[0]!.name).toBe('Меч')
    expect(store.equippedItem?.name).toBe('Щит')
  })

  it('equipItem sets equipped flag', async () => {
    mockFetch.mockResolvedValueOnce({
      items: [
        { id: 1, item_id: 101, name: 'Меч', rarity: 'rare', asset_url: '', quantity: 1, equipped: false },
        { id: 2, item_id: 102, name: 'Щит', rarity: 'common', asset_url: '', quantity: 1, equipped: false },
      ],
    })
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { useInventoryStore } = await import('../../app/stores/use-inventory.store')
    const store = useInventoryStore()
    await store.fetchInventory()
    await store.equipItem(101)

    expect(store.items[0]!.equipped).toBe(true)
    expect(store.items[1]!.equipped).toBe(false)
    expect(store.equippedItem?.item_id).toBe(101)
  })

  it('unequipAll clears equipped flag', async () => {
    mockFetch.mockResolvedValueOnce({
      items: [
        { id: 1, item_id: 101, name: 'Меч', rarity: 'rare', asset_url: '', quantity: 1, equipped: true },
      ],
    })
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { useInventoryStore } = await import('../../app/stores/use-inventory.store')
    const store = useInventoryStore()
    await store.fetchInventory()
    expect(store.equippedItem).not.toBeNull()

    await store.unequipAll()
    expect(store.equippedItem).toBeNull()
    expect(store.items[0]!.equipped).toBe(false)
  })

  it('fetchInventory sets error on failure', async () => {
    mockFetch.mockRejectedValue({ data: { detail: 'Сервер недоступен' } })

    const { useInventoryStore } = await import('../../app/stores/use-inventory.store')
    const store = useInventoryStore()
    await store.fetchInventory()

    expect(store.error).toBe('Сервер недоступен')
    expect(store.items.length).toBe(0)
  })
})

describe('reward store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('open sets show and payload', async () => {
    const { useRewardStore } = await import('../../app/stores/use-reward.store')
    const store = useRewardStore()

    store.open({
      xpGained: 50,
      drop: { item_id: 1, name: 'Кольцо', rarity: 'epic' },
    })

    expect(store.show).toBe(true)
    expect(store.payload?.xpGained).toBe(50)
    expect(store.payload?.drop?.name).toBe('Кольцо')
  })

  it('close clears show and payload', async () => {
    const { useRewardStore } = await import('../../app/stores/use-reward.store')
    const store = useRewardStore()

    store.open({ xpGained: 10 })
    store.close()

    expect(store.show).toBe(false)
    expect(store.payload).toBeNull()
  })
})

describe('task store completeTask with reward', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('completeTask returns reward payload', async () => {
    mockFetch.mockResolvedValue({
      task: { id: 1, title: 'T', status: 'completed', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
      xp_gained: 100,
      reward: {
        drop: { item_id: 5, name: 'Меч', rarity: 'rare' },
        level: { item_id: 6, name: 'Корона', rarity: 'legendary' },
      },
    })

    const { useTaskStore } = await import('../../app/stores/task')
    const store = useTaskStore()
    const result = await store.completeTask(1)

    expect(result.xp_gained).toBe(100)
    expect(result.reward.drop?.name).toBe('Меч')
    expect(result.reward.level?.name).toBe('Корона')
  })

  it('completeTask works without drop or level reward', async () => {
    mockFetch.mockResolvedValue({
      task: { id: 1, title: 'T', status: 'completed', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
      xp_gained: 10,
      reward: {},
    })

    const { useTaskStore } = await import('../../app/stores/task')
    const store = useTaskStore()
    const result = await store.completeTask(1)

    expect(result.xp_gained).toBe(10)
    expect(result.reward.drop).toBeUndefined()
    expect(result.reward.level).toBeUndefined()
  })
})

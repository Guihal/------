import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// --- mocks ---
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
  token: { value: '' },
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

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
    for (const k in lsStore) delete lsStore[k]
  })

  it('init hydrates user from localStorage when no token', async () => {
    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    await auth.init()
    expect(auth.token).toBe('')
    expect(auth.user).toBeNull()
  })

  it('init calls /auth/me when token exists and sets user', async () => {
    lsStore['app_token'] = 'tok123'
    mockFetch.mockResolvedValue({ id: 1, email: 'a@b.c' })

    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    await auth.init()

    expect(auth.token).toBe('tok123')
    expect(auth.user).toEqual({ id: 1, email: 'a@b.c' })
    expect(lsStore['app_user']).toBe('{"id":1,"email":"a@b.c"}')
  })

  it('init clears auth on /auth/me 401', async () => {
    lsStore['app_token'] = 'bad'
    mockFetch.mockRejectedValue({ status: 401 })

    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    await auth.init()

    expect(auth.token).toBe('')
    expect(auth.user).toBeNull()
    expect(lsStore['app_token']).toBeUndefined()
  })

  it('init keeps auth on network/500 error', async () => {
    lsStore['app_token'] = 'good'
    mockFetch.mockRejectedValue(new Error('network'))

    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    await auth.init()

    expect(auth.token).toBe('good')
    expect(lsStore['app_token']).toBe('good')
  })

  it('login sets tokens and user', async () => {
    mockFetch.mockResolvedValue({
      access_token: 'acc',
      refresh_token: 'ref',
      token_type: 'bearer',
      expires_in: 3600,
      user: { id: 2, email: 'u@x.y' },
    })

    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    const ok = await auth.login('u@x.y', 'pw')

    expect(ok).toBe(true)
    expect(auth.token).toBe('acc')
    expect(auth.user).toEqual({ id: 2, email: 'u@x.y' })
  })

  it('logout clears everything', async () => {
    lsStore['app_token'] = 'x'
    lsStore['app_user'] = '{"id":1}'

    const { useAuthStore } = await import('../app/stores/auth')
    const auth = useAuthStore()
    auth.logout()

    expect(auth.token).toBe('')
    expect(auth.user).toBeNull()
    expect(lsStore['app_token']).toBeUndefined()
  })
})

describe('task store computed groups', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('groups tasks by status and deadline', async () => {
    mockFetch.mockResolvedValue({
      tasks: [
        { id: 1, title: 'Overdue', status: 'pending', priority: 'high', due_at: '2000-01-01T00:00:00Z', created_at: 'x', updated_at: 'x', description: null },
        { id: 2, title: 'Upcoming', status: 'pending', priority: 'normal', due_at: '2099-01-01T00:00:00Z', created_at: 'x', updated_at: 'x', description: null },
        { id: 3, title: 'No deadline', status: 'pending', priority: 'low', due_at: null, created_at: 'x', updated_at: 'x', description: null },
        { id: 4, title: 'Done', status: 'completed', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
        { id: 5, title: 'Archived', status: 'archived', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
      ],
    })

    const { useTaskStore } = await import('../app/stores/task')
    const store = useTaskStore()
    await store.fetchTasks()

    expect(store.overdue.length).toBe(1)
    expect(store.overdue[0]!.title).toBe('Overdue')

    expect(store.upcoming.length).toBe(1)
    expect(store.upcoming[0]!.title).toBe('Upcoming')

    expect(store.noDeadline.length).toBe(1)
    expect(store.noDeadline[0]!.title).toBe('No deadline')

    expect(store.completed.length).toBe(1)
    expect(store.completed[0]!.title).toBe('Done')

    expect(store.archived.length).toBe(1)
    expect(store.archived[0]!.title).toBe('Archived')
  })

  it('createTask prepends to list', async () => {
    mockFetch.mockResolvedValue({
      task: { id: 10, title: 'New', status: 'pending', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
    })

    const { useTaskStore } = await import('../app/stores/task')
    const store = useTaskStore()
    const task = await store.createTask({ title: 'New' })

    expect(task.title).toBe('New')
    expect(store.tasks.length).toBe(1)
    expect(store.tasks[0]!.id).toBe(10)
  })

  it('completeTask updates status', async () => {
    mockFetch.mockResolvedValueOnce({
      tasks: [{ id: 1, title: 'T', status: 'pending', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null }],
    })
    mockFetch.mockResolvedValueOnce({
      task: { id: 1, title: 'T', status: 'completed', priority: 'normal', due_at: null, created_at: 'x', updated_at: 'x', description: null },
    })

    const { useTaskStore } = await import('../app/stores/task')
    const store = useTaskStore()
    await store.fetchTasks()
    await store.completeTask(1)

    expect(store.tasks[0]!.status).toBe('completed')
  })
})

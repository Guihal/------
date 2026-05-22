import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { VisualState } from '~/types/api'

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object' &&
    (error as { data?: { detail?: unknown } }).data !== null &&
    typeof (error as { data?: { detail?: unknown } }).data?.detail === 'string'
  ) {
    return (error as { data: { detail: string } }).data.detail
  }
  return fallback
}

export const useVisualStore = defineStore('app-visual', () => {
  const visual = ref<VisualState | null>(null)
  const loading = ref(false)
  const error = ref('')

  const api = useApi()

  async function fetchVisual() {
    loading.value = true
    error.value = ''
    try {
      visual.value = await api.fetch<VisualState>('/visual-state')
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка загрузки визуального состояния')
    } finally {
      loading.value = false
    }
  }

  function clear() {
    visual.value = null
    error.value = ''
  }

  return {
    visual,
    loading,
    error,
    fetchVisual,
    clear,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings, SettingsResponse } from '~/types/api'

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

export const useSettingsStore = defineStore('app-settings', () => {
  const settings = ref<AppSettings | null>(null)
  const loading = ref(false)
  const error = ref('')
  const saveError = ref('')

  const api = useApi()

  async function fetchSettings() {
    loading.value = true
    error.value = ''
    try {
      const data = await api.fetch<SettingsResponse>('/settings')
      settings.value = data.settings
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка загрузки настроек')
    } finally {
      loading.value = false
    }
  }

  async function saveSettings(payload: Partial<AppSettings>) {
    saveError.value = ''
    try {
      const data = await api.fetch<SettingsResponse>('/settings', {
        method: 'PUT',
        body: payload,
      })
      settings.value = data.settings
      return true
    } catch (e: unknown) {
      saveError.value = getErrorMessage(e, 'Ошибка сохранения настроек')
      return false
    }
  }

  async function patchSettings(payload: Partial<AppSettings>) {
    saveError.value = ''
    try {
      const data = await api.fetch<SettingsResponse>('/settings', {
        method: 'PATCH',
        body: payload,
      })
      settings.value = data.settings
      return true
    } catch (e: unknown) {
      saveError.value = getErrorMessage(e, 'Ошибка сохранения настроек')
      return false
    }
  }

  function clear() {
    settings.value = null
    error.value = ''
    saveError.value = ''
  }

  return {
    settings,
    loading,
    error,
    saveError,
    fetchSettings,
    saveSettings,
    patchSettings,
    clear,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Profile, Progression } from '~/types/api'

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

export const useProfileStore = defineStore('app-profile', () => {
  const profile = ref<Profile | null>(null)
  const progression = ref<Progression | null>(null)
  const loading = ref(false)
  const error = ref('')

  const api = useApi()

  async function fetchProfile() {
    loading.value = true
    error.value = ''
    try {
      profile.value = await api.fetch<Profile>('/profile')
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка загрузки профиля')
    } finally {
      loading.value = false
    }
  }

  async function fetchProgression() {
    loading.value = true
    error.value = ''
    try {
      progression.value = await api.fetch<Progression>('/progression')
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка загрузки прогресса')
    } finally {
      loading.value = false
    }
  }

  function clear() {
    profile.value = null
    progression.value = null
    error.value = ''
  }

  return {
    profile,
    progression,
    loading,
    error,
    fetchProfile,
    fetchProgression,
    clear,
  }
})

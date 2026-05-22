import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Profile, Progression } from '~/types/api'

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
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка загрузки профиля'
    } finally {
      loading.value = false
    }
  }

  async function fetchProgression() {
    try {
      progression.value = await api.fetch<Progression>('/progression')
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка загрузки прогресса'
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

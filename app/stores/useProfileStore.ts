import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Profile } from "../../core/domain/profile/types"
import type { Progression } from "../../core/domain/progression/types"

export const useProfileStore = defineStore("profile", () => {
  const profile = ref<Profile | null>(null)
  const progression = ref<Progression | null>(null)

  const isLoaded = computed(() => profile.value !== null && progression.value !== null)

  function setProfile(p: Profile) {
    profile.value = p
  }

  function setProgression(p: Progression) {
    progression.value = p
  }

  return {
    profile,
    progression,
    isLoaded,
    setProfile,
    setProgression,
  }
})

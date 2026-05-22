import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RewardDrop, RewardLevelUp } from '~/types/api'

export interface RewardPayload {
  xpGained: number
  drop?: RewardDrop
  level?: RewardLevelUp
}

export const useRewardStore = defineStore('app-rewards', () => {
  const show = ref(false)
  const payload = ref<RewardPayload | null>(null)

  function open(reward: RewardPayload) {
    payload.value = reward
    show.value = true
  }

  function close() {
    show.value = false
    payload.value = null
  }

  return {
    show,
    payload,
    open,
    close,
  }
})

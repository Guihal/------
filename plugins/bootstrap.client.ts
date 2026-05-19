import { defineNuxtPlugin } from "nuxt/app"
import { bootstrapApp } from "../src/bootstrap/bootstrap-app"
import { useProfileStore } from "../app/stores/useProfileStore"
import { useTaskStore } from "../app/stores/useTaskStore"

export default defineNuxtPlugin(async () => {
  const result = await bootstrapApp()

  if (!result.ok) {
    throw new Error(result.error)
  }

  const profileStore = useProfileStore()
  const taskStore = useTaskStore()

  profileStore.setProfile(result.state.profile)
  profileStore.setProgression(result.state.progression)
  taskStore.setTasks(result.state.tasks)
})

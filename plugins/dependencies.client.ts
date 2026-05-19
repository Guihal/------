import { provideAppDependencies, getAppDependencies } from "../infrastructure/di/provide-app-dependencies"
import { bootstrapDependencies } from "../infrastructure/di/bootstrap-app"
import { defineNuxtPlugin } from "nuxt/app"

export default defineNuxtPlugin(async () => {
  const existing = getAppDependencies()
  if (existing) {
    return { provide: { appDependencies: existing } }
  }

  const deps = await bootstrapDependencies()
  provideAppDependencies(deps)
  return {
    provide: {
      appDependencies: deps,
    },
  }
})

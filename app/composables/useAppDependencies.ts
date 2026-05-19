import type { AppDependencies } from "../../infrastructure/di/app-dependencies"
import { getAppDependencies } from "../../infrastructure/di/provide-app-dependencies"

export function useAppDependencies(): AppDependencies {
  const deps = getAppDependencies()
  if (deps === undefined) {
    throw new Error("AppDependencies not bootstrapped — ensure plugins/dependencies.client.ts runs before UI mount")
  }
  return deps
}

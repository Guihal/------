import type { AppDependencies } from "../../infrastructure/di/app-dependencies"
import { getAppDependencies } from "../../infrastructure/di/provide-app-dependencies"

export function useAppDependencies(): AppDependencies | undefined {
  return getAppDependencies()
}

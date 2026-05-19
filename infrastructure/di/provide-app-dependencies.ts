import type { AppDependencies } from "./app-dependencies"

const APP_DEPS_KEY = "app-dependencies"

export function provideAppDependencies(deps: AppDependencies): void {
  if (typeof window !== "undefined") {
    ;(window as unknown as Record<string, unknown>)[APP_DEPS_KEY] = deps
  }
}

export function getAppDependencies(): AppDependencies | undefined {
  if (typeof window !== "undefined") {
    return (window as unknown as Record<string, unknown>)[APP_DEPS_KEY] as AppDependencies | undefined
  }
  return undefined
}

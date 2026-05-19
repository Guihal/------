import type { AppDependencies } from "./app-dependencies"

const APP_DEPS_KEY = "app-dependencies"

export function provideAppDependencies(deps: AppDependencies): void {
  if (typeof window !== "undefined") {
    const prev = (window as unknown as Record<string, unknown>)[APP_DEPS_KEY] as
      | AppDependencies
      | undefined
    if (prev && "ports" in prev) {
      const uow = prev.ports.unitOfWork as { close?: () => Promise<void> } | undefined
      if (uow?.close) {
        void uow.close()
      }
    }
    ;(window as unknown as Record<string, unknown>)[APP_DEPS_KEY] = deps
  }
}

export function getAppDependencies(): AppDependencies | undefined {
  if (typeof window !== "undefined") {
    return (window as unknown as Record<string, unknown>)[APP_DEPS_KEY] as AppDependencies | undefined
  }
  return undefined
}

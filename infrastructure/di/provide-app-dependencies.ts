import type { AppDependencies } from "./app-dependencies"

const APP_DEPS_KEY = "app-dependencies"

function hasClose(uow: unknown): uow is { close: () => unknown } {
  return (
    uow !== null &&
    uow !== undefined &&
    typeof (uow as Record<string, unknown>).close === "function"
  )
}

export function provideAppDependencies(deps: AppDependencies): void {
  const prev = (globalThis as unknown as Record<string, unknown>)[APP_DEPS_KEY] as
    | AppDependencies
    | undefined
  if (prev && "ports" in prev && hasClose(prev.ports.unitOfWork)) {
    void prev.ports.unitOfWork.close()
  }
  ;(globalThis as unknown as Record<string, unknown>)[APP_DEPS_KEY] = deps
}

export function getAppDependencies(): AppDependencies | undefined {
  return (globalThis as unknown as Record<string, unknown>)[APP_DEPS_KEY] as AppDependencies | undefined
}

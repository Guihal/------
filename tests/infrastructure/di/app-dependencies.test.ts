import { describe, it, expect, beforeEach, afterEach } from "vitest"
import type { AppDependencies } from "../../../infrastructure/di/app-dependencies"
import { provideAppDependencies, getAppDependencies } from "../../../infrastructure/di/provide-app-dependencies"
import { useAppDependencies } from "../../../app/composables/useAppDependencies"

describe("AppDependencies DI", () => {
  let originalWindow: unknown

  beforeEach(() => {
    originalWindow = (globalThis as unknown as Record<string, unknown>).window
    ;(globalThis as unknown as Record<string, unknown>).window = {}
  })

  afterEach(() => {
    delete (globalThis as unknown as Record<string, unknown>).window["app-dependencies"]
    ;(globalThis as unknown as Record<string, unknown>).window = originalWindow
  })

  it("provideAppDependencies stores deps on window", () => {
    const fakeDeps = { ports: {} } as unknown as AppDependencies
    provideAppDependencies(fakeDeps)
    expect(getAppDependencies()).toBe(fakeDeps)
  })

  it("getAppDependencies returns undefined when not set", () => {
    expect(getAppDependencies()).toBeUndefined()
  })

  it("useAppDependencies returns deps when available", () => {
    const fakeDeps = { ports: {} } as unknown as AppDependencies
    provideAppDependencies(fakeDeps)
    expect(useAppDependencies()).toBe(fakeDeps)
  })

  it("useAppDependencies throws when deps not bootstrapped", () => {
    expect(() => useAppDependencies()).toThrow(
      "AppDependencies not bootstrapped",
    )
  })
})

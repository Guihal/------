import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { AppDependencies } from "../../../infrastructure/di/app-dependencies"
import { provideAppDependencies, getAppDependencies } from "../../../infrastructure/di/provide-app-dependencies"
import { useAppDependencies } from "../../../app/composables/useAppDependencies"
import { bootstrapDependencies, _resetBootstrapPromise } from "../../../plugins/dependencies.client"
import { MemoryUnitOfWork } from "../../../infrastructure/memory/unit-of-work/memory-unit-of-work"

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

describe("bootstrapDependencies", () => {
  let originalWindow: unknown

  beforeEach(() => {
    originalWindow = (globalThis as unknown as Record<string, unknown>).window
    ;(globalThis as unknown as Record<string, unknown>).window = {}
    _resetBootstrapPromise()
  })

  afterEach(() => {
    ;(globalThis as unknown as Record<string, unknown>).window = originalWindow
    vi.restoreAllMocks()
  })

  it("bootstrapPromise singleton: calling twice returns same promise", async () => {
    const openNative = vi.fn().mockRejectedValue(new Error("no native"))
    const p1 = bootstrapDependencies(openNative)
    const p2 = bootstrapDependencies(openNative)
    expect(p1).toBe(p2)
    await p1
  })

  it("Object.freeze: deps object is frozen", async () => {
    const openNative = vi.fn().mockRejectedValue(new Error("no native"))
    const deps = await bootstrapDependencies(openNative)
    expect(Object.isFrozen(deps)).toBe(true)
  })

  it("Native fallback: when openNativeConnection throws, falls back to MemoryUnitOfWork", async () => {
    const openNative = vi.fn().mockRejectedValue(new Error("no native"))
    const deps = await bootstrapDependencies(openNative)
    expect(deps.ports.unitOfWork).toBeInstanceOf(MemoryUnitOfWork)
  })
})

import { describe, expect, it } from "vitest"
import {
  computeLevel,
  computeProgress,
  XP_PER_LEVEL,
} from "../../../core/domain/progression/compute"

describe("computeLevel", () => {
  it("xp=0 -> level 0", () => {
    expect(computeLevel(0)).toBe(0)
  })

  it("xp=999 -> level 0", () => {
    expect(computeLevel(999)).toBe(0)
  })

  it("xp=1000 -> level 1", () => {
    expect(computeLevel(1000)).toBe(1)
  })

  it("xp=1500 -> level 1", () => {
    expect(computeLevel(1500)).toBe(1)
  })

  it("xp=10000 -> level 10", () => {
    expect(computeLevel(10000)).toBe(10)
  })
})

describe("computeProgress", () => {
  it("xp=0 -> progress 0", () => {
    expect(computeProgress(0)).toBe(0)
  })

  it("xp=999 -> progress 999", () => {
    expect(computeProgress(999)).toBe(999)
  })

  it("xp=1000 -> progress 0", () => {
    expect(computeProgress(1000)).toBe(0)
  })

  it("xp=1500 -> progress 500", () => {
    expect(computeProgress(1500)).toBe(500)
  })

  it("xp=10000 -> progress 0", () => {
    expect(computeProgress(10000)).toBe(0)
  })
})

describe("XP_PER_LEVEL constant", () => {
  it("equals 1000", () => {
    expect(XP_PER_LEVEL).toBe(1000)
  })
})

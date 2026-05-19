import { describe, expect, it } from "vitest"
import {
  BASE_XP,
  computeBaseXp,
  computeFinalXp,
  PRIORITY_BONUS,
} from "../../../core/domain/xp/task-xp"

describe("BASE_XP", () => {
  it("maps complexity to base values", () => {
    expect(BASE_XP.tiny).toBe(10)
    expect(BASE_XP.small).toBe(25)
    expect(BASE_XP.medium).toBe(50)
    expect(BASE_XP.large).toBe(100)
  })
})

describe("PRIORITY_BONUS", () => {
  it("maps priority to bonus multipliers", () => {
    expect(PRIORITY_BONUS.low).toBe(0)
    expect(PRIORITY_BONUS.normal).toBe(0.1)
    expect(PRIORITY_BONUS.high).toBe(0.25)
  })
})

describe("computeBaseXp", () => {
  const cases: ["tiny" | "small" | "medium" | "large", "low" | "normal" | "high", number][] = [
    ["tiny", "low", 10],
    ["tiny", "normal", 11],
    ["tiny", "high", 13],
    ["small", "low", 25],
    ["small", "normal", 28],
    ["small", "high", 31],
    ["medium", "low", 50],
    ["medium", "normal", 55],
    ["medium", "high", 63],
    ["large", "low", 100],
    ["large", "normal", 110],
    ["large", "high", 125],
  ]

  it.each(cases)("complexity=%s priority=%s → %i", (complexity, priority, expected) => {
    expect(computeBaseXp(complexity, priority)).toBe(expected)
  })

  it("defaults priority to normal when undefined", () => {
    expect(computeBaseXp("small")).toBe(28)
    expect(computeBaseXp("medium")).toBe(55)
  })
})

describe("computeFinalXp", () => {
  it("returns baseXp (MVP-0 invariant)", () => {
    expect(computeFinalXp(25)).toBe(25)
    expect(computeFinalXp(100)).toBe(100)
    expect(computeFinalXp(0)).toBe(0)
  })

  it("ignores explicit multipliers (MVP-0 invariant)", () => {
    expect(computeFinalXp(50, 2, 3)).toBe(50)
    expect(computeFinalXp(100, 1.5, 2)).toBe(100)
  })
})

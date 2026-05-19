import { describe, expect, it } from "vitest"
import { suggestTaskComplexity } from "../../core/use-cases/suggest-task-complexity.use-case"

describe("suggestTaskComplexity", () => {
  const base = {
    title: "Test",
    description: null,
    priority: "normal" as const,
    dueAt: null,
  }

  it("rule 1: high + description + dueAt → large", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        priority: "high",
        description: "Some description",
        dueAt: "2026-05-20T00:00:00Z",
      }),
    ).toBe("large")
  })

  it("rule 2: high priority without desc/dueAt → medium", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        priority: "high",
      }),
    ).toBe("medium")
  })

  it("rule 3: title > 60 chars → medium", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        title: "a".repeat(61),
      }),
    ).toBe("medium")
  })

  it("rule 3: description > 160 chars → medium", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        description: "b".repeat(161),
      }),
    ).toBe("medium")
  })

  it("rule 4: title > 20 chars → small", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        title: "a".repeat(21),
      }),
    ).toBe("small")
  })

  it("rule 4: description exists → small", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        description: "Short desc",
      }),
    ).toBe("small")
  })

  it("rule 5: fallback → tiny", () => {
    expect(
      suggestTaskComplexity({
        ...base,
        title: "Short",
      }),
    ).toBe("tiny")
  })

  it("rule 1 takes precedence over rule 3", () => {
    expect(
      suggestTaskComplexity({
        title: "a".repeat(61),
        priority: "high",
        description: "desc",
        dueAt: "2026-05-20T00:00:00Z",
      }),
    ).toBe("large")
  })

  it("rule 2 takes precedence over rule 3", () => {
    expect(
      suggestTaskComplexity({
        title: "a".repeat(61),
        priority: "high",
        description: null,
        dueAt: null,
      }),
    ).toBe("medium")
  })
})

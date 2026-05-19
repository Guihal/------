import type { TaskComplexity } from "../domain/task/types"

export type SuggestTaskComplexityInput = {
  readonly title: string
  readonly description: string | null
  readonly priority: "low" | "normal" | "high"
  readonly dueAt: string | null
}

export function suggestTaskComplexity(
  input: SuggestTaskComplexityInput,
): TaskComplexity {
  const hasDescription = input.description !== null && input.description.length > 0
  const hasDueAt = input.dueAt !== null

  if (input.priority === "high" && hasDescription && hasDueAt) {
    return "large"
  }

  if (input.priority === "high") {
    return "medium"
  }

  if (input.title.length > 60 || (hasDescription && (input.description?.length ?? 0) > 160)) {
    return "medium"
  }

  if (input.title.length > 20 || hasDescription) {
    return "small"
  }

  return "tiny"
}

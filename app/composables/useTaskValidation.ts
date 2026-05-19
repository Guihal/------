const MAX_TITLE = 100
const MAX_DESCRIPTION = 2000

export type TaskValidationResult =
  | { ok: true }
  | { ok: false; error: string }

export function useTaskValidation() {
  function validateTitle(title: string): TaskValidationResult {
    const t = title.trim()
    if (t.length === 0) return { ok: false, error: "Title is required" }
    if (t.length > MAX_TITLE) return { ok: false, error: `Title must be ≤${MAX_TITLE} chars` }
    return { ok: true }
  }

  function validateDescription(description: string | null): TaskValidationResult {
    if (description && description.length > MAX_DESCRIPTION) {
      return { ok: false, error: `Description must be ≤${MAX_DESCRIPTION} chars` }
    }
    return { ok: true }
  }

  return { validateTitle, validateDescription, MAX_TITLE, MAX_DESCRIPTION }
}

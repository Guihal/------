import type { Difficulty, Category, Size, CreateTaskInput, UpdateTaskInput } from "../../db/task-types.ts";

function isDifficulty(v: unknown): v is Difficulty {
  return v === "low" || v === "normal" || v === "high";
}

function isCategory(v: unknown): v is Category {
  return v === "general" || v === "work" || v === "personal" || v === "health";
}

function isSize(v: unknown): v is Size {
  return v === "tiny" || v === "small" || v === "medium" || v === "large";
}

function isValidBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function validateTitle(value: unknown): string | { error: string } {
  if (typeof value !== "string" || value.length < 1 || value.length > 200) {
    return { error: "title required (1-200 chars)" };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return { error: "title cannot be empty" };
  return trimmed;
}

function validateOptionalDescription(value: unknown): string | undefined | { error: string } {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > 2000) {
    return { error: "description max 2000 chars" };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return { error: "description cannot be empty" };
  return trimmed;
}

function validateOptionalDifficulty(value: unknown): Difficulty | undefined | { error: string } {
  if (value === undefined) return undefined;
  if (!isDifficulty(value)) return { error: "difficulty must be low|normal|high" };
  return value;
}

function validateOptionalCategory(value: unknown): Category | undefined | { error: string } {
  if (value === undefined) return undefined;
  if (!isCategory(value)) return { error: "category must be general|work|personal|health" };
  return value;
}

function validateOptionalSize(value: unknown): Size | undefined | { error: string } {
  if (value === undefined) return undefined;
  if (!isSize(value)) return { error: "size must be tiny|small|medium|large" };
  return value;
}

function validateDeadline(value: unknown, requireFuture: boolean): Date | null | undefined | { error: string } {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const ds = typeof value === "string" ? value : String(value);
  const d = new Date(ds);
  if (isNaN(d.getTime())) return { error: "invalid deadline" };
  const now = new Date();
  const maxFuture = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
  if (requireFuture && d < now) return { error: "deadline must be in the future" };
  if (d > maxFuture) return { error: "deadline too far in the future" };
  return d;
}

export function parseCreateTask(body: unknown): CreateTaskInput | { error: string } {
  if (!isValidBody(body)) return { error: "Invalid body" };

  const title = validateTitle(body.title);
  if (typeof title !== "string") return title;

  const out: CreateTaskInput = { title };

  const description = validateOptionalDescription(body.description);
  if (typeof description === "object") return description;
  if (description !== undefined) out.description = description;

  const difficulty = validateOptionalDifficulty(body.difficulty);
  if (typeof difficulty === "object") return difficulty;
  if (difficulty !== undefined) out.difficulty = difficulty;

  const category = validateOptionalCategory(body.category);
  if (typeof category === "object") return category;
  if (category !== undefined) out.category = category;

  const size = validateOptionalSize(body.size);
  if (typeof size === "object") return size;
  if (size !== undefined) out.size = size;

  const deadline = validateDeadline(body.deadline, true);
  if (deadline !== undefined && deadline !== null && typeof deadline === "object" && "error" in deadline) return deadline;
  if (deadline !== undefined) out.deadline = deadline;

  return out;
}

export function parseUpdateTask(body: unknown): UpdateTaskInput | { error: string } {
  if (!isValidBody(body)) return { error: "Invalid body" };

  const out: UpdateTaskInput = {};

  if (body.title !== undefined) {
    const title = validateTitle(body.title);
    if (typeof title !== "string") return title;
    out.title = title;
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      out.description = null;
    } else {
      const description = validateOptionalDescription(body.description);
      if (typeof description === "object") return description;
      if (description !== undefined) out.description = description;
    }
  }

  const difficulty = validateOptionalDifficulty(body.difficulty);
  if (typeof difficulty === "object") return difficulty;
  if (difficulty !== undefined) out.difficulty = difficulty;

  const category = validateOptionalCategory(body.category);
  if (typeof category === "object") return category;
  if (category !== undefined) out.category = category;

  const size = validateOptionalSize(body.size);
  if (typeof size === "object") return size;
  if (size !== undefined) out.size = size;

  const deadline = validateDeadline(body.deadline, false);
  if (deadline !== undefined && deadline !== null && typeof deadline === "object" && "error" in deadline) return deadline;
  if (deadline !== undefined) out.deadline = deadline;

  if (Object.keys(out).length === 0) return { error: "no fields to update" };
  return out;
}

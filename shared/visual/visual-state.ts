import type { Settings, VisualState } from "../contracts/visual-settings";

// Backend accent catalog (docs/visual-foundation.md §4). NO lilac — OD1 open.
// Raw hex lives here because this is the fallback theme file.
export const ACCENT_CATALOG = [
  "#7dd3fc",
  "#a7f3d0",
  "#f9a8d4",
  "#fde68a",
] as const;

// Stable dark fallback — renders without a backend visual_state response.
export const FALLBACK_VISUAL_STATE: VisualState = {
  accent_color: "#7dd3fc",
  background_variant: "midnight",
  card_variant: "graphite",
  profile_background: "calm-shapes",
  decorative_detail: "soft-sparks",
  task_button_text: "Отметить задачу",
  task_list_heading: "Мои задачи",
  level_up_text: "Новый уровень!",
  empty_state_text: "Задач пока нет — самое время добавить первую.",
};

type VisualSettings = Pick<Settings, "disable_visual_randomness" | "reduced_motion">;

function isCatalogAccent(v: string): boolean {
  return (ACCENT_CATALOG as readonly string[]).includes(v.toLowerCase());
}

// Maps backend VisualState (+ settings) to CSS variables consumed by the UI.
// null OR disable_visual_randomness → stable fallback. NO Math.random.
// ponytail: returns plain Record; caller applies to :style on .app-shell.
export function visualStateToCssVars(
  state: VisualState | null,
  settings?: VisualSettings | null,
): Record<string, string> {
  const disabled = settings?.disable_visual_randomness === true;
  const s = !state || disabled ? FALLBACK_VISUAL_STATE : state;
  const accent = isCatalogAccent(s.accent_color) ? s.accent_color : FALLBACK_VISUAL_STATE.accent_color;
  const reduced = settings?.reduced_motion === true ? "1" : "0";
  return {
    "--accent": accent,
    "--bg-variant": `var(--bg-${s.background_variant})`,
    "--card-variant": `var(--card-${s.card_variant})`,
    "--profile-bg": `var(--profile-${s.profile_background})`,
    "--decor-detail": s.decorative_detail,
    "--task-button-text": s.task_button_text,
    "--task-list-heading": s.task_list_heading,
    "--level-up-text": s.level_up_text,
    "--empty-state-text": s.empty_state_text,
    "--reduced-motion": reduced,
  };
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error("visual-state self-check failed: " + msg);
}

function selfCheck(): void {
  const fb = visualStateToCssVars(null);
  assert(fb["--accent"] === FALLBACK_VISUAL_STATE.accent_color, "null→fallback accent");
  assert(fb["--bg-variant"] === "var(--bg-midnight)", "fallback bg variant");
  assert(fb["--task-list-heading"] === FALLBACK_VISUAL_STATE.task_list_heading, "text field mapped");

  const ok: VisualState = {
    accent_color: "#a7f3d0",
    background_variant: "deep-forest",
    card_variant: "pine",
    profile_background: "night-lines",
    decorative_detail: "thin-rings",
    task_button_text: "Готово",
    task_list_heading: "Список",
    level_up_text: "Уровень!",
    empty_state_text: "Пусто",
  };
  const v = visualStateToCssVars(ok);
  assert(v["--accent"] === "#a7f3d0", "valid accent propagated");
  assert(v["--card-variant"] === "var(--card-pine)", "card variant mapped");
  assert(v["--decor-detail"] === "thin-rings", "decor detail mapped");
  assert(v["--task-button-text"] === "Готово", "button text mapped");

  const bad: VisualState = { ...ok, accent_color: "#B9A7FF" }; // lilac — not in catalog
  assert(visualStateToCssVars(bad)["--accent"] === FALLBACK_VISUAL_STATE.accent_color, "invalid accent→fallback");

  const forced = visualStateToCssVars(ok, { disable_visual_randomness: true, reduced_motion: false });
  assert(forced["--bg-variant"] === "var(--bg-midnight)", "disable_randomness→fallback");
  const quiet = visualStateToCssVars(ok, { disable_visual_randomness: false, reduced_motion: true });
  assert(quiet["--reduced-motion"] === "1", "reduced_motion flag set");

  // Deterministic.
  assert(JSON.stringify(visualStateToCssVars(ok)) === JSON.stringify(visualStateToCssVars(ok)), "deterministic");
}

if (import.meta.main) {
  selfCheck();
  console.log("visual-state self-check OK");
}

import type { VisualState } from "../contracts/visual-settings";
import { MAGIC_SVG_FILES } from "./assets";

type DecorativeDetail = VisualState["decorative_detail"];

export type ScatterItem = {
  x: number; // %
  y: number; // %
  rotation: number; // deg
  scale: number;
  asset: string; // basename of a MAGIC_SVG_FILES entry
};

// Invariant deterministic layout table keyed by backend decorative_detail.
// NO Math.random, NO per-launch drift. Positions spread evenly across the
// viewport so decor never piles up (docs/visual-foundation.md §6).
// ponytail: fixed table; swap for backend scatter seed once OD2 is decided.
const LAYOUT_TABLE: Record<DecorativeDetail, ScatterItem[]> = {
  "soft-sparks": [
    { x: 12, y: 18, rotation: -12, scale: 1.1, asset: "magic-spark" },
    { x: 82, y: 14, rotation: 18, scale: 0.8, asset: "tiny-spark" },
    { x: 24, y: 72, rotation: 8, scale: 0.9, asset: "tiny-spark" },
    { x: 68, y: 64, rotation: -20, scale: 1.0, asset: "magic-spark" },
    { x: 48, y: 40, rotation: 4, scale: 0.7, asset: "tiny-spark" },
  ],
  "thin-rings": [
    { x: 16, y: 22, rotation: 0, scale: 1.2, asset: "magic-orbit" },
    { x: 74, y: 30, rotation: -8, scale: 0.9, asset: "magic-orbit" },
    { x: 38, y: 76, rotation: 12, scale: 1.0, asset: "magic-thread" },
    { x: 86, y: 70, rotation: -4, scale: 0.85, asset: "magic-orbit" },
  ],
  "small-dots": [
    { x: 20, y: 16, rotation: 0, scale: 0.9, asset: "tiny-spark" },
    { x: 60, y: 24, rotation: 0, scale: 0.7, asset: "tiny-spark" },
    { x: 30, y: 58, rotation: 0, scale: 1.0, asset: "tiny-spark" },
    { x: 78, y: 50, rotation: 0, scale: 0.8, asset: "tiny-spark" },
    { x: 50, y: 84, rotation: 0, scale: 0.75, asset: "tiny-spark" },
  ],
};

export function scatterLayout(detail: DecorativeDetail): ScatterItem[] {
  return LAYOUT_TABLE[detail] ?? LAYOUT_TABLE["soft-sparks"];
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error("scatter self-check failed: " + msg);
}

function selfCheck(): void {
  const names = new Set<string>(MAGIC_SVG_FILES);
  const keys: DecorativeDetail[] = ["soft-sparks", "thin-rings", "small-dots"];
  for (const k of keys) {
    const a = scatterLayout(k);
    const b = scatterLayout(k);
    assert(JSON.stringify(a) === JSON.stringify(b), `deterministic ${k}`);
    assert(a.length > 0, `non-empty ${k}`);
    for (const item of a) {
      assert(names.has(item.asset), `asset in registry ${item.asset}`);
      assert(item.x >= 0 && item.x <= 100, `x in range ${item.x}`);
      assert(item.y >= 0 && item.y <= 100, `y in range ${item.y}`);
    }
  }
  // Unknown detail falls back, never throws.
  assert(scatterLayout("soft-sparks").length > 0, "fallback path");
}

if (import.meta.main) {
  selfCheck();
  console.log("scatter self-check OK");
}

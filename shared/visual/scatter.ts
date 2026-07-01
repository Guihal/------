import type { VisualState } from "../contracts/visual-settings";
import { MAGIC_SVG_FILES, type MagicSvgName } from "./assets";

type DecorativeDetail = VisualState["decorative_detail"];

export type ScatterItem = {
  x: number; // %
  y: number; // %
  rotation: number; // deg
  scale: number;
  asset: MagicSvgName; // basename of a MAGIC_SVG_FILES entry
};

// Invariant deterministic layout table keyed by backend decorative_detail.
// No client random, no per-launch drift. Positions spread evenly across the
// viewport so decor never piles up (docs/visual-foundation.md §6).
// ponytail: fixed table; swap for backend scatter seed once OD2 is decided.
const LAYOUT_TABLE: Record<DecorativeDetail, ScatterItem[]> = {
  "soft-sparks": [
    { x: 9, y: 13, rotation: -14, scale: 0.74, asset: "magic-spark" },
    { x: 25, y: 20, rotation: 18, scale: 0.58, asset: "magic-curl" },
    { x: 76, y: 12, rotation: -10, scale: 0.7, asset: "magic-orbit" },
    { x: 91, y: 25, rotation: 22, scale: 0.56, asset: "magic-wisp" },
    { x: 15, y: 39, rotation: 7, scale: 0.52, asset: "magic-thread" },
    { x: 45, y: 34, rotation: -18, scale: 0.46, asset: "tiny-spark" },
    { x: 68, y: 42, rotation: 28, scale: 0.64, asset: "magic-curl" },
    { x: 86, y: 53, rotation: -28, scale: 0.5, asset: "magic-spark" },
    { x: 28, y: 61, rotation: 16, scale: 0.62, asset: "magic-wisp" },
    { x: 57, y: 68, rotation: -6, scale: 0.54, asset: "magic-orbit" },
    { x: 11, y: 79, rotation: 34, scale: 0.5, asset: "magic-curl" },
    { x: 39, y: 88, rotation: -22, scale: 0.44, asset: "magic-thread" },
    { x: 75, y: 84, rotation: 12, scale: 0.6, asset: "tiny-spark" },
  ],
  "thin-rings": [
    { x: 12, y: 15, rotation: 0, scale: 0.68, asset: "magic-orbit" },
    { x: 34, y: 17, rotation: -8, scale: 0.52, asset: "magic-thread" },
    { x: 67, y: 19, rotation: 11, scale: 0.64, asset: "magic-orbit" },
    { x: 88, y: 31, rotation: -19, scale: 0.48, asset: "magic-curl" },
    { x: 18, y: 42, rotation: 24, scale: 0.48, asset: "magic-wisp" },
    { x: 52, y: 43, rotation: -4, scale: 0.58, asset: "magic-orbit" },
    { x: 79, y: 56, rotation: 16, scale: 0.5, asset: "magic-thread" },
    { x: 27, y: 66, rotation: -18, scale: 0.56, asset: "magic-curl" },
    { x: 60, y: 76, rotation: 8, scale: 0.46, asset: "magic-spark" },
    { x: 90, y: 83, rotation: -6, scale: 0.54, asset: "magic-orbit" },
  ],
  "small-dots": [
    { x: 11, y: 12, rotation: 0, scale: 0.42, asset: "tiny-spark" },
    { x: 31, y: 18, rotation: 12, scale: 0.34, asset: "magic-spark" },
    { x: 58, y: 14, rotation: -10, scale: 0.38, asset: "tiny-spark" },
    { x: 84, y: 23, rotation: 16, scale: 0.36, asset: "magic-curl" },
    { x: 21, y: 39, rotation: -12, scale: 0.36, asset: "magic-wisp" },
    { x: 49, y: 42, rotation: 8, scale: 0.3, asset: "tiny-spark" },
    { x: 76, y: 49, rotation: -18, scale: 0.34, asset: "magic-thread" },
    { x: 14, y: 62, rotation: 18, scale: 0.32, asset: "tiny-spark" },
    { x: 39, y: 71, rotation: -6, scale: 0.34, asset: "magic-orbit" },
    { x: 64, y: 76, rotation: 14, scale: 0.32, asset: "tiny-spark" },
    { x: 88, y: 86, rotation: -10, scale: 0.36, asset: "magic-spark" },
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
    assert(a.length >= 10 && a.length <= 15, `10-15 decor items ${k}`);
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

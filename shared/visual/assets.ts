import type { VisualState } from "../contracts/visual-settings";

type DecorativeDetail = VisualState["decorative_detail"];

// Local brand assets. SVGs are currentColor/mask-ready; decorative when rendered.
// ponytail: paths are Nuxt/Vite aliases resolved by the consuming Vue components.
export const BRAND_ASSET_DIR = "~/assets/brand";

export const LOGO_FILE = "chubzik-logo.png";

// Six magic SVG decoration assets (order stable: scattered by scatter.ts).
export const MAGIC_SVG_FILES = [
  "magic-spark",
  "tiny-spark",
  "magic-curl",
  "magic-wisp",
  "magic-orbit",
  "magic-thread",
] as const;

// Stable backend-less fallback (matches docs/visual-foundation.md §10).
export const FALLBACK_DECOR: DecorativeDetail = "soft-sparks";

export type MagicSvgName = (typeof MAGIC_SVG_FILES)[number];

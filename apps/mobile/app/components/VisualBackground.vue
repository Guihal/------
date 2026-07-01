<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { VisualState } from "~~/api";
import { scatterLayout } from "~~/api";
import sparkUrl from "~/assets/brand/magic-spark.svg";
import tinySparkUrl from "~/assets/brand/tiny-spark.svg";
import curlUrl from "~/assets/brand/magic-curl.svg";
import wispUrl from "~/assets/brand/magic-wisp.svg";
import orbitUrl from "~/assets/brand/magic-orbit.svg";
import threadUrl from "~/assets/brand/magic-thread.svg";

const props = withDefaults(
  defineProps<{ decorativeDetail?: VisualState["decorative_detail"] }>(),
  { decorativeDetail: "soft-sparks" },
);

const ASSET_URLS: Record<string, string> = {
  "magic-spark": sparkUrl,
  "tiny-spark": tinySparkUrl,
  "magic-curl": curlUrl,
  "magic-wisp": wispUrl,
  "magic-orbit": orbitUrl,
  "magic-thread": threadUrl,
};

const items = computed(() => scatterLayout(props.decorativeDetail));

// Respect backend --reduced-motion var; fall back to OS preference.
// ponytail: getComputedStyle read once on mount — decor is static per page.
const reduced = ref(false);
onMounted(() => {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--reduced-motion")
    .trim();
  if (v === "1") reduced.value = true;
  else if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
    reduced.value = true;
});

function styleFor(x: number, y: number, rot: number, scale: number, asset: string) {
  const url = ASSET_URLS[asset];
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  } as Record<string, string>;
}
</script>

<template>
  <div class="visual-bg" aria-hidden="true">
    <span
      v-for="(it, i) in items"
      :key="i"
      class="decor"
      :class="{ 'decor--muted': reduced }"
      :style="styleFor(it.x, it.y, it.rotation, it.scale, it.asset)"
    />
  </div>
</template>

<style scoped lang="scss">
.visual-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 18%, color-mix(in srgb, var(--background-orb-1) 24%, transparent), transparent 26rem),
    radial-gradient(circle at 82% 72%, color-mix(in srgb, var(--background-orb-2) 18%, transparent), transparent 24rem),
    var(--bg-variant, var(--bg));
}
.decor {
  position: absolute;
  width: 64px;
  height: 64px;
  background: var(--brand-decoration-primary);
  opacity: var(--decorative-opacity-low);
  transition: opacity var(--motion-med);
}
.decor:nth-child(odd) {
  background: var(--brand-decoration-secondary);
  opacity: var(--decorative-opacity-medium);
}
.decor:nth-child(3n) {
  background: var(--brand-decoration-muted);
}
.decor--muted {
  opacity: calc(var(--decorative-opacity-low) * 0.5);
  transition: none;
}
</style>

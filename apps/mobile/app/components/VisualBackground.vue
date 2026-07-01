<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { VisualState } from "~~/api";
import { scatterLayout } from "~~/api";
import sparkSvg from "~/assets/brand/magic-spark.svg?raw";
import tinySparkSvg from "~/assets/brand/tiny-spark.svg?raw";
import curlSvg from "~/assets/brand/magic-curl.svg?raw";
import wispSvg from "~/assets/brand/magic-wisp.svg?raw";
import orbitSvg from "~/assets/brand/magic-orbit.svg?raw";
import threadSvg from "~/assets/brand/magic-thread.svg?raw";

const props = withDefaults(
  defineProps<{ decorativeDetail?: VisualState["decorative_detail"] }>(),
  { decorativeDetail: "soft-sparks" },
);

const SVG_MARKUP: Record<string, string> = {
  "magic-spark": sparkSvg,
  "tiny-spark": tinySparkSvg,
  "magic-curl": curlSvg,
  "magic-wisp": wispSvg,
  "magic-orbit": orbitSvg,
  "magic-thread": threadSvg,
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
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
    color: colorFor(asset),
  } as Record<string, string>;
}

function svgFor(asset: string): string {
  return SVG_MARKUP[asset] ?? sparkSvg;
}

function colorFor(asset: string): string {
  if (asset === "magic-orbit" || asset === "magic-thread") {
    return "var(--brand-decoration-secondary)";
  }
  if (asset === "tiny-spark" || asset === "magic-spark") {
    return "var(--brand-decoration-primary)";
  }
  return "var(--brand-decoration-muted)";
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
      v-html="svgFor(it.asset)"
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
  width: 88px;
  height: 88px;
  opacity: var(--decorative-opacity-low);
  transition: opacity var(--motion-med);
}
.decor :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.decor:nth-child(odd) {
  opacity: var(--decorative-opacity-medium);
}
.decor--muted {
  opacity: calc(var(--decorative-opacity-low) * 0.5);
  transition: none;
}
</style>

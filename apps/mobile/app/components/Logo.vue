<script setup lang="ts">
import { computed } from "vue";
import logoUrl from "~/assets/brand/chubzik-logo.png";

const props = withDefaults(
  defineProps<{
    size?: number | string;
    color?: string;
    glow?: boolean;
    decorative?: boolean;
    label?: string;
  }>(),
  { size: 48, color: "currentColor", glow: false, decorative: true },
);

// Bind the WHOLE mask shorthand — nested v-bind inside url() does not resolve.
const sizeCss = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size,
);
const maskCss = `url(${logoUrl}) center/contain no-repeat`;
</script>

<template>
  <span
    class="logo"
    :class="{ glow }"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="!decorative ? 'img' : undefined"
    :aria-label="!decorative ? label : undefined"
  />
</template>

<style scoped lang="scss">
.logo {
  display: inline-block;
  width: v-bind(sizeCss);
  height: v-bind(sizeCss);
  background: var(--logo-color, currentColor);
  -webkit-mask: v-bind(maskCss);
  mask: v-bind(maskCss);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  --logo-color: v-bind(color);
}
.logo.glow {
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--magic) 70%, transparent));
}
</style>

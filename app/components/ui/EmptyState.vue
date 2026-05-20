<script setup lang="ts">
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="empty-state" data-testid="empty-state">
    <picture>
      <source srcset="/img/mascot-sm.webp" type="image/webp" media="(max-width: 480px)" />
      <source srcset="/img/mascot.webp" type="image/webp" />
      <img
        src="/img/mascot.png"
        alt=""
        class="mascot-img"
        width="120"
        height="120"
        loading="lazy"
        decoding="async"
        aria-hidden="true"
      />
    </picture>
    <div class="empty-icon" aria-hidden="true">{{ props.icon ?? "📭" }}</div>
    <h3 class="empty-title">{{ props.title }}</h3>
    <p v-if="props.description" class="empty-description">{{ props.description }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: v-bind("t.spacing.xxl") v-bind("t.spacing.lg");
  text-align: center;
  background: v-bind("t.color.bgElevated");
  border: 1px dashed v-bind("t.color.borderDashed");
  border-radius: v-bind("t.radius.lg");
  color: v-bind("t.color.textSecondary");
  min-height: 160px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.mascot-img {
  max-width: 120px;
  max-height: 120px;
  width: auto;
  height: auto;
  margin-bottom: v-bind("t.spacing.md");
  opacity: 0.85;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: v-bind("t.spacing.md");
  line-height: 1;
}

.empty-title {
  margin: 0 0 v-bind("t.spacing.sm") 0;
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-wrap: balance;
}

.empty-description {
  margin: 0;
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textMuted");
  line-height: 1.6;
  max-width: 280px;
}
</style>

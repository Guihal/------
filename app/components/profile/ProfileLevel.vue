<script setup lang="ts">
import { computed } from "vue"
import { computeLevel, computeProgress, XP_PER_LEVEL } from "../../../core/domain/progression/compute"

import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  xp: number
  name: string
}>()

const level = computed(() => computeLevel(props.xp))
const progress = computed(() => computeProgress(props.xp))
const progressPercent = computed(() => (progress.value / XP_PER_LEVEL) * 100)
</script>

<template>
  <div class="profile-level" data-testid="profile-level">
    <div class="profile-info">
      <span class="profile-name" data-testid="profile-name">{{ props.name }}</span>
      <span class="profile-level-badge" data-testid="profile-level-badge">Ур. {{ level }}</span>
    </div>
    <div class="xp-bar">
      <div class="xp-bar-track">
        <div
          class="xp-bar-fill"
          data-testid="xp-bar-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="xp-text" data-testid="xp-text">{{ progress }} / {{ XP_PER_LEVEL }}</span>
    </div>
  </div>
</template>

<style scoped>
.profile-level {
  background: v-bind("t.color.bgCard");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.lg");
  padding: v-bind("t.spacing.lg");
  color: v-bind("t.color.textPrimary");
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.profile-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: v-bind("t.spacing.md");
}
.profile-name {
  font-size: v-bind("t.typography.size.lg");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.profile-level-badge {
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.accentYellow");
  letter-spacing: 0.01em;
}
.xp-bar {
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.sm");
}
.xp-bar-track {
  height: 12px;
  background: v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.full");
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
}
.xp-bar-fill {
  height: 100%;
  background: v-bind("t.color.accentGreen");
  border-radius: v-bind("t.radius.full");
  transition: width 0.3s ease;
}
.xp-text {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textSecondary");
  text-align: right;
  letter-spacing: 0.01em;
}
</style>

<script setup lang="ts">
import { computed } from "vue"
import { computeLevel, computeProgress, XP_PER_LEVEL } from "../../../core/domain/progression/compute"
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"
import ProfileStats from "./ProfileStats.vue"
import ProfileSettings from "./ProfileSettings.vue"

const props = defineProps<{
  name: string
  xp: number
  tasksCompleted: number
  streak: number
  initials: string
}>()

const level = computed(() => computeLevel(props.xp))
const progress = computed(() => computeProgress(props.xp))
const progressPercent = computed(() => (progress.value / XP_PER_LEVEL) * 100)
</script>

<template>
  <div class="profile-card">
    <!-- Avatar + Name -->
    <div class="profile-header">
      <div class="avatar" data-testid="profile-avatar">
        <span class="avatar-text">{{ props.initials }}</span>
      </div>
      <div class="profile-meta">
        <span class="profile-name" data-testid="profile-name">{{ props.name }}</span>
        <span class="profile-level-badge" data-testid="profile-level-badge">Ур. {{ level }}</span>
      </div>
    </div>

    <!-- XP Bar -->
    <div class="xp-section">
      <div class="xp-bar-track">
        <div
          class="xp-bar-fill"
          data-testid="xp-bar-fill"
          :style="{ width: `${Math.max(progressPercent, 2)}%` }"
        />
      </div>
      <span class="xp-text" data-testid="xp-text">{{ progress }} / {{ XP_PER_LEVEL }}</span>
    </div>

    <ProfileStats
      :tasks-completed="props.tasksCompleted"
      :streak="props.streak"
      :xp="props.xp"
    />

    <ProfileSettings />
  </div>
</template>

<style scoped>
.profile-card {
  background: v-bind("t.color.bgCard");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.lg");
  padding: v-bind("t.spacing.lg");
  color: v-bind("t.color.textPrimary");
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.lg");
  contain: layout paint style;
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  gap: v-bind("t.spacing.lg");
  flex-wrap: wrap;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: v-bind("t.radius.full");
  background: v-bind("t.color.bgElevated");
  border: 2px solid v-bind("t.color.accentBlue");
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: v-bind("t.typography.size.xl");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.accentBlue");
}
.profile-meta {
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.xs");
  min-width: 0;
}
.profile-name {
  font-size: v-bind("t.typography.size.xl");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
  word-break: break-word;
}
.profile-level-badge {
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.accentYellow");
}

/* XP Bar */
.xp-section {
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.sm");
}
.xp-bar-track {
  height: 10px;
  background: v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.full");
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, v-bind("t.color.accentGreen") 0%, v-bind("t.color.accentBlue") 100%);
  border-radius: v-bind("t.radius.full");
  transition: width 0.4s ease;
  min-width: 2px;
}
.xp-text {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textSecondary");
  text-align: right;
}
</style>

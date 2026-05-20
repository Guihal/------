<script setup lang="ts">
import { computed } from "vue"
import { computeLevel, computeProgress, XP_PER_LEVEL } from "../../../core/domain/progression/compute"
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

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

const stats = computed(() => [
  { label: "Выполнено задач", value: props.tasksCompleted },
  { label: "Серия дней", value: props.streak },
  { label: "Всего опыта", value: props.xp },
])
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

    <!-- Stats -->
    <div class="stats-grid" data-testid="profile-stats">
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Settings Placeholder -->
    <div class="settings-section" data-testid="profile-settings">
      <h2 class="settings-title">Настройки</h2>
      <div class="settings-list">
        <div class="settings-row">
          <span class="settings-label">Уведомления</span>
          <span class="settings-placeholder">Скоро...</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Тема оформления</span>
          <span class="settings-placeholder">Тёмная (по умолчанию)</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Язык</span>
          <span class="settings-placeholder">Русский</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  background: v-bind("t.color.bgCard");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.lg");
  padding: v-bind("t.spacing.xxl");
  color: v-bind("t.color.textPrimary");
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.xxl");
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

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: v-bind("t.spacing.md");
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-item:last-child {
    grid-column: span 2;
  }
}
@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-item:last-child {
    grid-column: auto;
  }
}
.stat-item {
  background: v-bind("t.color.bgElevated");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.md");
  padding: v-bind("t.spacing.lg");
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.xs");
}
.stat-value {
  font-size: v-bind("t.typography.size.xxl");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.accentGreen");
}
.stat-label {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textSecondary");
}

/* Settings */
.settings-section {
  border-top: 1px solid v-bind("t.color.borderSubtle");
  padding-top: v-bind("t.spacing.lg");
}
.settings-title {
  margin: 0 0 v-bind("t.spacing.md");
  font-size: v-bind("t.typography.size.lg");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
}
.settings-list {
  display: flex;
  flex-direction: column;
  gap: v-bind("t.spacing.sm");
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: v-bind("t.spacing.sm");
  padding: v-bind("t.spacing.md") v-bind("t.spacing.lg");
  background: v-bind("t.color.bgElevated");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.md");
}
.settings-label {
  font-size: v-bind("t.typography.size.md");
  color: v-bind("t.color.textPrimary");
}
.settings-placeholder {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textMuted");
}
</style>

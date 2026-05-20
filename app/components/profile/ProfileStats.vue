<script setup lang="ts">
import { computed } from "vue"
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  tasksCompleted: number
  streak: number
  xp: number
}>()

const stats = computed(() => [
  { label: "Выполнено задач", value: props.tasksCompleted },
  { label: "Серия дней", value: props.streak },
  { label: "Всего опыта", value: props.xp },
])
</script>

<template>
  <div class="stats-grid" data-testid="profile-stats">
    <div v-for="stat in stats" :key="stat.label" class="stat-item">
      <span class="stat-value">{{ stat.value }}</span>
      <span class="stat-label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped>
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
</style>

<script setup lang="ts">
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  profileName: string
  totalXp: number
}>()
</script>

<template>
  <header class="app-header">
    <h1>Таск Компаньон</h1>
    <div class="profile-badge">
      <span class="profile-name">{{ props.profileName }}</span>
      <span class="profile-xp">{{ props.totalXp }} XP</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: v-bind("t.spacing.xl");
  padding: v-bind("t.spacing.md") v-bind("t.spacing.lg");
  background: v-bind("t.color.bgElevated");
  border-radius: v-bind("t.radius.lg");
  border-bottom: 1px solid v-bind("t.color.borderSubtle");
  color: v-bind("t.color.textPrimary");
}
.app-header h1 {
  margin: 0;
  font-size: v-bind("t.typography.size.xl");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.textPrimary");
}
.profile-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: v-bind("t.spacing.xs");
}
.profile-name {
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
}
.profile-xp {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textSecondary");
}
</style>

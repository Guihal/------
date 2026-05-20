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
    <NuxtLink to="/profile" class="profile-link" aria-label="Перейти в профиль">
      <div class="profile-badge">
        <span class="profile-name">{{ props.profileName }}</span>
        <span class="profile-xp">{{ props.totalXp }}</span>
      </div>
    </NuxtLink>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: v-bind("t.spacing.md");
  margin-bottom: v-bind("t.spacing.xl");
  padding: v-bind("t.spacing.md") v-bind("t.spacing.lg");
  background: v-bind("t.color.bgElevated");
  border-radius: v-bind("t.radius.lg");
  border-bottom: 1px solid v-bind("t.color.borderSubtle");
  color: v-bind("t.color.textPrimary");
  flex-wrap: wrap;
  min-height: 44px;
}
.app-header h1 {
  margin: 0;
  font-size: v-bind("t.typography.size.xl");
  font-weight: v-bind("t.typography.weight.bold");
  color: v-bind("t.color.textPrimary");
  line-height: v-bind("t.typography.lineHeight.tight");
}
@media (max-width: 400px) {
  .app-header h1 {
    font-size: v-bind("t.typography.size.lg");
  }
  .profile-name {
    font-size: v-bind("t.typography.size.sm");
  }
}
.profile-link {
  display: inline-flex;
  text-decoration: none;
  color: inherit;
  min-height: 44px;
  min-width: 44px;
  padding: v-bind("t.spacing.xs") v-bind("t.spacing.sm");
  margin: calc(-1 * v-bind("t.spacing.xs")) calc(-1 * v-bind("t.spacing.sm"));
  border-radius: v-bind("t.radius.md");
  align-items: center;
}
.profile-link:hover {
  background: v-bind("t.color.bgCard");
}
.profile-link:focus-visible {
  outline: 2px solid v-bind("t.color.accentBlue");
  outline-offset: 2px;
}
.profile-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: v-bind("t.spacing.xs");
  min-height: 44px;
  justify-content: center;
}
.profile-name {
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textPrimary");
  word-break: break-word;
  max-width: 100%;
}
.profile-xp {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textSecondary");
}
</style>

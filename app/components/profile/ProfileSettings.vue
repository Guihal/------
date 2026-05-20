<script setup lang="ts">
</script>

<template>
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
</template>

<style scoped>
.settings-section {
  border-top: 1px solid v-bind("t.color.borderSubtle");
  padding-top: v-bind("t.spacing.xl");
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

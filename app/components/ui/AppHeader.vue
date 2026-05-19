<script setup lang="ts">
const props = defineProps<{
  profileName: string
  totalXp: number
}>()
</script>

<template>
  <header class="app-header">
    <h1>Task Companion</h1>
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
  margin-bottom: 20px;
}
.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.profile-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: #cdd6f4;
}
.profile-xp {
  font-size: 12px;
  color: #a6adc8;
}
</style>

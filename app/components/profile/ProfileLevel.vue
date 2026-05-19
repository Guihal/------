<script setup lang="ts">
import { computed } from "vue"
import { computeLevel, computeProgress, XP_PER_LEVEL } from "../../../core/domain/progression/compute"

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
      <span class="profile-level-badge" data-testid="profile-level-badge">Lv. {{ level }}</span>
    </div>
    <div class="xp-bar">
      <div class="xp-bar-track">
        <div
          class="xp-bar-fill"
          data-testid="xp-bar-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="xp-text" data-testid="xp-text">{{ progress }} / {{ XP_PER_LEVEL }} XP</span>
    </div>
  </div>
</template>

<style scoped>
.profile-level {
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 12px;
  padding: 16px;
}
.profile-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: #cdd6f4;
}
.profile-level-badge {
  font-size: 14px;
  font-weight: 700;
  color: #f9e2af;
}
.xp-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.xp-bar-track {
  height: 8px;
  background: #313244;
  border-radius: 4px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: #a6e3a1;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.xp-text {
  font-size: 12px;
  color: #a6adc8;
  text-align: right;
}
</style>

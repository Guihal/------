<script setup lang="ts">
import { computed } from "vue"
import { DARK_TOKENS as t } from "../../assets/tokens/dark"
import { useProfileStore } from "../stores/useProfileStore"
import ProfileCard from "../components/profile/ProfileCard.vue"

const profileStore = useProfileStore()

const name = computed(() => profileStore.profile?.name ?? "Пользователь")
const xp = computed(() => profileStore.progression?.totalXp ?? 0)
const tasksCompleted = computed(() => profileStore.progression?.tasksCompleted ?? 0)
const streak = computed(() => profileStore.progression?.streak ?? 0)
const initials = computed(() => {
  const n = name.value
  return n.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("") || "?"
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">Профиль</h1>
    <ProfileCard
      :name="name"
      :xp="xp"
      :tasks-completed="tasksCompleted"
      :streak="streak"
      :initials="initials"
    />
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: v-bind("t.spacing.lg"); padding-left: max(v-bind("t.spacing.lg"), env(safe-area-inset-left)); padding-right: max(v-bind("t.spacing.lg"), env(safe-area-inset-right)); padding-top: max(v-bind("t.spacing.lg"), env(safe-area-inset-top)); padding-bottom: calc(v-bind("t.spacing.xxl") + env(safe-area-inset-bottom)); background: v-bind("t.color.bgBase"); min-height: 100dvh; }
@media (max-width: 360px) {
  .page { padding: v-bind("t.spacing.md"); padding-left: max(v-bind("t.spacing.md"), env(safe-area-inset-left)); padding-right: max(v-bind("t.spacing.md"), env(safe-area-inset-right)); padding-top: max(v-bind("t.spacing.md"), env(safe-area-inset-top)); padding-bottom: calc(v-bind("t.spacing.xl") + env(safe-area-inset-bottom)); }
}
.page-title { margin: 0 0 v-bind("t.spacing.lg"); font-size: v-bind("t.typography.size.xl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); }
@media (max-width: 360px) {
  .page-title { font-size: v-bind("t.typography.size.lg"); }
}
</style>

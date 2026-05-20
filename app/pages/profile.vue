<script setup lang="ts">
import { computed } from "vue"
import { DARK_TOKENS as t } from "../../assets/tokens/dark"
import { useProfileStore } from "../stores/useProfileStore"
import ProfileLevel from "../components/profile/ProfileLevel.vue"

const profileStore = useProfileStore()

const name = computed(() => profileStore.profile?.name ?? "Пользователь")
const xp = computed(() => profileStore.progression?.totalXp ?? 0)
</script>

<template>
  <div class="page">
    <h1 class="page-title">Профиль</h1>
    <ProfileLevel :name="name" :xp="xp" />
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: v-bind("t.spacing.lg"); background: v-bind("t.color.bgBase"); min-height: 100dvh; }
.page-title { margin: 0 0 v-bind("t.spacing.lg"); font-size: v-bind("t.typography.size.xl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); }
</style>

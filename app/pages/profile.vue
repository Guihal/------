<script setup lang="ts">
import { computed } from "vue"
import { useProfileStore } from "../stores/useProfileStore"
import ProfileLevel from "../components/profile/ProfileLevel.vue"

const profileStore = useProfileStore()

const name = computed(() => profileStore.profile?.name ?? "User")
const xp = computed(() => profileStore.progression?.totalXp ?? 0)
</script>

<template>
  <div class="page">
    <h1 class="page-title">Profile</h1>
    <ProfileLevel :name="name" :xp="xp" />
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: 16px; }
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #cdd6f4; }
</style>

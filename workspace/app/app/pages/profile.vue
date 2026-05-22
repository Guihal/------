<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Профиль</h1>

    <LoadingState v-if="profileStore.loading" />
    <ErrorState
      v-else-if="profileStore.error"
      :message="profileStore.error"
      :on-retry="load"
    />

    <template v-else-if="profileStore.profile">
      <ProfileCard :profile="profileStore.profile" />

      <div v-if="profileStore.progression" class="mt-4 rounded-lg bg-white p-6 shadow">
        <h3 class="mb-2 font-bold">Прогресс</h3>
        <div class="space-y-2">
          <p><span class="text-gray-500">Уровень:</span> {{ profileStore.progression.level }}</p>
          <p><span class="text-gray-500">Опыт:</span> {{ profileStore.progression.xp }}</p>
          <p>
            <span class="text-gray-500">До следующего уровня:</span>
            {{ profileStore.progression.xp_to_next }}
          </p>
          <p>
            <span class="text-gray-500">Выполнено задач:</span>
            {{ profileStore.progression.tasks_completed }}
          </p>
        </div>
      </div>
    </template>

    <EmptyState v-else message="Профиль не загружен" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const profileStore = useProfileStore()

async function load() {
  await profileStore.fetchProfile()
  await profileStore.fetchProgression()
}

onMounted(load)
</script>

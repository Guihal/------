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

      <div class="mt-4 rounded-lg bg-white p-6 shadow">
        <h3 class="mb-2 font-bold">Маскот</h3>
        <div class="flex items-center gap-4">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl"
          >
            {{ mascotEmoji }}
          </div>
          <div>
            <p class="font-medium">{{ mascotName }}</p>
            <p class="text-sm text-gray-500">{{ mascotSubtitle }}</p>
          </div>
        </div>
      </div>

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
const inventoryStore = useInventoryStore()

const mascotEmoji = computed(() => {
  if (inventoryStore.equippedItem) {
    const map: Record<string, string> = {
      common: '🐱',
      rare: '🦊',
      epic: '🐉',
      legendary: '👑',
    }
    return map[inventoryStore.equippedItem.rarity] || '🐱'
  }
  return '🐱'
})

const mascotName = computed(() => {
  return inventoryStore.equippedItem?.name || 'Обычный маскот'
})

const mascotSubtitle = computed(() => {
  if (inventoryStore.equippedItem) {
    const map: Record<string, string> = {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный',
    }
    return map[inventoryStore.equippedItem.rarity] || ''
  }
  return 'Надень предмет из инвентаря'
})

async function load() {
  await profileStore.fetchProfile()
  await profileStore.fetchProgression()
  await inventoryStore.fetchInventory()
}

onMounted(load)
</script>

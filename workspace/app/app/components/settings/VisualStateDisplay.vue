<template>
  <div>
    <LoadingState v-if="visualStore.loading && !visualStore.visual" />
    <ErrorState
      v-else-if="visualStore.error && !visualStore.visual"
      :message="visualStore.error"
      :on-retry="visualStore.fetchVisual"
    />

    <div v-else-if="visualStore.visual" class="flex items-center gap-4">
      <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100">
        <img
          v-if="visualStore.visual.avatar_url"
          :src="visualStore.visual.avatar_url"
          alt="avatar"
          class="h-full w-full object-cover"
        />
        <span v-else class="text-2xl">{{ displayName.charAt(0).toUpperCase() }}</span>
      </div>
      <div class="space-y-1">
        <p class="font-medium">{{ displayName }}</p>
        <p class="text-sm text-gray-500">Уровень {{ visualStore.visual.level }} | Опыт {{ visualStore.visual.xp }}</p>
        <p v-if="visualStore.visual.equipped_item" class="text-sm text-gray-500">
          Экипировано: {{ visualStore.visual.equipped_item.name }}
        </p>
      </div>
    </div>

    <EmptyState v-else message="Визуальное состояние не загружено" />
  </div>
</template>

<script setup lang="ts">
const visualStore = useVisualStore()

const displayName = computed(() => {
  return visualStore.visual?.display_name || 'Пользователь'
})

onMounted(() => {
  visualStore.fetchVisual()
})
</script>

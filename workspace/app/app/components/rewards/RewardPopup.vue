<template>
  <div
    v-if="rewardStore.show && rewardStore.payload"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="rewardStore.close()"
  >
    <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
      <h2 class="mb-4 text-center text-xl font-bold text-yellow-600">Награда!</h2>

      <div class="space-y-4">
        <div class="text-center">
          <p class="text-sm text-gray-500">Получено опыта</p>
          <p class="text-2xl font-bold text-green-600">+{{ rewardStore.payload.xpGained }}</p>
        </div>

        <div v-if="rewardStore.payload.drop" class="rounded-lg border p-3">
          <p class="text-xs text-gray-500">Выпал предмет</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-2xl">{{ dropEmoji }}</span>
            <div>
              <p class="font-medium">{{ rewardStore.payload.drop.name }}</p>
              <p class="text-xs" :class="dropRarityClass">{{ dropRarityLabel }}</p>
            </div>
          </div>
        </div>

        <div v-if="rewardStore.payload.level" class="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p class="text-xs text-yellow-600">Награда за уровень</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-2xl">{{ levelEmoji }}</span>
            <div>
              <p class="font-medium">{{ rewardStore.payload.level.name }}</p>
              <p class="text-xs" :class="levelRarityClass">{{ levelRarityLabel }}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        class="mt-6 w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
        @click="rewardStore.close()"
      >
        В инвентарь
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const rewardStore = useRewardStore()

const dropEmoji = computed(() => rarityEmoji(rewardStore.payload?.drop?.rarity))
const levelEmoji = computed(() => rarityEmoji(rewardStore.payload?.level?.rarity))

const dropRarityLabel = computed(() => rarityLabel(rewardStore.payload?.drop?.rarity))
const levelRarityLabel = computed(() => rarityLabel(rewardStore.payload?.level?.rarity))

const dropRarityClass = computed(() => rarityTextClass(rewardStore.payload?.drop?.rarity))
const levelRarityClass = computed(() => rarityTextClass(rewardStore.payload?.level?.rarity))

function rarityLabel(rarity?: string) {
  const map: Record<string, string> = {
    common: 'Обычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  }
  return map[rarity || ''] || rarity || ''
}

function rarityTextClass(rarity?: string) {
  const map: Record<string, string> = {
    common: 'text-gray-500',
    rare: 'text-blue-500',
    epic: 'text-purple-500',
    legendary: 'text-yellow-500',
  }
  return map[rarity || ''] || 'text-gray-500'
}

function rarityEmoji(rarity?: string) {
  const map: Record<string, string> = {
    common: '🐱',
    rare: '🦊',
    epic: '🐉',
    legendary: '👑',
  }
  return map[rarity || ''] || '🎁'
}
</script>

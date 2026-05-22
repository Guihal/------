<template>
  <div class="rounded-lg border bg-white p-4 shadow-sm">
    <div class="flex items-center gap-4">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full text-xl"
        :class="mascotBgClass"
      >
        {{ mascotEmoji }}
      </div>
      <div class="flex-1">
        <p class="font-medium">{{ item.name }}</p>
        <p class="text-xs" :class="rarityTextClass">{{ rarityLabel }} — {{ item.quantity }} шт.</p>
      </div>
      <button
        v-if="item.equipped"
        class="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"
        @click="emit('unequip')"
      >
        Снять
      </button>
      <button
        v-else
        class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
        @click="emit('equip', item.item_id)"
      >
        Надеть
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '~/types/api'

const props = defineProps<{ item: InventoryItem }>()
const emit = defineEmits<{
  equip: [itemId: number]
  unequip: []
}>()

const rarityLabel = computed(() => {
  const map: Record<string, string> = {
    common: 'Обычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  }
  return map[props.item.rarity] || props.item.rarity
})

const rarityTextClass = computed(() => {
  const map: Record<string, string> = {
    common: 'text-gray-500',
    rare: 'text-blue-500',
    epic: 'text-purple-500',
    legendary: 'text-yellow-500',
  }
  return map[props.item.rarity] || 'text-gray-500'
})

const mascotBgClass = computed(() => {
  const map: Record<string, string> = {
    common: 'bg-gray-100',
    rare: 'bg-blue-100',
    epic: 'bg-purple-100',
    legendary: 'bg-yellow-100',
  }
  return map[props.item.rarity] || 'bg-gray-100'
})

const mascotEmoji = computed(() => {
  const map: Record<string, string> = {
    common: '🐱',
    rare: '🦊',
    epic: '🐉',
    legendary: '👑',
  }
  return map[props.item.rarity] || '🐱'
})
</script>

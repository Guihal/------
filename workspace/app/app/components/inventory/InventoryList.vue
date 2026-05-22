<template>
  <div class="space-y-3">
    <InventoryItemCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      @equip="emit('equip', $event)"
      @unequip="emit('unequip')"
    />
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '~/types/api'

defineProps<{ items: InventoryItem[] }>()
const emit = defineEmits<{
  equip: [itemId: number]
  unequip: []
}>()
</script>

<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Инвентарь</h1>

    <LoadingState v-if="inventoryStore.loading && !inventoryStore.items.length" />
    <ErrorState
      v-else-if="inventoryStore.error && !inventoryStore.items.length"
      :message="inventoryStore.error"
      :on-retry="inventoryStore.fetchInventory"
    />

    <template v-else-if="inventoryStore.items.length">
      <InventoryList
        :items="inventoryStore.items"
        @equip="handleEquip"
        @unequip="handleUnequip"
      />
    </template>

    <EmptyState v-else message="Нет предметов в инвентаре" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const inventoryStore = useInventoryStore()

async function handleEquip(itemId: number) {
  try {
    await inventoryStore.equipItem(itemId)
  } catch {
    // error в store
  }
}

async function handleUnequip() {
  try {
    await inventoryStore.unequipAll()
  } catch {
    // error в store
  }
}

onMounted(() => {
  inventoryStore.fetchInventory()
})
</script>

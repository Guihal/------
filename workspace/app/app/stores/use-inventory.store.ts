import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InventoryItem, InventoryResponse } from '~/types/api'

export const useInventoryStore = defineStore('app-inventory', () => {
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const error = ref('')

  const api = useApi()

  const equippedItem = computed(() => items.value.find((i) => i.equipped) || null)

  async function fetchInventory() {
    loading.value = true
    error.value = ''
    try {
      const data = await api.fetch<InventoryResponse>('/inventory')
      items.value = data.items
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка загрузки инвентаря'
    } finally {
      loading.value = false
    }
  }

  async function equipItem(itemId: number) {
    error.value = ''
    try {
      await api.fetch('/inventory/equip', {
        method: 'POST',
        body: { item_id: itemId },
      })
      items.value = items.value.map((i) => ({ ...i, equipped: i.item_id === itemId }))
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка надевания предмета'
      throw e
    }
  }

  async function unequipAll() {
    error.value = ''
    try {
      await api.fetch('/inventory/equip', {
        method: 'POST',
        body: { item_id: null },
      })
      items.value = items.value.map((i) => ({ ...i, equipped: false }))
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка снятия предмета'
      throw e
    }
  }

  return {
    items,
    loading,
    error,
    equippedItem,
    fetchInventory,
    equipItem,
    unequipAll,
  }
})

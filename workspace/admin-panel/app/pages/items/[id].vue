<template>
  <div>
    <h1>Edit Item</h1>
    <ItemForm v-if="item" :item="item" @submit="update" />
    <p v-else>Loading…</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Item {
  id: number
  name: string
  description: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  slots: number
  asset_url: string | null
  active: boolean
}

const route = useRoute()
const router = useRouter()
const api = useApi()
const item = ref<Item | null>(null)

const itemId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? null : id
})

onMounted(async () => {
  if (itemId.value === null) {
    item.value = null
    return
  }
  const ctrl = new AbortController()
  onBeforeUnmount(() => ctrl.abort())
  try {
    const data = await api.fetch<{ item: Item }>(`/admin/items/${itemId.value}`, { signal: ctrl.signal })
    item.value = data.item
  } catch {
    item.value = null
  }
})

async function update(body: FormData) {
  if (itemId.value === null) return
  try {
    await api.fetch(`/admin/items/${itemId.value}`, { method: 'PUT', body })
    router.push('/items')
  } catch {
    alert('Failed to update item')
  }
}
</script>

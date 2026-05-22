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

onMounted(async () => {
  const data = await api.fetch<{ item: Item }>(`/admin/items/${route.params.id}`).catch(() => null)
  item.value = data?.item ?? null
})

async function update(body: FormData) {
  await api.fetch(`/admin/items/${route.params.id}`, { method: 'PUT', body })
  router.push('/items')
}
</script>

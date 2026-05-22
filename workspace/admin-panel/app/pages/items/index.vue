<template>
  <div>
    <div class="header">
      <h1>Items</h1>
      <NuxtLink to="/items/new" class="btn">Create Item</NuxtLink>
    </div>
    <table v-if="items.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Asset</th>
          <th>Name</th>
          <th>Rarity</th>
          <th>Slots</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <img v-if="item.asset_url" :src="item.asset_url" class="thumb" alt="">
            <span v-else class="no-asset">—</span>
          </td>
          <td>{{ item.name }}</td>
          <td><span :class="['badge', item.rarity]">{{ item.rarity }}</span></td>
          <td>{{ item.slots }}</td>
          <td>{{ item.active ? 'Yes' : 'No' }}</td>
          <td>
            <NuxtLink :to="`/items/${item.id}`" class="link">Edit</NuxtLink>
            <button class="link danger" @click="remove(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>No items.</p>
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
  created_at: string
  updated_at: string
}

const items = ref<Item[]>([])
const api = useApi()

async function load() {
  const data = await api.fetch<{ items: Item[] }>('/admin/items').catch(() => null)
  items.value = data?.items ?? []
}

async function remove(id: number) {
  if (!confirm('Delete this item?')) return
  await api.fetch(`/admin/items/${id}`, { method: 'DELETE' }).catch(() => null)
  await load()
}

onMounted(load)
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.btn { padding: 0.5rem 1rem; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 4px; }
.btn:hover { background: #333; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.5rem; border-bottom: 1px solid #ddd; text-align: left; }
.thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.no-asset { color: #999; }
.badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; }
.badge.common { background: #e0e0e0; color: #333; }
.badge.rare { background: #4fc3f7; color: #01579b; }
.badge.epic { background: #ce93d8; color: #4a148c; }
.badge.legendary { background: #ffcc80; color: #e65100; }
.link { margin-right: 0.5rem; color: #1a1a2e; }
.link.danger { color: #c62828; background: none; border: none; cursor: pointer; font-size: inherit; }
</style>

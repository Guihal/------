<template>
  <div>
    <h1>Create Item</h1>
    <ItemForm @submit="create" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const router = useRouter()

async function create(body: FormData) {
  try {
    await api.fetch('/admin/items', { method: 'POST', body })
    router.push('/items')
  } catch {
    alert('Failed to create item')
  }
}
</script>

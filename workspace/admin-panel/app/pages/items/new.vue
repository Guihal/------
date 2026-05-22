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
  const ctrl = new AbortController()
  try {
    await api.fetch('/admin/items', { method: 'POST', body, signal: ctrl.signal })
    router.push('/items')
  } catch (e) {
    alert(String((e as Error)?.message || e || 'Failed to create item'))
  }
}
</script>

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
  await api.fetch('/admin/items', { method: 'POST', body })
  router.push('/items')
}
</script>

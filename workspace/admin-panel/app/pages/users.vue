<template>
  <div>
    <h1>Users</h1>
    <table v-if="users.length">
      <thead>
        <tr><th>ID</th><th>Email</th><th>Role</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.role }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No users.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface User {
  id: number
  email: string
  role: string
}

const users = ref<User[]>([])

onMounted(async () => {
  const data = await $fetch<{ users: User[] }>('/admin/users', {
    baseURL: useRuntimeConfig().public.apiBase as string,
    headers: { Authorization: `Bearer ${useAuthStore().token}` },
  }).catch(() => null)
  users.value = data?.users ?? []
})
</script>

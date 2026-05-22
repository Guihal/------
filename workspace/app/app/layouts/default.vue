<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b bg-white px-4 py-3">
      <div class="mx-auto flex max-w-2xl items-center justify-between">
        <NuxtLink to="/tasks" class="font-bold">Diploma App</NuxtLink>
        <button class="text-sm text-red-600" @click="logout">Logout</button>
      </div>
    </header>
    <main class="mx-auto max-w-2xl p-4">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()

async function logout() {
  auth.logout()
  await router.push('/login')
}
</script>

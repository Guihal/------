<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <form class="w-full max-w-sm rounded-lg bg-white p-6 shadow" @submit.prevent="handleLogin">
      <h1 class="mb-4 text-xl font-bold">Login</h1>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Email</label>
        <input v-model="email" type="email" class="w-full rounded border px-3 py-2" required />
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Password</label>
        <input v-model="password" type="password" class="w-full rounded border px-3 py-2" required />
      </div>
      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <button type="submit" class="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
        Sign In
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function handleLogin() {
  error.value = ''
  const ok = await auth.login(email.value, password.value)
  if (ok) {
    await router.push('/tasks')
  } else {
    error.value = 'Invalid credentials'
  }
}
</script>

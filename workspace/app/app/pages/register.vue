<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <form class="w-full max-w-sm rounded-lg bg-white p-6 shadow" @submit.prevent="handleRegister">
      <h1 class="mb-4 text-xl font-bold">Регистрация</h1>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Email</label>
        <input
          v-model="email"
          type="email"
          class="w-full rounded border px-3 py-2"
          required
        />
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Пароль</label>
        <input
          v-model="password"
          type="password"
          class="w-full rounded border px-3 py-2"
          required
          minlength="6"
        />
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Подтвердите пароль</label>
        <input
          v-model="passwordConfirm"
          type="password"
          class="w-full rounded border px-3 py-2"
          required
        />
      </div>
      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        :disabled="auth.loading"
        class="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {{ auth.loading ? 'Создание...' : 'Создать аккаунт' }}
      </button>
      <p class="mt-4 text-center text-sm text-gray-600">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Войти</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function handleRegister() {
  error.value = ''
  if (password.value !== passwordConfirm.value) {
    error.value = 'Пароли не совпадают'
    return
  }
  const ok = await auth.register(email.value, password.value)
  if (ok) {
    await router.push('/login')
  } else {
    error.value = auth.error || 'Ошибка регистрации'
  }
}
</script>

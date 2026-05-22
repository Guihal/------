<template>
  <div class="login-page">
    <h1>Admin Login</h1>
    <form @submit.prevent="handleLogin">
      <label>
        Email:
        <input v-model="email" type="email" required />
      </label>
      <label>
        Password:
        <input v-model="password" type="password" required />
      </label>
      <button type="submit">Login</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
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
    router.push('/')
  } else {
    error.value = 'Invalid credentials'
  }
}
</script>

<style scoped>
.login-page { max-width: 400px; margin: 4rem auto; }
form { display: flex; flex-direction: column; gap: 1rem; }
label { display: flex; flex-direction: column; }
.error { color: #c00; }
</style>

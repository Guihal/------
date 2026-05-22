<template>
  <div class="layout">
    <nav class="sidebar">
      <ul>
        <li><NuxtLink to="/">Dashboard</NuxtLink></li>
        <li><NuxtLink to="/users">Users</NuxtLink></li>
        <li><NuxtLink to="/logs">Logs</NuxtLink></li>
        <li><NuxtLink to="/stats">Stats</NuxtLink></li>
        <li v-if="auth.isAdmin"><NuxtLink to="/items">Items</NuxtLink></li>
        <li><button @click="logout">Logout</button></li>
      </ul>
    </nav>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 200px; background: #1a1a2e; color: #fff; padding: 1rem; }
.sidebar ul { list-style: none; padding: 0; }
.sidebar li { margin: 0.5rem 0; }
.sidebar a { color: #fff; text-decoration: none; }
.sidebar a:hover { text-decoration: underline; }
.content { flex: 1; padding: 1rem; }
</style>

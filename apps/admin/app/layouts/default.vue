<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  await router.replace("/login");
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <p class="brand display">TaskCompanion Admin</p>
      <nav class="nav" aria-label="Основная навигация">
        <NuxtLink to="/">Дашборд</NuxtLink>
        <NuxtLink to="/users">Пользователи</NuxtLink>
        <NuxtLink to="/items">Предметы</NuxtLink>
        <NuxtLink to="/logs">Журнал</NuxtLink>
      </nav>
      <button type="button" class="logout tap" @click="logout">
        Выйти
      </button>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border-bottom: 1px solid var(--stroke);
}
.brand {
  margin: 0;
  font-size: 1.05rem;
}
.nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.nav a {
  color: var(--text);
}
.nav a:hover,
.nav a.router-link-active {
  color: var(--accent);
}
.logout {
  margin-left: auto;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
.main {
  padding: 1.25rem;
  max-width: 72rem;
  margin: 0 auto;
}
</style>

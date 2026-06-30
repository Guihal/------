<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
  await navigateTo("/login");
}
</script>

<template>
  <section class="wrap">
    <StubSection title="Профиль" note="Статистика и прогресс — P12." />
    <button class="logout tap" type="button" @click="onLogout">Выйти</button>
  </section>
</template>

<style scoped lang="scss">
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.logout {
  align-self: flex-start;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--surface-2);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
</style>

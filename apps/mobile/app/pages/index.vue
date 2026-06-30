<script setup lang="ts">
definePageMeta({ layout: false });

const auth = useAuthStore();
const router = useRouter();

// Plugin already ran bootstrap; just route based on result.
onMounted(() => {
  router.replace(auth.isAuthenticated ? "/tasks" : "/login");
});
</script>

<template>
  <div class="boot">
    <p role="status" aria-live="polite">Загрузка…</p>
  </div>
</template>

<style scoped lang="scss">
.boot {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  padding: calc(var(--safe-top) + 1rem) 1rem;
}
</style>

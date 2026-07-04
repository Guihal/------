<template>
  <div class="auth-shell">
    <div class="card">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-shell {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.card {
  width: 100%;
  max-width: 24rem;
  padding: 1.75rem 1.5rem;
  background: var(--surface-card);
  border: 1px solid var(--stroke);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
</style>

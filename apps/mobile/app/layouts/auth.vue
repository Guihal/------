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
  padding: calc(var(--safe-top) + 1rem) 1rem
    calc(var(--safe-bottom) + 1rem);
}
.card {
  width: 100%;
  max-width: 24rem;
  padding: 1.75rem 1.25rem;
  background: color-mix(in srgb, var(--card-variant, var(--surface)) 86%, transparent);
  border: 1px solid var(--stroke);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(14px);
}
</style>

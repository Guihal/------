<template>
  <div class="shell">
    <AppHeader />
    <main class="main">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100%;
}
.main {
  // Keep content clear of the fixed bottom nav (56px + safe-area).
  padding: 0 1rem calc(56px + var(--safe-bottom) + 1rem);
}
</style>

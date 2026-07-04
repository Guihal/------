<script setup lang="ts">
defineProps<{
  label: string;
  value: number | string;
  icon?: string;
  accent?: string;
}>();
</script>

<template>
  <div class="card" :style="{ '--card-accent': accent ?? 'var(--accent)' }">
    <span v-if="icon" class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path :d="icon" />
      </svg>
    </span>
    <p class="value">{{ value }}</p>
    <p class="label">{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  display: grid;
  gap: 0.15rem;
  padding: 1.1rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  overflow: hidden;
}
.card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--card-accent);
}
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  margin-bottom: 0.5rem;
  border-radius: 10px;
  color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 15%, transparent);
}
.icon svg {
  width: 1.25rem;
  height: 1.25rem;
}
.value {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.label {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
}
</style>

<script setup lang="ts">
defineProps<{
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    class="btn tap"
  >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped lang="scss">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent-grad);
  color: var(--bg);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 10px 24px -12px color-mix(in srgb, var(--accent) 70%, transparent);
  transition: transform var(--motion-fast), box-shadow var(--motion-med);
}
.btn:active {
  transform: translateY(1px);
}
.btn:focus-visible {
  box-shadow: var(--ring), 0 10px 24px -12px color-mix(in srgb, var(--accent) 70%, transparent);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, var(--bg) 35%, transparent);
  border-top-color: var(--bg);
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

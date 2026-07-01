<script setup lang="ts">
defineProps<{
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "ghost";
  type?: "button" | "submit";
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    class="btn tap"
    :class="variant ?? 'primary'"
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
  padding: 0.6rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.06s ease, box-shadow 0.2s ease;
}
.btn:active {
  transform: translateY(1px);
}
.btn:focus-visible {
  box-shadow: var(--ring);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.primary {
  background: var(--accent-grad);
  color: #fff;
}
.danger {
  background: var(--danger);
  color: #fff;
}
.ghost {
  background: transparent;
  border-color: var(--stroke);
  color: var(--text);
}
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

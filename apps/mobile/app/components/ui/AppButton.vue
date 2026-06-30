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
  border-radius: 14px;
  background: var(--accent-grad);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 20px -8px rgba(124, 92, 255, 0.6);
  transition: transform 0.06s ease, box-shadow 0.2s ease;
}
.btn:active {
  transform: translateY(1px);
}
.btn:focus-visible {
  box-shadow: var(--ring), 0 8px 20px -8px rgba(124, 92, 255, 0.6);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
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

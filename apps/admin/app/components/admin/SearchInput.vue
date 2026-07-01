<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ id: string; label: string; placeholder?: string }>();
</script>

<template>
  <div class="search">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      class="input tap"
    />
  </div>
</template>

<style scoped lang="scss">
.search {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
label {
  font-size: 0.85rem;
  color: var(--muted);
}
.input {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
}
.input:focus-visible {
  border-color: var(--accent);
  box-shadow: var(--ring);
  outline: none;
}
</style>

<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{
  id: string;
  label: string;
  type?: string;
  error?: string | null;
  autocomplete?: string;
}>();
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? id + '-err' : undefined"
      class="input tap"
    />
    <FieldError :id="id + '-err'" :message="error" />
  </div>
</template>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
label {
  font-size: 0.85rem;
  color: var(--muted);
}
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
}
.input:focus-visible {
  border-color: var(--accent);
  box-shadow: var(--ring);
  outline: none;
}
</style>

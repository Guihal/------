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
    <p v-if="error" :id="id + '-err'" class="err" role="alert">{{ error }}</p>
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
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1.5px solid #2f3441;
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
}
.input::placeholder {
  color: var(--muted);
}
.input:focus,
.input:focus-visible {
  border-color: var(--accent);
  // box-shadow ring — survives Tailwind preflight (outline-style gets reset).
  box-shadow: 0 0 0 3px var(--accent-weak);
  outline: none;
}
.err {
  margin: 0;
  color: var(--error);
  font-size: 0.8rem;
}
</style>

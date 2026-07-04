<script setup lang="ts">
import { useId } from "vue";

defineProps<{
  label: string;
  description: string;
  modelValue: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const descId = useId();
</script>

<template>
  <label class="toggle">
    <span>
      <strong>{{ label }}</strong>
      <small :id="descId">{{ description }}</small>
    </span>
    <input
      class="tap"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-describedby="descId"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
  </label>
</template>

<style scoped lang="scss">
.toggle { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface-card); }
span { display: grid; gap: 0.2rem; }
strong { color: var(--text); }
small { color: var(--muted); line-height: 1.35; }
input { width: 44px; height: 28px; accent-color: var(--accent); }
</style>

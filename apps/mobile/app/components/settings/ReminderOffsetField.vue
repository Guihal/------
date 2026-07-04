<script setup lang="ts">
const props = defineProps<{ value: number; disabled?: boolean }>();
const emit = defineEmits<{ save: [value: number] }>();
const draft = ref(props.value);

watch(() => props.value, (next) => {
  draft.value = next;
});
</script>

<template>
  <section class="field">
    <label for="reminder-offset">Напоминать за (минут)</label>
    <div class="row">
      <input
        id="reminder-offset"
        v-model.number="draft"
        class="tap"
        type="number"
        min="0"
        max="10080"
        step="5"
        :disabled="disabled"
      />
      <button
        class="tap"
        type="button"
        :disabled="disabled || draft === value"
        @click="emit('save', Math.max(0, Number(draft) || 0))"
      >
        Сохранить
      </button>
    </div>
    <p>Push-уведомления будут доступны позже. А пока сохраняем только настройку.</p>
  </section>
</template>

<style scoped lang="scss">
.field { display: grid; gap: 0.45rem; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface-card); }
label { color: var(--text); font-weight: 800; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem; }
input, button { min-height: 44px; border: 1px solid var(--stroke); border-radius: var(--radius-md); }
input { min-width: 0; padding: 0 0.7rem; background: var(--surface-2); color: var(--text); }
button { padding: 0 0.85rem; background: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, var(--stroke)); font-weight: 800; }
button:disabled { opacity: 0.55; }
p { margin: 0; color: var(--muted); font-size: 0.82rem; line-height: 1.35; }
</style>

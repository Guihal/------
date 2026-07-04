<script setup lang="ts">
const props = defineProps<{ name: string; saving: boolean }>();
const emit = defineEmits<{ save: [name: string] }>();
const draft = ref(props.name);

watch(() => props.name, (next) => {
  draft.value = next;
});

const changed = computed(() => draft.value.trim() && draft.value.trim() !== props.name);
</script>

<template>
  <form class="form" @submit.prevent="emit('save', draft.trim())">
    <label for="display-name">Имя в профиле</label>
    <div class="row">
      <input id="display-name" v-model="draft" class="tap" maxlength="80" />
      <button class="tap" type="submit" :disabled="saving || !changed">
        {{ saving ? "Сохраняем…" : "Сохранить" }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.form { display: grid; gap: 0.45rem; }
label { color: var(--muted); font-size: 0.85rem; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem; }
input, button { min-height: 44px; border-radius: var(--radius-md); border: 1px solid var(--stroke); }
input { min-width: 0; padding: 0 0.75rem; background: var(--surface); color: var(--text); }
button { padding: 0 0.8rem; background: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, var(--stroke)); font-weight: 800; }
button:disabled { opacity: 0.55; }
</style>

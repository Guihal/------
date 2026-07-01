<script setup lang="ts">
const emit = defineEmits<{ (e: "apply"): void }>();
const userId = defineModel<string>("userId", { required: true });
const action = defineModel<string>("action", { required: true });
const from = defineModel<string>("from", { required: true });
const to = defineModel<string>("to", { required: true });
</script>

<template>
  <form class="filters" @submit.prevent="emit('apply')">
    <label class="field">
      ID пользователя
      <input v-model="userId" type="text" class="tap" />
    </label>
    <label class="field">
      Действие
      <input v-model="action" type="text" class="tap" />
    </label>
    <label class="field">
      С даты
      <input v-model="from" type="date" class="tap" />
    </label>
    <label class="field">
      По дату
      <input v-model="to" type="date" class="tap" />
    </label>
    <AppButton type="submit">Применить</AppButton>
  </form>
</template>

<style scoped lang="scss">
.filters {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--muted);
}
input {
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
}
</style>

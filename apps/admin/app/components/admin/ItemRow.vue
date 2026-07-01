<script setup lang="ts">
import type { AdminItem } from "~~/api";

const props = defineProps<{ item: AdminItem }>();
const emit = defineEmits<{ (e: "disable", item: AdminItem): void }>();
</script>

<template>
  <tr>
    <td>{{ props.item.name }}</td>
    <td>{{ rarityLabel(props.item.rarity) }}</td>
    <td>{{ props.item.slot_key }}</td>
    <td>{{ statusLabel(props.item.active) }}</td>
    <td>{{ new Date(props.item.created_at).toLocaleString("ru-RU") }}</td>
    <td class="actions">
      <NuxtLink :to="`/items/${props.item.id}/edit`" class="tap">
        Редактировать
      </NuxtLink>
      <button
        type="button"
        class="tap"
        :disabled="!props.item.active"
        @click="emit('disable', props.item)"
      >
        Отключить
      </button>
    </td>
  </tr>
</template>

<style scoped lang="scss">
.actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
button {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

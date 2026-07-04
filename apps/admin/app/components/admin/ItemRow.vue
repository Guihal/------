<script setup lang="ts">
import type { AdminItem } from "~~/api";

const props = defineProps<{ item: AdminItem }>();
const emit = defineEmits<{ (e: "disable", item: AdminItem): void }>();
</script>

<template>
  <tr>
    <td>{{ props.item.name }}</td>
    <td>
      <span class="badge" :style="badgeStyle(rarityColor(props.item.rarity))">
        {{ rarityLabel(props.item.rarity) }}
      </span>
    </td>
    <td>{{ props.item.slot_key }}</td>
    <td>
      <span
        class="badge"
        :style="badgeStyle(props.item.active ? '#3fd07a' : '#9aa0ab')"
      >
        {{ statusLabel(props.item.active) }}
      </span>
    </td>
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
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
  text-transform: capitalize;
}
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

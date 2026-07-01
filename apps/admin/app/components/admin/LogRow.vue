<script setup lang="ts">
import type { AdminAuditLogEntry } from "~~/api";

defineProps<{ entry: AdminAuditLogEntry }>();
</script>

<template>
  <tr>
    <td>{{ entry.user_id ?? "—" }}</td>
    <td>{{ entry.action }}</td>
    <td>{{ new Date(entry.created_at).toLocaleString("ru-RU") }}</td>
    <td>
      <details>
        <summary>Детали</summary>
        <pre class="details-json">{{ JSON.stringify(entry.details, null, 2) }}</pre>
      </details>
    </td>
  </tr>
</template>

<style scoped lang="scss">
.details-json {
  max-width: 28rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
  color: var(--muted);
}
summary {
  cursor: pointer;
}
</style>

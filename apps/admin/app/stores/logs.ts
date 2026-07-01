import { defineStore } from "pinia";
import type { AdminAuditLogEntry } from "~~/api";

const PAGE_SIZE = 20;

export const useLogsStore = defineStore("logs", () => {
  const { api } = useAppClient();
  const items = ref<AdminAuditLogEntry[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const userId = ref("");
  const action = ref("");
  const from = ref("");
  const to = ref("");
  const offset = ref(0);
  const limit = ref(PAGE_SIZE);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.admin.logs({
        user_id: userId.value || undefined,
        action: action.value || undefined,
        from: from.value ? new Date(from.value).toISOString() : undefined,
        to: to.value ? new Date(to.value).toISOString() : undefined,
        limit: limit.value,
        offset: offset.value,
      });
      items.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = mapStoreError(e, "Не удалось загрузить журнал.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function applyFilters() {
    offset.value = 0;
    void load().catch(() => {});
  }

  function setOffset(next: number) {
    offset.value = next;
    void load().catch(() => {});
  }

  return {
    items,
    total,
    loading,
    error,
    userId,
    action,
    from,
    to,
    offset,
    limit,
    load,
    applyFilters,
    setOffset,
  };
});

import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { AdminAuditLogEntry } from "~~/api";

const PAGE_SIZE = 20;

export const useLogsStore = defineStore("logs", () => {
  const { api } = useAppClient();
  const items = ref<AdminAuditLogEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const userId = ref("");
  const action = ref("");
  const from = ref("");
  const to = ref("");
  const offset = ref(0);
  const limit = ref(PAGE_SIZE);

  const hasMore = computed(() => items.value.length === limit.value);

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
    } catch (e) {
      error.value = mapError(e, "Не удалось загрузить журнал.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function applyFilters() {
    offset.value = 0;
    void load().catch(() => {});
  }

  function prev() {
    if (offset.value <= 0) return;
    offset.value = Math.max(0, offset.value - limit.value);
    void load().catch(() => {});
  }

  function next() {
    if (!hasMore.value) return;
    offset.value += limit.value;
    void load().catch(() => {});
  }

  return {
    items,
    loading,
    error,
    userId,
    action,
    from,
    to,
    offset,
    limit,
    hasMore,
    load,
    applyFilters,
    prev,
    next,
  };
});

function mapError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

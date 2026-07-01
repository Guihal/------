import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { AdminUserSummary } from "~~/api";

const PAGE_SIZE = 20;

export const useUsersStore = defineStore("users", () => {
  const { api } = useAppClient();
  const items = ref<AdminUserSummary[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const q = ref("");
  const offset = ref(0);
  const limit = ref(PAGE_SIZE);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.admin.users({
        q: q.value || undefined,
        limit: limit.value,
        offset: offset.value,
      });
      items.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = mapError(e, "Не удалось загрузить пользователей.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function search(nextQ: string) {
    q.value = nextQ;
    offset.value = 0;
    void load().catch(() => {});
  }

  function setOffset(next: number) {
    offset.value = next;
    void load().catch(() => {});
  }

  return { items, total, loading, error, q, offset, limit, load, search, setOffset };
});

function mapError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { AdminStats } from "~~/api";

export const useDashboardStore = defineStore("dashboard", () => {
  const { api } = useAppClient();
  const stats = ref<AdminStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await api.admin.stats();
    } catch (e) {
      error.value = mapError(e, "Не удалось загрузить статистику.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { stats, loading, error, load };
});

function mapError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

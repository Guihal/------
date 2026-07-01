import { defineStore } from "pinia";
import { ApiError, FALLBACK_VISUAL_STATE } from "~~/api";
import type { VisualState } from "~~/api";

export const useVisualStore = defineStore("visual", () => {
  const { api } = useAppClient();
  const state = ref<VisualState | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const current = computed(() => state.value ?? FALLBACK_VISUAL_STATE);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      state.value = await api.visualState.get();
    } catch (e) {
      error.value = mapVisualError(e);
    } finally {
      loading.value = false;
    }
  }

  function apply(next?: VisualState | null) {
    if (next) state.value = next;
  }

  return { state, current, loading, error, load, apply };
});

function mapVisualError(e: unknown): string {
  if (e instanceof ApiError) return e.body?.message || "Не удалось загрузить оформление.";
  return "Не удалось загрузить оформление.";
}

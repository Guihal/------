import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { Settings, SettingsPatchRequest } from "~~/api";

export const useSettingsStore = defineStore("settings", () => {
  const { api } = useAppClient();
  const settings = ref<Settings | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      settings.value = await api.settings.get();
    } catch (e) {
      error.value = mapSettingsError(e, "Не удалось загрузить настройки.");
    } finally {
      loading.value = false;
    }
  }

  async function patch(body: SettingsPatchRequest) {
    if (!navigator.onLine) {
      error.value = "Нет сети. Проверьте соединение и попробуйте ещё раз.";
      return null;
    }
    saving.value = true;
    error.value = null;
    try {
      settings.value = await api.settings.patch(body);
      return settings.value;
    } catch (e) {
      error.value = mapSettingsError(e, "Не удалось сохранить настройки. Попробуйте ещё раз?");
      throw e;
    } finally {
      saving.value = false;
    }
  }

  return { settings, loading, saving, error, load, patch };
});

function mapSettingsError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

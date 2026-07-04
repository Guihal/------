import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { ActiveMascot, ProfileResponse, ProgressionSnapshot } from "~~/api";

export const useProfileStore = defineStore("profile", () => {
  const { api } = useAppClient();
  const profile = ref<ProfileResponse | null>(null);
  const mascot = ref<ActiveMascot | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const [p, m] = await Promise.all([api.profile.get(), loadMascot()]);
      profile.value = p;
      mascot.value = m;
    } catch (e) {
      error.value = mapProfileError(e, "Не удалось загрузить профиль. Проверьте соединение?");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function loadMascot() {
    try {
      return await api.inventory.mascot();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async function saveName(displayName: string) {
    saving.value = true;
    error.value = null;
    try {
      profile.value = await api.profile.patch({ display_name: displayName });
      return profile.value;
    } catch (e) {
      error.value = mapProfileError(e, "Не удалось сохранить имя. Попробуйте ещё раз?");
      throw e;
    } finally {
      saving.value = false;
    }
  }

  function applyProgression(snapshot: ProgressionSnapshot) {
    if (!profile.value) return;
    profile.value = {
      ...profile.value,
      progression: { ...profile.value.progression, ...snapshot },
    };
  }

  return { profile, mascot, loading, saving, error, load, saveName, applyProgression };
});

function mapProfileError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

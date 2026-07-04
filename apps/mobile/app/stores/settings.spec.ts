import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
}));

mockNuxtImport("useAppClient", () => {
  return () => ({
    api: { settings: { get: getMock, patch: patchMock } },
  });
});

describe("useSettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getMock.mockReset();
    patchMock.mockReset();
  });

  it("maps failed load() into a russian error message", async () => {
    getMock.mockRejectedValueOnce(new Error("network down"));
    const { useSettingsStore } = await import("./settings");
    const store = useSettingsStore();

    await store.load();

    expect(store.error).toBe("Не удалось загрузить настройки.");
    expect(store.loading).toBe(false);
    expect(store.settings).toBeNull();
  });

  it("skips patch() and reports offline error when navigator is offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { useSettingsStore } = await import("./settings");
    const store = useSettingsStore();

    const result = await store.patch({ locale: "ru" } as never);

    expect(result).toBeNull();
    expect(store.error).toBe("Нет сети. Проверьте соединение и попробуйте ещё раз.");
    expect(patchMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ApiError } from "../../../../shared/api";
import { useItemsStore } from "../../app/stores/items";

function stubAppClient(admin: unknown) {
  vi.stubGlobal("useAppClient", () => ({ api: { admin } }));
}

describe("items store: disable() error mapping", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("maps a field_errors ApiError onto store.error and rethrows", async () => {
    const disableItem = vi.fn().mockRejectedValue(
      new ApiError(409, {
        code: "conflict",
        message: "conflict",
        field_errors: { slot_key: "Слот занят другим предметом." },
      }),
    );
    stubAppClient({ disableItem });

    const store = useItemsStore();
    await expect(store.disable("item-1")).rejects.toThrow();

    expect(store.error).toBe("Слот занят другим предметом.");
  });

  it("falls back to a RU default message for a network-level failure", async () => {
    const disableItem = vi.fn().mockRejectedValue(new TypeError("network down"));
    stubAppClient({ disableItem });

    const store = useItemsStore();
    await expect(store.disable("item-1")).rejects.toThrow();

    expect(store.error).toBe("Не удалось отключить предмет.");
  });

  it("updates the item in place on success and clears the error", async () => {
    const updated = {
      id: "item-1",
      name: "Шляпа",
      description: "",
      rarity: "common",
      slot_key: "head",
      asset_url: "",
      base_xp_multiplier: 1,
      active: false,
      created_at: "2026-01-01T00:00:00Z",
    };
    const disableItem = vi.fn().mockResolvedValue(updated);
    stubAppClient({ disableItem });

    const store = useItemsStore();
    store.items = [{ ...updated, active: true }];
    store.error = "stale error";

    const result = await store.disable("item-1");

    expect(result.active).toBe(false);
    expect(store.items[0]?.active).toBe(false);
    expect(store.error).toBeNull();
  });
});

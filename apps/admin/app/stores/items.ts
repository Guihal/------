import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type {
  AdminItem,
  AdminItemCreateRequest,
  AdminItemPatchRequest,
  Rarity,
} from "~~/api";

const PAGE_SIZE = 20;

export const useItemsStore = defineStore("items", () => {
  const { api } = useAppClient();
  const items = ref<AdminItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const q = ref("");
  const rarity = ref<Rarity | "all">("all");
  const active = ref<"all" | "true" | "false">("all");
  const slot = ref("");
  const offset = ref(0);
  const limit = ref(PAGE_SIZE);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.admin.items({
        q: q.value || undefined,
        rarity: rarity.value === "all" ? undefined : rarity.value,
        active: active.value === "all" ? undefined : active.value === "true",
        slot: slot.value || undefined,
        limit: limit.value,
        offset: offset.value,
      });
      items.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = mapError(e, "Не удалось загрузить предметы.");
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

  function find(id: string): AdminItem | undefined {
    return items.value.find((item) => item.id === id);
  }

  async function create(body: AdminItemCreateRequest): Promise<AdminItem> {
    const item = await api.admin.createItem(body);
    items.value = [item, ...items.value];
    total.value += 1;
    return item;
  }

  async function patch(id: string, body: AdminItemPatchRequest): Promise<AdminItem> {
    const item = await api.admin.patchItem(id, body);
    items.value = items.value.map((i) => (i.id === id ? item : i));
    return item;
  }

  async function disable(id: string): Promise<AdminItem> {
    const item = await api.admin.disableItem(id);
    items.value = items.value.map((i) => (i.id === id ? item : i));
    return item;
  }

  async function uploadAsset(id: string, file: File): Promise<string> {
    const res = await api.admin.uploadItemAsset(id, file, file.type);
    items.value = items.value.map((i) =>
      i.id === id ? { ...i, asset_url: res.asset_url } : i,
    );
    return res.asset_url;
  }

  async function ensureLoaded(id: string): Promise<AdminItem | undefined> {
    if (find(id)) return find(id);
    await load();
    return find(id);
  }

  return {
    items,
    total,
    loading,
    error,
    q,
    rarity,
    active,
    slot,
    offset,
    limit,
    load,
    applyFilters,
    setOffset,
    find,
    create,
    patch,
    disable,
    uploadAsset,
    ensureLoaded,
  };
});

function mapError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

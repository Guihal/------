import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type { ActiveMascot, InventoryResponse, OwnedItem } from "~~/api";

export const useInventoryStore = defineStore("inventory", () => {
  const { api } = useAppClient();
  const items = ref<OwnedItem[]>([]);
  const mascot = ref<ActiveMascot | null>(null);
  const loading = ref(false);
  const mutatingId = ref<string | null>(null);
  const error = ref<string | null>(null);

  const equipped = computed(() => items.value.filter((item) => item.equipped));

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const [inventory, activeMascot] = await Promise.all([
        api.inventory.list(),
        api.inventory.mascot(),
      ]);
      applyInventory(inventory);
      mascot.value = activeMascot;
    } catch (e) {
      error.value = mapInventoryError(e, "Не удалось загрузить инвентарь.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function equip(item: OwnedItem) {
    if (!canMutate(item.id)) return;
    try {
      await api.inventory.equip(item.id);
      await reloadInventory();
    } catch (e) {
      error.value = mapInventoryError(e, "Не удалось надеть предмет.");
      throw e;
    } finally {
      mutatingId.value = null;
    }
  }

  async function unequip(item: OwnedItem) {
    if (!canMutate(item.id)) return;
    try {
      await api.inventory.unequip(item.id);
      await reloadInventory();
    } catch (e) {
      error.value = mapInventoryError(e, "Не удалось снять предмет.");
      throw e;
    } finally {
      mutatingId.value = null;
    }
  }

  function canMutate(id: string) {
    if (!navigator.onLine) {
      error.value = "Нет сети. Изменение экипировки не выполнено.";
      return false;
    }
    if (mutatingId.value) return false;
    mutatingId.value = id;
    error.value = null;
    return true;
  }

  async function reloadInventory() {
    applyInventory(await api.inventory.list());
  }

  function applyInventory(res: InventoryResponse) {
    items.value = res.items;
  }

  return { items, mascot, equipped, loading, mutatingId, error, load, equip, unequip };
});

function mapInventoryError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}

import type { Rarity } from "~~/api";

export const rarityLabels: Record<Rarity, string> = {
  common: "обычный",
  rare: "редкий",
  epic: "эпический",
  legendary: "легендарный",
};

export function rarityLabel(rarity: Rarity): string {
  return rarityLabels[rarity] ?? rarity;
}

export function statusLabel(active: boolean): string {
  return active ? "включен" : "отключен";
}

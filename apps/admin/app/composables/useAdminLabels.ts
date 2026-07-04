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

export const rarityColors: Record<Rarity, string> = {
  common: "#9aa0ab",
  rare: "#4c9bff",
  epic: "#a06bff",
  legendary: "#f5b942",
};

export function rarityColor(rarity: Rarity): string {
  return rarityColors[rarity] ?? "#9aa0ab";
}

export function badgeStyle(color: string) {
  return { color, borderColor: color, background: `${color}22` };
}

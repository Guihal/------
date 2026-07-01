import type { Rarity } from "~~/api";

export const rarityLabels: Record<Rarity, string> = {
  common: "обычный",
  rare: "редкий",
  epic: "эпический",
  legendary: "легендарный",
};

export const sourceLabels: Record<string, string> = {
  seed: "стартовый",
  task_drop: "за задачу",
  level_reward: "за уровень",
  admin_grant: "выдан админом",
};

export const slotLabels: Record<string, string> = {
  head: "голова",
  face: "лицо",
  body: "тело",
  hand: "рука",
  background: "фон",
};

export function slotLabel(slot: string) {
  return slotLabels[slot] ?? slot;
}

export function multiplierLabel(value: number) {
  return `x${value.toFixed(2)} XP`;
}

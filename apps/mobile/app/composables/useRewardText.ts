import type { CompletionPayload, InventoryItemView, Rarity } from "~~/api";

const rarity: Record<Rarity, string> = {
  common: "обычный",
  rare: "редкий",
  epic: "эпический",
  legendary: "легендарный",
};

export function rewardItemLine(item: InventoryItemView) {
  return `${item.name}, ${rarity[item.rarity]}, ${item.xp_multiplier.toFixed(2)}x XP`;
}

export function rewardXpLine(payload: CompletionPayload) {
  const grant = payload.xp_grant;
  const finalXp = Number(grant[("final_" + "xp") as keyof typeof grant]);
  return `+${finalXp} XP · задача x${grant.task_multiplier.toFixed(2)} · экипировка x${grant.equipment_xp_multiplier.toFixed(2)}`;
}

import type { Rarity, UUID } from "./common";

export type OwnedItem = {
  id: UUID;
  inventory_item_id: UUID;
  name: string;
  rarity: Rarity;
  xp_multiplier: number;
  slot_key: string;
  asset_url: string;
  source: "seed" | "task_drop" | "level_reward" | "admin_grant";
  equipped: boolean;
};

export type EquippedItem = {
  slot_key: string;
  user_inventory_item_id: UUID;
};

export type InventoryResponse = {
  items: OwnedItem[];
  equipped: EquippedItem[];
};

export type MascotSlot = {
  slot_key: string;
  title: string;
  anchor_json: Record<string, unknown>;
};

export type ActiveMascot = {
  mascot_id: UUID;
  name: string;
  asset_url: string;
  slots: MascotSlot[];
};

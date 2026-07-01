import type { Direction, ISODateTime, Rarity, Role, UUID } from "./common";

export type AdminListQuery = {
  q?: string;
  sort?: string;
  dir?: Direction;
  limit?: number;
  offset?: number;
};

export type AdminUsersQuery = AdminListQuery & {
  role?: Role;
};

export type AdminUserSummary = {
  id: UUID;
  email: string;
  name: string;
  role: Role;
  level: number;
  xp: number;
  created_at: ISODateTime;
};

export type AdminUsersResponse = {
  items: AdminUserSummary[];
  total: number;
};

export type AdminItem = {
  id: UUID;
  name: string;
  description: string;
  rarity: Rarity;
  slot_key: string;
  asset_url: string;
  base_xp_multiplier: number;
  active: boolean;
  created_at: ISODateTime;
};

export type AdminItemsQuery = AdminListQuery & {
  rarity?: Rarity;
  active?: boolean;
  slot?: string;
};

export type AdminItemsResponse = {
  items: AdminItem[];
  total: number;
};

export type AdminItemCreateRequest = {
  name: string;
  description?: string;
  rarity: Rarity;
  slot_key: string;
  base_xp_multiplier?: number;
};

export type AdminItemPatchRequest = Partial<
  Omit<AdminItemCreateRequest, "rarity">
>;

export type AdminAssetUploadResponse = {
  asset_url: string;
};

export type AdminStats = {
  users: number;
  tasks: number;
  completed_tasks: number;
  reward_rolls: number;
  items: number;
  granted_items: number;
};

export type AdminAuditLogQuery = {
  user_id?: UUID;
  action?: string;
  from?: ISODateTime;
  to?: ISODateTime;
  limit?: number;
  offset?: number;
};

export type AdminAuditLogEntry = {
  id: UUID;
  user_id: UUID | null;
  action: string;
  details: Record<string, unknown>;
  created_at: ISODateTime;
};

export type AdminAuditLogsResponse = {
  items: AdminAuditLogEntry[];
  total: number;
};

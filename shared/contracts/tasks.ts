import type { ISODateTime, Rarity, UUID } from "./common";
import type { ProgressionSnapshot } from "./profile";
import type { VisualState } from "./visual-settings";

export type TaskStatus = "active" | "completed" | "archived";
export type TaskPriority = "low" | "normal" | "high";
export type TaskComplexity = "tiny" | "small" | "medium" | "large";

export type Task = {
  id: UUID;
  category_id?: UUID | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: TaskComplexity;
  deadline_at?: ISODateTime | null;
  completed_at?: ISODateTime | null;
  archived_at?: ISODateTime | null;
  overdue: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type TaskCreateRequest = {
  title: string;
  description?: string;
  category_id?: UUID | null;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  deadline_at?: ISODateTime | null;
};

export type TaskPatchRequest = Partial<TaskCreateRequest>;

export type TaskListQuery = {
  status?: TaskStatus | "all";
  category_id?: UUID;
  priority?: TaskPriority;
  sort?: "overdue" | "deadline" | "created_at";
  limit?: number;
  offset?: number;
};

export type TaskListResponse = {
  items: Task[];
  total: number;
  limit: number;
  offset: number;
};

export type XPGrant = {
  readonly base_xp: number;
  readonly task_multiplier: number;
  readonly equipment_xp_multiplier: number;
  readonly final_xp: number;
};

export type CompletionPayload = {
  task: Pick<Task, "id" | "status">;
  is_fresh_completion_event: boolean;
  xp_grant: XPGrant;
  progression_before: ProgressionSnapshot;
  progression_after: ProgressionSnapshot;
  level_ups: readonly number[];
  level_rewards: readonly LevelReward[];
  task_drop: DropResult;
  visual_state?: VisualState | null;
};

export type LevelReward = {
  readonly level: number;
  item: InventoryItemView;
};

export type DropResult = {
  dropped: boolean;
  rarity?: Rarity;
  item?: InventoryItemView | null;
};

export type InventoryItemView = {
  id: UUID;
  inventory_item_id: UUID;
  name: string;
  rarity: Rarity;
  xp_multiplier: number;
  slot_key: string;
  asset_url: string;
};

export type TaskCategory = {
  id: UUID;
  title: string;
  color: string;
  is_system: boolean;
};

export type TaskCategoryListResponse = {
  items: TaskCategory[];
};

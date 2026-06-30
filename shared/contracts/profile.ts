export type ProfilePatchRequest = {
  display_name: string;
};

export type Progression = {
  readonly level: number;
  readonly xp_total: number;
  readonly xp_in_current_level: number;
  readonly xp_to_next_level: number;
  readonly xp_per_level: number;
};

export type ProgressionSnapshot = Omit<Progression, "xp_per_level">;

export type ProfileStats = {
  tasks_created: number;
  tasks_completed: number;
  tasks_archived: number;
};

export type ProfileResponse = {
  display_name: string;
  progression: Progression;
  stats: ProfileStats;
};

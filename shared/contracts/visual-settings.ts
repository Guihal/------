export type Settings = {
  notifications_enabled: boolean;
  default_reminder_minutes_before_deadline: number;
  disable_visual_randomness: boolean;
  reduced_motion: boolean;
};

export type SettingsPatchRequest = Partial<Settings>;

export type VisualRefreshEvent =
  | "app-enter"
  | "page-enter"
  | "task-created"
  | "task-completed"
  | "level-up"
  | "manual-refresh";

export type VisualRefreshRequest = {
  event: VisualRefreshEvent;
};

export type VisualState = {
  accent_color: string;
  background_variant: "dark-ember" | "deep-forest" | "midnight";
  card_variant: "graphite" | "pine" | "plum";
  task_button_text: string;
  task_list_heading: string;
  profile_background: "quiet-grid" | "night-lines" | "calm-shapes";
  decorative_detail: "soft-sparks" | "thin-rings" | "small-dots";
  level_up_text: string;
  empty_state_text: string;
};

export type Difficulty = "low" | "normal" | "high";
export type Category = "general" | "work" | "personal" | "health";
export type Size = "tiny" | "small" | "medium" | "large";

export interface TaskRow {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  difficulty: Difficulty;
  category: Category;
  size: Size;
  deadline: Date | null;
  completed: boolean;
  archived: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  difficulty?: Difficulty;
  category?: Category;
  size?: Size;
  deadline?: Date | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  difficulty?: Difficulty;
  category?: Category;
  size?: Size;
  deadline?: Date | null;
}

export interface User {
  id: number
  email: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface RegisterResponse {
  id: number
  email: string
}

export type TaskDifficulty = 'low' | 'normal' | 'high'
export type TaskCategory = 'general' | 'work' | 'personal' | 'health'
export type TaskSize = 'tiny' | 'small' | 'medium' | 'large'

export interface Task {
  id: number
  user_id: number
  title: string
  description: string | null
  difficulty: TaskDifficulty
  category: TaskCategory
  size: TaskSize
  deadline: string | null
  completed: boolean
  archived: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TasksResponse {
  tasks: Task[]
}

export interface TaskResponse {
  task: Task
}

export interface Profile {
  id: number
  email: string
  role: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
}

export interface Progression {
  xp: number
  level: number
  next_level_xp: number
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface InventoryItem {
  id: number
  item_id: number
  name: string
  rarity: Rarity
  asset_url: string
  quantity: number
  equipped: boolean
}

export interface InventoryResponse {
  items: InventoryItem[]
}

export interface RewardDrop {
  item_id: number
  name: string
  rarity: Rarity
}

export interface RewardLevelUp {
  item_id: number
  name: string
  rarity: Rarity
}

export interface TaskCompleteResponse {
  task: Task
  xp_gained: number
  reward: {
    drop?: RewardDrop
    level?: RewardLevelUp
  } | null
}

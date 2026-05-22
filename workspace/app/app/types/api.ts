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

export type TaskPriority = 'low' | 'normal' | 'high'
export type TaskStatus = 'pending' | 'completed' | 'archived'

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_at: string | null
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
  xp: number
  level: number
  tasks_completed: number
  created_at: string
}

export interface Progression {
  level: number
  xp: number
  xp_to_next: number
  tasks_completed: number
}

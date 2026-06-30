import type {
  ActiveMascot,
  AdminAssetUploadResponse,
  AdminAuditLogQuery,
  AdminAuditLogsResponse,
  AdminItem,
  AdminItemCreateRequest,
  AdminItemPatchRequest,
  AdminItemsQuery,
  AdminItemsResponse,
  AdminStats,
  AdminUsersQuery,
  AdminUsersResponse,
  AuthResponse,
  AuthUser,
  CompletionPayload,
  EquippedItem,
  InventoryResponse,
  LoginRequest,
  ProfilePatchRequest,
  ProfileResponse,
  Progression,
  RefreshRequest,
  RegisterRequest,
  Settings,
  SettingsPatchRequest,
  Task,
  TaskCategoryListResponse,
  TaskCreateRequest,
  TaskListQuery,
  TaskListResponse,
  TaskPatchRequest,
  VisualRefreshRequest,
  VisualState,
} from "../contracts";
import type { ApiClient } from "./client";

export function createEndpointClient(api: ApiClient) {
  return {
    auth: {
      register: (body: RegisterRequest) => api.request<AuthResponse>("/auth/register", { method: "POST", body, auth: false }),
      login: (body: LoginRequest) => api.request<AuthResponse>("/auth/login", { method: "POST", body, auth: false }),
      refresh: (body: RefreshRequest) => api.request<AuthResponse>("/auth/refresh", { method: "POST", body, auth: false }),
      logout: (body: RefreshRequest) => api.request<void>("/auth/logout", { method: "POST", body }),
      me: () => api.request<AuthUser>("/auth/me"),
    },
    profile: {
      get: () => api.request<ProfileResponse>("/profile"),
      patch: (body: ProfilePatchRequest) => api.request<ProfileResponse>("/profile", { method: "PATCH", body }),
      progression: () => api.request<Progression>("/profile/progression"),
    },
    tasks: {
      list: (query?: TaskListQuery) => api.request<TaskListResponse>("/tasks", { query }),
      create: (body: TaskCreateRequest) => api.request<Task>("/tasks", { method: "POST", body }),
      get: (id: string) => api.request<Task>(`/tasks/${id}`),
      patch: (id: string, body: TaskPatchRequest) => api.request<Task>(`/tasks/${id}`, { method: "PATCH", body }),
      complete: (id: string) => api.request<CompletionPayload>(`/tasks/${id}/complete`, { method: "POST" }),
      archive: (id: string) => api.request<Task>(`/tasks/${id}/archive`, { method: "POST" }),
      categories: () => api.request<TaskCategoryListResponse>("/task-categories"),
    },
    inventory: {
      list: () => api.request<InventoryResponse>("/inventory"),
      mascot: () => api.request<ActiveMascot>("/mascot/active"),
      equip: (id: string) => api.request<EquippedItem>(`/inventory/${id}/equip`, { method: "POST" }),
      unequip: (id: string) => api.request<void>(`/inventory/${id}/unequip`, { method: "POST" }),
    },
    settings: {
      get: () => api.request<Settings>("/settings"),
      patch: (body: SettingsPatchRequest) => api.request<Settings>("/settings", { method: "PATCH", body }),
    },
    visualState: {
      get: () => api.request<VisualState>("/visual-state"),
      refresh: (body: VisualRefreshRequest) => api.request<VisualState>("/visual-state/refresh", { method: "POST", body }),
    },
    admin: {
      users: (query?: AdminUsersQuery) => api.request<AdminUsersResponse>("/admin/users", { query }),
      items: (query?: AdminItemsQuery) => api.request<AdminItemsResponse>("/admin/items", { query }),
      createItem: (body: AdminItemCreateRequest) => api.request<AdminItem>("/admin/items", { method: "POST", body }),
      patchItem: (id: string, body: AdminItemPatchRequest) => api.request<AdminItem>(`/admin/items/${id}`, { method: "PATCH", body }),
      disableItem: (id: string) => api.request<AdminItem>(`/admin/items/${id}/disable`, { method: "POST" }),
      uploadItemAsset: (id: string, body: Blob, contentType: string) =>
        api.request<AdminAssetUploadResponse>(`/admin/items/${id}/assets`, {
          method: "POST",
          body,
          headers: { "content-type": contentType },
        }),
      stats: () => api.request<AdminStats>("/admin/stats"),
      logs: (query?: AdminAuditLogQuery) => api.request<AdminAuditLogsResponse>("/admin/logs", { query }),
    },
  };
}

export type EndpointClient = ReturnType<typeof createEndpointClient>;

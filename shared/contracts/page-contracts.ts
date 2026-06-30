import type { StoreActionRule } from "./common";

export type PageContract = {
  app: "mobile" | "admin";
  page: string;
  enterEndpoints: readonly string[];
  dataShape: readonly string[];
  states: readonly ("loading" | "empty" | "error" | "ready")[];
  actions: readonly StoreActionRule[];
  forbiddenLocalMechanics: readonly (
    | "xp"
    | "reward"
    | "level"
    | "visual-random"
  )[];
};

const states = ["loading", "empty", "error", "ready"] as const;
const noLocalMechanics = ["xp", "reward", "level", "visual-random"] as const;

export const mobilePageContracts = {
  bootstrap: {
    app: "mobile",
    page: "bootstrap",
    enterEndpoints: [
      "GET /auth/me",
      "GET /profile",
      "GET /profile/progression",
      "GET /settings",
      "GET /visual-state",
      "GET /tasks?status=active",
    ],
    dataShape: ["AuthUser", "ProfileResponse", "Settings", "VisualState", "TaskListResponse"],
    states,
    actions: [],
    forbiddenLocalMechanics: noLocalMechanics,
  },
  tasks: {
    app: "mobile",
    page: "tasks",
    enterEndpoints: ["GET /tasks", "GET /task-categories"],
    dataShape: ["TaskListResponse", "TaskCategoryListResponse"],
    states,
    actions: [
      { action: "create", endpoint: "POST /tasks", storeUpdate: "append" },
      { action: "complete", endpoint: "POST /tasks/:id/complete", storeUpdate: "merge" },
      { action: "archive", endpoint: "POST /tasks/:id/archive", storeUpdate: "merge" },
    ],
    forbiddenLocalMechanics: noLocalMechanics,
  },
  inventory: {
    app: "mobile",
    page: "inventory",
    enterEndpoints: ["GET /inventory", "GET /mascot/active"],
    dataShape: ["InventoryResponse", "ActiveMascot"],
    states,
    actions: [
      { action: "equip", endpoint: "POST /inventory/:id/equip", storeUpdate: "replace" },
      { action: "unequip", endpoint: "POST /inventory/:id/unequip", storeUpdate: "replace" },
    ],
    forbiddenLocalMechanics: noLocalMechanics,
  },
} satisfies Record<string, PageContract>;

export const adminPageContracts = {
  dashboard: {
    app: "admin",
    page: "dashboard",
    enterEndpoints: ["GET /auth/me", "GET /admin/stats"],
    dataShape: ["AuthUser", "AdminStats"],
    states,
    actions: [],
    forbiddenLocalMechanics: noLocalMechanics,
  },
  items: {
    app: "admin",
    page: "items",
    enterEndpoints: ["GET /admin/items"],
    dataShape: ["AdminItemsResponse"],
    states,
    actions: [
      { action: "create", endpoint: "POST /admin/items", storeUpdate: "append" },
      { action: "patch", endpoint: "PATCH /admin/items/:id", storeUpdate: "merge" },
      { action: "disable", endpoint: "POST /admin/items/:id/disable", storeUpdate: "merge" },
    ],
    forbiddenLocalMechanics: noLocalMechanics,
  },
} satisfies Record<string, PageContract>;

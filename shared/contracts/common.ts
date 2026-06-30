export type ISODateTime = string;
export type UUID = string;

export type ApiErrorResponse = {
  code: string;
  message: string;
  field_errors?: Record<string, string>;
  request_id?: string;
};

export type ListMeta = {
  total: number;
  limit?: number;
  offset?: number;
};

export type Role = "user" | "admin";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Direction = "asc" | "desc";

export type PageStateKey = "idle" | "loading" | "ready" | "empty" | "error";

export type StoreActionRule = {
  action: string;
  endpoint: string;
  storeUpdate: "replace" | "merge" | "append" | "remove" | "reset-session";
};

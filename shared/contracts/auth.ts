import type { ISODateTime, Role, UUID } from "./common";

export type RegisterRequest = {
  email: string;
  password: string;
  display_name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refresh_token: string;
};

export type AuthUser = {
  id: UUID;
  email: string;
  role: Role;
  display_name: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  access_expires_at: ISODateTime;
  user: AuthUser;
};

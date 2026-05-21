export type Role = "user" | "admin";

export function isAdmin(role: Role): boolean {
  return role === "admin";
}

export function requireAdmin(role: Role): void {
  if (!isAdmin(role)) {
    const err = new Error("Forbidden: admin role required");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
}

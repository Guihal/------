import { ApiError } from "~~/api";

export function mapStoreError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const fe = e.body?.field_errors;
    if (fe && Object.keys(fe).length) return Object.values(fe).join(" ");
    return e.body?.message || fallback;
  }
  return fallback;
}

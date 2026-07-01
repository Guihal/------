import type { AppApiClient } from "./useApiClient";

// Reads the app-wide API client provided by plugins/api.client.ts.
// Auto-imported (composables/ dir).
export function useAppClient(): AppApiClient {
  return useNuxtApp().$appClient as AppApiClient;
}

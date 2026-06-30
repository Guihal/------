import {
  createApiClient,
  createEndpointClient,
  createMemoryAccessTokenStore,
  type AccessTokenStore,
  type ApiClient,
  type EndpointClient,
} from "~~/api";
import type { RefreshRequest, AuthResponse } from "~~/api";

export type AppApiClient = {
  api: EndpointClient;
  tokenStore: AccessTokenStore;
  client: ApiClient;
  setOnUnauthorized: (fn: () => void) => void;
};

// Factory: builds the singleton API client wiring shared/api with our
// memory access-token store + secure-storage-backed refresh. The store wires
// onUnauthorized after Pinia exists (see plugins/api.client.ts).
export function createAppApiClient(baseUrl: string): AppApiClient {
  const tokenStore = createMemoryAccessTokenStore();
  let onUnauthorized: (() => void) | undefined;

  const client = createApiClient({
    baseUrl,
    tokenStore,
    // Defined below; only invoked at runtime (after `client` exists).
    refreshAccessToken: async () => refreshAccessToken(),
    onUnauthorized: () => onUnauthorized?.(),
  });
  const api = createEndpointClient(client);

  const refreshAccessToken = async (): Promise<string | null> => {
    const { getRefreshToken, setRefreshToken } = useSecureStorage();
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const body: RefreshRequest = { refresh_token: refreshToken };
    const res: AuthResponse = await client.request<AuthResponse>(
      "/auth/refresh",
      { method: "POST", body, auth: false },
    );
    await setRefreshToken(res.refresh_token);
    tokenStore.set(res.access_token);
    return res.access_token;
  };

  return {
    api,
    tokenStore,
    client,
    setOnUnauthorized: (fn) => {
      onUnauthorized = fn;
    },
  };
}

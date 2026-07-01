import {
  createApiClient,
  createEndpointClient,
  createMemoryAccessTokenStore,
  type AccessTokenStore,
  type ApiClient,
  type EndpointClient,
} from "~~/api";
import type { RefreshRequest, AuthResponse } from "~~/api";
import { useMemoryRefreshToken } from "./useMemoryRefreshToken";

export type AppApiClient = {
  api: EndpointClient;
  tokenStore: AccessTokenStore;
  client: ApiClient;
  setOnUnauthorized: (fn: () => void) => void;
};

// Factory: builds the singleton API client wiring shared/api with our
// memory access-token store + memory-only refresh token. Both tokens are
// lost on reload by design — see useMemoryRefreshToken.ts.
export function createAppApiClient(baseUrl: string): AppApiClient {
  const tokenStore = createMemoryAccessTokenStore();
  const { getRefreshToken, setRefreshToken } = useMemoryRefreshToken();
  let onUnauthorized: (() => void) | undefined;

  const client = createApiClient({
    baseUrl,
    tokenStore,
    refreshAccessToken: async () => refreshAccessToken(),
    onUnauthorized: () => onUnauthorized?.(),
  });
  const api = createEndpointClient(client);

  const refreshAccessToken = async (): Promise<string | null> => {
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

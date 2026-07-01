import { createAppApiClient } from "~/composables/useApiClient";

export default defineNuxtPlugin(async (nuxtApp) => {
  const baseUrl = useRuntimeConfig().public.apiBaseUrl;
  const appClient = createAppApiClient(baseUrl);

  // Provide BEFORE instantiating the store: the store's setup reads the
  // injected client via useAppClient().
  nuxtApp.provide("appClient", appClient);

  // Wire auth-store teardown into the shared client's 401 path.
  const auth = useAuthStore();
  appClient.setOnUnauthorized(() => {
    void auth.handleUnauthorized();
  });

  // Await bootstrap BEFORE route middleware runs. Since the refresh token is
  // memory-only, a fresh page load normally has none — bootstrap resolves
  // straight to "ready, not authenticated", which is expected.
  await auth.bootstrap();
});

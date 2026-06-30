import { createAppApiClient } from "~/composables/useApiClient";

// Client-only (ssr:false guarantees browser, but Capacitor plugins still must
// not be imported during any prerender — `.client` keeps it explicit).
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

  // Await bootstrap BEFORE route middleware runs so a valid persisted
  // session is not treated as "logged out" on first navigation.
  await auth.bootstrap();
});

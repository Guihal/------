import { defineStore } from "pinia";
import type { AuthUser, LoginRequest, RegisterRequest } from "~~/api";
import { ApiError } from "~~/api";

export type AuthStatus = "idle" | "bootstrapping" | "ready";

type AppApiClient = ReturnType<typeof useAppClient>;

// Thin auth store: state + loading/error + actions around the shared API
// client. NO XP / level / reward / drop / equip math lives here.
export const useAuthStore = defineStore("auth", () => {
  const { api, tokenStore } = useAppClient();
  const { setRefreshToken, getRefreshToken, clearRefreshToken } =
    useSecureStorage();

  const user = ref<AuthUser | null>(null);
  const status = ref<AuthStatus>("idle");
  const error = ref<string | null>(null);

  const isAuthenticated = computed(
    () => status.value === "ready" && !!user.value && !!tokenStore.get(),
  );

  function setSession(access: string, u: AuthUser) {
    tokenStore.set(access);
    user.value = u;
    status.value = "ready";
    error.value = null;
  }

  async function clearSession() {
    tokenStore.clear();
    user.value = null;
    await clearRefreshToken();
  }

  async function bootstrap() {
    status.value = "bootstrapping";
    const rt = await getRefreshToken();
    if (!rt) {
      status.value = "ready";
      return;
    }
    // Refresh once: valid session → stay; fail/expired → drop to login.
    try {
      const me = await api.auth.me();
      user.value = me;
    } catch {
      await clearRefreshToken();
    } finally {
      status.value = "ready";
    }
  }

  async function login(form: LoginRequest) {
    error.value = null;
    try {
      const res = await api.auth.login(form);
      await setRefreshToken(res.refresh_token);
      setSession(res.access_token, res.user);
    } catch (e) {
      error.value = mapError(e, "Не удалось войти. Проверьте email и пароль.");
      throw e;
    }
  }

  async function register(form: RegisterRequest) {
    error.value = null;
    try {
      const res = await api.auth.register(form);
      await setRefreshToken(res.refresh_token);
      setSession(res.access_token, res.user);
    } catch (e) {
      error.value = mapError(e, "Не удалось зарегистрироваться.");
      throw e;
    }
  }

  async function logout() {
    const rt = await getRefreshToken();
    if (rt) {
      try {
        await api.auth.logout({ refresh_token: rt });
      } catch {
        // Best-effort: clear local state regardless.
      }
    }
    await clearSession();
    status.value = "ready";
  }

  async function handleUnauthorized() {
    await clearSession();
    status.value = "ready";
    await navigateTo("/login?expired=1");
  }

  return {
    user,
    status,
    error,
    isAuthenticated,
    bootstrap,
    login,
    register,
    logout,
    handleUnauthorized,
  };
});

function mapError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const fe = e.body?.field_errors;
    if (fe && Object.keys(fe).length) return Object.values(fe).join(" ");
    return e.body?.message || fallback;
  }
  return fallback;
}

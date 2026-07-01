import { defineStore } from "pinia";
import type { AuthUser, LoginRequest } from "~~/api";

export type AuthStatus = "idle" | "bootstrapping" | "ready";

const ROLE_DENIED = "У этой учетной записи нет доступа к админ-панели";

// Thin auth store: state + loading/error + actions around the shared API
// client. NO XP / level / reward / drop / equip math lives here.
export const useAuthStore = defineStore("auth", () => {
  const { api, tokenStore } = useAppClient();
  const { setRefreshToken, getRefreshToken, clearRefreshToken } =
    useMemoryRefreshToken();

  const user = ref<AuthUser | null>(null);
  const status = ref<AuthStatus>("idle");
  const error = ref<string | null>(null);

  const isAuthenticated = computed(
    () =>
      status.value === "ready" &&
      !!user.value &&
      user.value.role === "admin" &&
      !!tokenStore.get(),
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
    try {
      const me = await api.auth.me();
      if (me.role === "admin") {
        user.value = me;
      } else {
        await clearSession();
      }
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
      if (res.user.role !== "admin") {
        await revokeSilently(res.refresh_token);
        error.value = ROLE_DENIED;
        throw new Error(ROLE_DENIED);
      }
      await setRefreshToken(res.refresh_token);
      setSession(res.access_token, res.user);
    } catch (e) {
      if (!error.value) {
        error.value = mapStoreError(e, "Не удалось войти. Проверьте email и пароль.");
      }
      throw e;
    }
  }

  async function revokeSilently(refreshToken: string) {
    try {
      await api.auth.logout({ refresh_token: refreshToken });
    } catch {
      // Best-effort: the account has no admin session to clear locally.
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
    logout,
    handleUnauthorized,
  };
});

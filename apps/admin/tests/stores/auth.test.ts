import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../../app/stores/auth";

function makeTokenStore() {
  let token: string | null = null;
  return {
    get: vi.fn(() => token),
    set: vi.fn((t: string) => {
      token = t;
    }),
    clear: vi.fn(() => {
      token = null;
    }),
  };
}

function stubAppClient(api: unknown, tokenStore: ReturnType<typeof makeTokenStore>) {
  vi.stubGlobal("useAppClient", () => ({ api, tokenStore }));
}

function stubRefreshToken() {
  vi.stubGlobal("useMemoryRefreshToken", () => ({
    getRefreshToken: vi.fn().mockResolvedValue(null),
    setRefreshToken: vi.fn(),
    clearRefreshToken: vi.fn(),
  }));
}

describe("auth store: admin role gate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("rejects a non-admin login, revokes the session and sets a RU error", async () => {
    const tokenStore = makeTokenStore();
    const logout = vi.fn().mockResolvedValue(undefined);
    const login = vi.fn().mockResolvedValue({
      access_token: "at",
      refresh_token: "rt",
      user: { id: "1", email: "u@x.com", role: "user", display_name: "U" },
    });
    stubAppClient({ auth: { login, logout } }, tokenStore);
    stubRefreshToken();

    const store = useAuthStore();
    await expect(
      store.login({ email: "u@x.com", password: "pw" }),
    ).rejects.toThrow();

    expect(logout).toHaveBeenCalledWith({ refresh_token: "rt" });
    expect(store.user).toBeNull();
    expect(store.error).toBe(
      "У этой учетной записи нет доступа к админ-панели",
    );
    expect(store.isAuthenticated).toBe(false);
    expect(tokenStore.set).not.toHaveBeenCalled();
  });

  it("accepts an admin login and opens an authenticated session", async () => {
    const tokenStore = makeTokenStore();
    const setRefreshToken = vi.fn();
    const login = vi.fn().mockResolvedValue({
      access_token: "at",
      refresh_token: "rt",
      user: { id: "2", email: "admin@x.com", role: "admin", display_name: "A" },
    });
    stubAppClient({ auth: { login, logout: vi.fn() } }, tokenStore);
    vi.stubGlobal("useMemoryRefreshToken", () => ({
      getRefreshToken: vi.fn().mockResolvedValue(null),
      setRefreshToken,
      clearRefreshToken: vi.fn(),
    }));

    const store = useAuthStore();
    await store.login({ email: "admin@x.com", password: "pw" });

    expect(setRefreshToken).toHaveBeenCalledWith("rt");
    expect(store.user?.role).toBe("admin");
    expect(store.error).toBeNull();
    expect(store.isAuthenticated).toBe(true);
  });
});

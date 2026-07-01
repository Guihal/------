// Memory-only refresh token holder. The backend has no httpOnly-cookie
// refresh support, and admin must not use localStorage/sessionStorage for
// secrets (RULES.md §5). So the refresh token — like the access token —
// lives only in a module-level variable for the lifetime of the tab. A page
// reload intentionally loses the session; the user must log in again. This
// is the spec-compliant MVP behaviour for the admin app (packet P13).
let refreshToken: string | null = null;

export function useMemoryRefreshToken() {
  return {
    getRefreshToken: async (): Promise<string | null> => refreshToken,
    setRefreshToken: async (token: string): Promise<void> => {
      refreshToken = token;
    },
    clearRefreshToken: async (): Promise<void> => {
      refreshToken = null;
    },
  };
}

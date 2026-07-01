import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

// DEV-FALLBACK (escalation rule, packet P10): on the WEB platform this
// plugin's implementation falls back to localStorage (base64-encoded). That
// is acceptable ONLY for local browser development. On native Android it
// uses AndroidKeyStore + SharedPreferences (encrypted), on iOS the Keychain
// — that native path is the production source of truth for the refresh
// token. Never store the access token here; access token is memory-only
// (see createMemoryAccessTokenStore).

const REFRESH_TOKEN_KEY = "rt";

async function read(key: string): Promise<string | null> {
  try {
    const { value } = await SecureStoragePlugin.get({ key });
    return value ?? null;
  } catch {
    return localFallback().getItem(key);
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    await SecureStoragePlugin.set({ key, value });
  } catch {
    localFallback().setItem(key, value);
  }
}

async function remove(key: string): Promise<void> {
  try {
    await SecureStoragePlugin.remove({ key });
  } catch {
    localFallback().removeItem(key);
  }
}

function localFallback(): Storage {
  return window.localStorage;
}

export function useSecureStorage() {
  return {
    getRefreshToken: () => read(REFRESH_TOKEN_KEY),
    setRefreshToken: (token: string) => write(REFRESH_TOKEN_KEY, token),
    clearRefreshToken: () => remove(REFRESH_TOKEN_KEY),
  };
}

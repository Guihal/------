export type AccessTokenStore = {
  get(): string | null;
  set(token: string | null): void;
  clear(): void;
};

export function createMemoryAccessTokenStore(): AccessTokenStore {
  let accessToken: string | null = null;

  return {
    get: () => accessToken,
    set: (token) => {
      accessToken = token;
    },
    clear: () => {
      accessToken = null;
    },
  };
}

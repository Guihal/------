export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  return {
    fetch: <T>(path: string, opts: Parameters<typeof $fetch>[1] = {}) =>
      $fetch<T>(path, {
        baseURL: config.public.apiBase as string,
        ...opts,
        headers: {
          Authorization: `Bearer ${auth.token}`,
          ...(opts.headers || {}),
        },
      }),
  }
}

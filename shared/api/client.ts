import type { ApiErrorResponse } from "../contracts";
import { ApiError } from "./errors";
import type { AccessTokenStore } from "./token-store";

export type RefreshAccessToken = () => Promise<string | null>;

export type ApiClientOptions = {
  baseUrl: string;
  tokenStore: AccessTokenStore;
  refreshAccessToken?: RefreshAccessToken;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
};

export type RequestOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
};

export type ApiClient = {
  request<TResponse, TBody = unknown>(
    path: string,
    options?: RequestOptions<TBody>,
  ): Promise<TResponse>;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetcher = options.fetchImpl ?? fetch;
  let refreshPromise: Promise<string | null> | null = null;

  async function run<TResponse, TBody>(
    path: string,
    requestOptions: RequestOptions<TBody>,
    retried: boolean,
  ): Promise<TResponse> {
    const response = await fetcher(buildUrl(options.baseUrl, path, requestOptions.query), {
      method: requestOptions.method ?? "GET",
      headers: buildHeaders(options.tokenStore.get(), requestOptions),
      body: encodeBody(requestOptions.body),
    });

    if (response.status === 401 && requestOptions.auth !== false) {
      if (!retried) {
        let refreshed: string | null = null;
        try {
          refreshed = await refreshAccessToken();
        } catch {
          // ponytail: refresh reject (network/offline) → treat as failure, fall through to teardown
          refreshed = null;
        }
        if (refreshed) {
          options.tokenStore.set(refreshed);
          return run(path, requestOptions, true);
        }
      }
      options.tokenStore.clear();
      options.onUnauthorized?.();
    }

    if (!response.ok) {
      throw new ApiError(response.status, await readError(response));
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  function refreshAccessToken(): Promise<string | null> {
    if (!options.refreshAccessToken) return Promise.resolve(null);
    refreshPromise ??= options.refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  return {
    request: (path, requestOptions = {}) => run(path, requestOptions, false),
  };
}

function buildHeaders<TBody>(
  token: string | null,
  options: RequestOptions<TBody>,
): Record<string, string> {
  const headers: Record<string, string> = { ...options.headers };
  if (hasJsonBody(options.body)) {
    headers["content-type"] = "application/json";
  }
  if (token && options.auth !== false) {
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

function hasJsonBody(body: unknown): boolean {
  return (
    body !== undefined &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)
  );
}

function encodeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData || body instanceof Blob) return body;
  return JSON.stringify(body);
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const url = new URL(path, baseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function readError(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return { code: "internal_error", message: response.statusText || "Request failed" };
  }
}

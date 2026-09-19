import { routes, type RouteName } from "@aijee/protocol";

export interface RequestOptions {
  path?: Record<string, string | number | undefined>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  baseUrl?: string;
}

export interface ApiResult {
  data?: unknown;
  error?: unknown;
  response: Response;
}

export function unwrapResult<T>(result: { data?: unknown; error?: unknown }): T {
  if (result.error !== undefined && result.error !== null) {
    const error = result.error;
    if (typeof error === "object" && error !== null && "error" in error) throw new Error((error as { error: string }).error);
    throw new Error("Request failed");
  }
  const body = result.data;
  if (body !== null && body !== undefined && typeof body === "object" && "success" in body) {
    const envelope = body as { success: boolean; data?: T; error?: string };
    if (!envelope.success) throw new Error(envelope.error ?? "Request failed");
    return envelope.data as T;
  }
  return body as T;
}

export class ApiTransport {
  serverUrl: string;
  accessToken: string;
  onAuthError?: () => Promise<string | null>;

  constructor(serverUrl: string, accessToken: string) {
    this.serverUrl = serverUrl;
    this.accessToken = accessToken;
  }

  updateConfig(serverUrl: string, accessToken: string): void {
    this.serverUrl = serverUrl;
    this.accessToken = accessToken;
  }

  updateToken(accessToken: string): void { this.accessToken = accessToken; }
  setAuthErrorHandler(handler: () => Promise<string | null>): void { this.onAuthError = handler; }

  async request(operation: RouteName, options: RequestOptions = {}): Promise<ApiResult> {
    const route = routes[operation];
    let path: string = route[1];
    for (const [key, value] of Object.entries(options.path ?? {})) path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);
    const init: RequestInit = { method: route[0], headers };
    if (options.body !== undefined) { headers.set("Content-Type", "application/json"); init.body = JSON.stringify(options.body); }
    const input = options.baseUrl ? new URL(path, options.baseUrl).toString() : this.buildApiUrl(path, options.query);
    const response = await this.authFetch(input, init);
    let data: unknown;
    try { data = await response.json(); } catch { data = undefined; }
    return { data, error: response.ok ? undefined : data, response };
  }

  buildApiUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.serverUrl);
    for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    return url.toString();
  }

  async authFetch(input: string, init?: RequestInit, allowRetry = true): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);
    const response = await fetch(input, { ...init, headers });
    if (response.status !== 401 || !allowRetry || !this.onAuthError) return response;
    const token = await this.onAuthError();
    if (!token) return response;
    this.accessToken = token;
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers: retryHeaders });
  }
}

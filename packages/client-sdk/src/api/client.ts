import { routes, type RouteName } from "@aijee/protocol";

export interface ApiResult<T = unknown> {
  data?: T;
  error?: unknown;
  response: Response;
}

export interface ApiOptions {
  method?: string;
  url?: string;
  baseUrl?: string;
  path?: Record<string, string | number | undefined>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
}

type RequestHook = (request: Request, options: ApiOptions) => Promise<Request> | Request;
type ResponseHook = (response: Response, request: Request, options: ApiOptions) => Promise<Response> | Response;

class ApiTransport {
  private baseUrl = "";
  private auth?: () => Promise<string | undefined> | string | undefined;
  private requestHooks: RequestHook[] = [];
  private responseHooks: ResponseHook[] = [];

  readonly interceptors = {
    request: { use: (hook: RequestHook) => { this.requestHooks.push(hook); } },
    response: { use: (hook: ResponseHook) => { this.responseHooks.push(hook); } },
  };

  setConfig(config: { baseUrl?: string; auth?: () => Promise<string | undefined> | string | undefined; requestValidator?: (value: unknown) => unknown }): void {
    if (config.baseUrl !== undefined) this.baseUrl = config.baseUrl;
    if (config.auth !== undefined) this.auth = config.auth;
  }

  async request<T = unknown>(options: ApiOptions): Promise<ApiResult<T>> {
    const requestOptions = { ...options };
    const request = await this.prepareRequest(requestOptions);
    const hookedRequest = await this.requestHooks.reduce(async (current, hook) => hook(await current, requestOptions), Promise.resolve(request));
    let response = await fetch(hookedRequest);
    for (const hook of this.responseHooks) response = await hook(response, hookedRequest, requestOptions);
    let data: unknown;
    try { data = await response.json(); } catch { data = undefined; }
    return { data: data as T | undefined, error: response.ok ? undefined : data, response };
  }

  async get<T = unknown>(options: ApiOptions): Promise<ApiResult<T>> { return this.request<T>({ ...options, method: "GET" }); }
  async post<T = unknown>(options: ApiOptions): Promise<ApiResult<T>> { return this.request<T>({ ...options, method: "POST" }); }
  async put<T = unknown>(options: ApiOptions): Promise<ApiResult<T>> { return this.request<T>({ ...options, method: "PUT" }); }
  async delete<T = unknown>(options: ApiOptions): Promise<ApiResult<T>> { return this.request<T>({ ...options, method: "DELETE" }); }

  operation<T = unknown>(name: RouteName, options: ApiOptions = {}): Promise<ApiResult<T>> {
    const [method, url] = routes[name];
    return this.request<T>({ ...options, url, method });
  }

  private async prepareRequest(options: ApiOptions & { method?: string }): Promise<Request> {
    let path = options.url ?? "/";
    for (const [key, value] of Object.entries(options.path ?? {})) path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
    const url = new URL(path, (options.baseUrl ?? this.baseUrl) || undefined);
    for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const headers = new Headers(options.headers);
    const token = await this.auth?.();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const init: RequestInit = { method: options.method ?? "GET", headers };
    if (options.body !== undefined) {
      if (options.body instanceof FormData || options.body instanceof Blob || typeof options.body === "string") init.body = options.body;
      else { headers.set("Content-Type", "application/json"); init.body = JSON.stringify(options.body); }
    }
    return new Request(url, init);
  }
}

type OperationApi = { [K in Exclude<RouteName, "get">]: (options?: ApiOptions) => Promise<ApiResult<any>> };

export const api = new Proxy(new ApiTransport(), {
  get(target, property, receiver) {
    if (property in target) return Reflect.get(target, property, receiver);
    if (typeof property === "string" && property in routes) return (options?: ApiOptions) => target.operation(property as RouteName, options);
    return undefined;
  },
}) as ApiTransport & OperationApi;

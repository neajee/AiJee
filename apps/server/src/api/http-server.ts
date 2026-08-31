import { createServer, request as proxyRequest, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative as relativePath, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AiJeeRuntime } from "../runtime.ts";
import type { EngineSession } from "@aijee/engine";
import { RuntimeStateStore, type PersistedSession } from "../storage/state-store.ts";
import { reconcileSessionRecords, listNativeSessionItems } from "../storage/session-migrator.ts";
import { RuntimeAuth, type DeviceCode, type DeviceRecord } from "../auth/runtime-auth.ts";
import { TaskService } from "../orchestrator/task-service.ts";
import { keepAliveFrame, openSse, sseFrame } from "./stream/serializer.ts";
import { dispatchRoute, type RouteContext } from "./routes/router.ts";
import { corsHeaders, errorStatus, HttpError, maxJsonBodyBytes, maxPromptBodyBytes } from "./middleware/index.ts";
import { normalizeImageAttachments } from "./prompt-images.ts";
import { recordTelemetry } from "../telemetry/index.ts";
import { PreviewBroker } from "./preview-broker.ts";
import { WebSocketServer, WebSocket } from "ws";
import type { Duplex } from "node:stream";
import { pipeline } from "node:stream/promises";
import { constants as zlibConstants, createBrotliCompress, createGzip } from "node:zlib";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";

type Workspace = {
  id: string;
  name: string;
  path: string;
  color: string | null;
  workspace_enabled: boolean;
  startup_script: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

type ManagedSession = { key: string; workspaceId: string; session: EngineSession; createdAt: string; lastActive: number; modeId?: string; draft?: boolean };
type Mode = { id: string; name: string; description?: string; model?: string; thinking_level?: string; extensions?: string[]; skills?: string[]; extra_args?: string[]; is_default?: boolean; sort_order?: number };
type OAuthLogin = { id: string; providerId: string; url: string | null; instructions: string | null; status: "pending" | "complete" | "failed"; error: string | null; controller: AbortController; expiresAt: number; prompt: { id: string; message: string; type: string; options?: Array<{ id: string; label: string; description?: string }> } | null; resolvePrompt: ((value: string) => void) | null };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class AiJeeHttpServer {
  private server?: Server;
  private readonly runtime: AiJeeRuntime;
  private readonly workspaces = new Map<string, Workspace>();
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly restoring = new Map<string, Promise<ManagedSession>>();
  private readonly sessionRecords = new Map<string, PersistedSession>();
  private readonly archivedSessionIds = new Set<string>();
  private readonly globalStreams = new Set<ServerResponse>();
  private readonly sessionStreams = new Map<string, Set<ServerResponse>>();
  private readonly globalSockets = new Set<WebSocket>();
  private readonly sessionSockets = new Map<string, Set<WebSocket>>();
  private readonly wsServer = new WebSocketServer({ noServer: true });
  private readonly previewBroker = new PreviewBroker();
  private readonly sessionEventUnsubscribers = new Map<string, () => void>();
  private readonly instanceId = randomUUID();
  private nextEventId = 1;
  private readonly eventHistory: Array<Record<string, unknown>> = [];
  private readonly sessionStreamingStates = new Map<string, boolean>();
  private readonly tasks: TaskService;
  private readonly modes = new Map<string, Mode>();
  private customModels: Record<string, unknown> = { providers: {} };
  private readonly store: RuntimeStateStore;
  private readonly webRoot: string;
  private readonly systemWorkspacePath: string;
  private readonly piModelsPath: string;
  private readonly piAuthPath: string;
  private readonly oauthLogins = new Map<string, OAuthLogin>();
  private auth?: RuntimeAuth;
  private localMode = true;
  private localSigningSecret = "";
  private runtimeSecret = "";

  constructor(runtime = new AiJeeRuntime(), statePath = join(homedir(), ".aijee", "runtime.json"), systemWorkspacePath?: string) {
    this.runtime = runtime;
    this.store = new RuntimeStateStore(statePath);
    this.tasks = new TaskService(join(dirname(statePath), "tasks.json"));
    this.webRoot = process.env.AIJEE_WEB_ROOT ?? join(fileURLToPath(new URL("../../public", import.meta.url)));
    this.systemWorkspacePath = systemWorkspacePath ?? process.env.AIJEE_SYSTEM_WORKSPACE ?? join(homedir(), ".aijee", "system-workspace");
    this.piModelsPath = join(homedir(), ".pi", "agent", "models.json");
    this.piAuthPath = join(homedir(), ".pi", "agent", "auth.json");
  }

  async listen(port = 10088, host = "127.0.0.1"): Promise<void> {
    if (this.server) throw new Error("AiJee runtime server is already running");
    const state = await this.store.load();
    this.localMode = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(host);
    recordTelemetry("runtime.listen", { host, port, mode: this.localMode ? "local" : "remote" });
    this.localSigningSecret = state.local_signing_secret ?? randomBytes(32).toString("base64url");
    this.runtimeSecret = state.runtime_secret ?? state.identity?.signing_secret ?? randomBytes(32).toString("base64url");
    await mkdir(this.systemWorkspacePath, { recursive: true });
    await this.tasks.load();
    for (const candidate of state.workspaces) {
      const workspace = candidate as Workspace;
      if (typeof workspace.id === "string" && typeof workspace.path === "string") this.workspaces.set(workspace.id, workspace);
    }
    // Versions before the private system workspace registered process.cwd()
    // as a project. Remove only that unambiguous legacy seed; never touch the
    // directory and never guess when the user has more than one workspace.
    let removedLegacySeed = false;
    if (this.localMode && state.local_workspace_seeded === true && this.workspaces.size === 1) {
      const [legacy] = this.workspaces.values();
      if (legacy && resolve(legacy.path) === resolve(process.cwd())) {
        this.workspaces.delete(legacy.id);
        removedLegacySeed = true;
        recordTelemetry("workspace.legacy_seed_removed", { path: legacy.path });
      }
    }
    await this.loadCustomModels(state.custom_models);
    for (const candidate of state.modes ?? []) { const mode = candidate as Mode; if (typeof mode.id === "string" && typeof mode.name === "string") this.modes.set(mode.id, mode); }
    for (const session of state.sessions ?? []) {
      if (!session.session_id || !session.session_file || !session.cwd) continue;
      if (session.workspace_id === "__chat__" && !this.isSystemWorkspacePath(session.cwd)) continue;
      this.sessionRecords.set(session.session_id, session);
    }
    for (const sessionId of state.archived_session_ids ?? []) if (typeof sessionId === "string") this.archivedSessionIds.add(sessionId);
    this.auth = new RuntimeAuth(this.runtimeSecret, (state.devices ?? []) as DeviceRecord[], async (secret, devices, deviceCodes) => {
      await this.store.update({ runtime_secret: secret, devices, device_codes: deviceCodes, local_signing_secret: this.localSigningSecret, workspaces: [...this.workspaces.values()], custom_models: this.customModels, modes: [...this.modes.values()], sessions: [...this.sessionRecords.values()] });
    }, state.identity, (state.device_codes ?? []) as DeviceCode[]);
    if (removedLegacySeed || !state.local_signing_secret || !state.runtime_secret || !Array.isArray(state.devices)) {
      await this.store.update({ runtime_secret: this.runtimeSecret, devices: this.auth.snapshot(), device_codes: this.auth.codeSnapshot(), local_signing_secret: this.localSigningSecret, workspaces: [...this.workspaces.values()] });
    }
    await this.reconcileSessions();
    this.server = createServer((request, response) => void this.handle(request, response));
    this.server.on("upgrade", (request, socket, head) => this.handleUpgrade(request, socket, head));
    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(port, host, resolve);
    });
  }

  url(): string {
    const address = this.server?.address();
    if (!address || typeof address === "string") throw new Error("AiJee runtime server is not listening");
    const { port } = address as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  async bootstrapLink(origin: string): Promise<string> {
    const device = this.authenticated().snapshot().find((item) => !item.revoked_at) ?? this.authenticated().issueDevice("Owner device");
    const code = this.authenticated().currentCode();
    await this.authenticated().flush();
    return `${origin.replace(/\/$/, "")}/?k=${encodeURIComponent(code.code)}`;
  }

  async resetAuth(): Promise<void> {
    const state = await this.store.load();
    await this.store.save({ ...state, identity: undefined, devices: [], device_codes: [], runtime_secret: randomBytes(32).toString("base64url") });
  }

  async close(): Promise<void> {
    await this.auth?.flush();
    await this.runtime.stop();
    for (const unsubscribe of this.sessionEventUnsubscribers.values()) unsubscribe();
    this.sessionEventUnsubscribers.clear();
    for (const stream of this.globalStreams) stream.end();
    this.globalStreams.clear();
    for (const streams of this.sessionStreams.values()) for (const stream of streams) stream.end();
    this.sessionStreams.clear();
    for (const socket of this.globalSockets) socket.close();
    for (const sockets of this.sessionSockets.values()) for (const socket of sockets) socket.close();
    this.globalSockets.clear();
    this.sessionSockets.clear();
    await this.previewBroker.close();
    if (!this.server) return;
    await new Promise<void>((resolve, reject) => this.server?.close((error) => error ? reject(error) : resolve()));
    this.server = undefined;
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    this.cors(response);
    if (request.method === "OPTIONS") { response.end(); return; }
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      await dispatchRoute(this as unknown as RouteContext, request, response, url);
    } catch (error) {
      const status = errorStatus(error);
      this.error(response, status, error instanceof Error ? error.message : "Runtime error");
      recordTelemetry("http.request.failed", { method: request.method ?? "", path: url.pathname, status });
    }
  }

  private listWorkspaces(url: URL, response: ServerResponse): void {
    const includeArchived = url.searchParams.get("include_archived") === "true";
    this.ok(response, [...this.workspaces.values()].filter((item) => includeArchived || item.status === "active"));
  }

  private async fsList(url: URL, response: ServerResponse): Promise<void> {
    const path = this.safePath(url.searchParams.get("path") ?? "");
    const entries = await readdir(path, { withFileTypes: true });
    const result = await Promise.all(entries.map(async (entry) => {
      const fullPath = join(path, entry.name);
      const metadata = await stat(fullPath);
      return { name: entry.name, path: fullPath, is_dir: entry.isDirectory(), size: metadata.size, modified: metadata.mtime.toISOString() };
    }));
    this.ok(response, { path, entries: result, total: result.length });
  }

  private async fsComplete(url: URL, response: ServerResponse): Promise<void> {
    const input = url.searchParams.get("q") ?? "";
    const expanded = input.startsWith("~/") ? join(homedir(), input.slice(2)) : input;
    const parent = dirname(expanded || ".");
    const prefix = basename(expanded);
    try {
      const entries = await readdir(parent, { withFileTypes: true });
      this.ok(response, entries.filter((entry) => entry.name.startsWith(prefix)).map((entry) => ({ path: join(parent, entry.name), is_dir: entry.isDirectory() })));
    } catch { this.ok(response, []); }
  }

  private async fsDownload(url: URL, response: ServerResponse): Promise<void> {
    const path = this.safePath(url.searchParams.get("path") ?? "");
    const content = await readFile(path);
    response.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${basename(path).replaceAll('"', "")}"` });
    response.end(content);
  }

  private async web(request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const candidate = resolve(this.webRoot, relative || "index.html");
    const root = resolve(this.webRoot);
    const fromRoot = relativePath(root, candidate);
    const file = !fromRoot.startsWith("..") && !isAbsolute(fromRoot) ? candidate : join(root, "index.html");
    let target = file;
    try { if (!(await stat(target)).isFile()) target = join(root, "index.html"); } catch { target = join(root, "index.html"); }
    try {
      const metadata = await stat(target);
      const extension = target.split(".").pop() ?? "html";
      const types: Record<string, string> = { html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", json: "application/json; charset=utf-8", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", ico: "image/x-icon", ttf: "font/ttf", woff: "font/woff", woff2: "font/woff2" };
      const etag = `W/\"${metadata.size.toString(16)}-${Math.trunc(metadata.mtimeMs).toString(16)}\"`;
      const isHtml = extension === "html";
      const isHashed = /[.-][a-f0-9]{8,}\./i.test(target);
      const headers: Record<string, string> = {
        "Content-Type": types[extension] ?? "application/octet-stream",
        "Cache-Control": isHtml ? "no-cache" : isHashed ? "public, max-age=31536000, immutable" : "public, max-age=86400",
        "ETag": etag,
        "Last-Modified": metadata.mtime.toUTCString(),
      };
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, headers);
        response.end();
        return;
      }

      const compressible = new Set(["html", "js", "css", "json", "svg"]);
      const accepted = request.headers["accept-encoding"] ?? "";
      const encoding = compressible.has(extension) && metadata.size > 1024
        ? accepted.includes("br") ? "br" : accepted.includes("gzip") ? "gzip" : ""
        : "";
      if (encoding) {
        headers["Content-Encoding"] = encoding;
        headers["Vary"] = "Accept-Encoding";
      } else {
        headers["Content-Length"] = String(metadata.size);
      }
      response.writeHead(200, headers);
      const source = createReadStream(target);
      if (encoding === "br") {
        await pipeline(source, createBrotliCompress({ params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 } }), response);
      } else if (encoding === "gzip") {
        await pipeline(source, createGzip({ level: 6 }), response);
      } else {
        await pipeline(source, response);
      }
    } catch (error) {
      if (!response.headersSent) this.error(response, 404, "Web assets not found; run yarn web:build");
      else if (!response.destroyed) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code !== "ERR_STREAM_PREMATURE_CLOSE" && code !== "ECONNRESET" && code !== "EPIPE") response.destroy();
      }
    }
  }

  private async fsRead(url: URL, response: ServerResponse): Promise<void> {
    const path = this.safePath(url.searchParams.get("path") ?? "");
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
    const limit = Math.min(1024 * 1024, Math.max(1, Number(url.searchParams.get("limit") ?? 1024 * 1024)));
    const buffer = await readFile(path);
    const content = buffer.subarray(offset, offset + limit).toString("utf8");
    this.ok(response, { path, content, size: buffer.byteLength, offset, length: Buffer.byteLength(content), truncated: offset + Buffer.byteLength(content) < buffer.byteLength });
  }

  private async fsWrite(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ path?: string; content?: string }>(request);
    if (!body.path || body.content === undefined) return this.error(response, 422, "path and content are required");
    const path = this.safePath(body.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body.content, "utf8");
    this.ok(response, { operation: "write", success: true }, 200);
  }

  private async fsUpload(request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
    const targetDir = this.safePath(url.searchParams.get("path") ?? "");
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of request) {
      const value = Buffer.from(chunk);
      total += value.byteLength;
      if (total > maxJsonBodyBytes) throw new HttpError(413, "Upload exceeds 2MB");
      chunks.push(value);
    }
    const name = request.headers["x-file-name"]?.toString() || "upload.bin";
    await mkdir(targetDir, { recursive: true });
    const target = join(targetDir, basename(name));
    const content = Buffer.concat(chunks);
    await writeFile(target, content);
    this.ok(response, { files: [{ path: target, name: basename(target), size: content.byteLength }] });
  }

  private async fsMkdir(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ path?: string }>(request);
    if (!body.path) return this.error(response, 422, "path is required");
    await mkdir(this.safePath(body.path), { recursive: true });
    this.ok(response, { operation: "mkdir", success: true }, 201);
  }

  private async fsDelete(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ path?: string; recursive?: boolean }>(request);
    if (!body.path) return this.error(response, 422, "path is required");
    await rm(this.safePath(body.path), { recursive: body.recursive === true, force: false });
    this.ok(response, { operation: "delete", success: true });
  }

  private preview(request: IncomingMessage, response: ServerResponse, sessionId: string, hostname: string, port: string, suffix: string): void {
    if (!this.sessions.has(sessionId)) return this.error(response, 404, "Session not found");
    if (!new Set(["localhost", "127.0.0.1", "::1"]).has(hostname) || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) return this.error(response, 400, "Preview target must be loopback with a valid port");
    const upstream = proxyRequest({ hostname, port: Number(port), path: `/${suffix}${new URL(request.url ?? "/", "http://localhost").search}`, method: request.method, headers: { ...request.headers, host: `${hostname}:${port}` } }, (upstreamResponse) => {
      const headers = { ...upstreamResponse.headers };
      delete headers["content-security-policy"];
      response.writeHead(upstreamResponse.statusCode ?? 502, headers);
      upstreamResponse.pipe(response);
    });
    upstream.once("error", () => this.error(response, 502, "Preview target is unavailable"));
    request.pipe(upstream);
  }

  private async listTasks(url: URL, response: ServerResponse): Promise<void> { const workspaceId = url.pathname.split("/").pop()!; this.ok(response, this.tasks.list(workspaceId)); }
  private async taskConfig(url: URL, response: ServerResponse): Promise<void> {
    const workspaceId = url.pathname.split("/").pop()!;
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return this.error(response, 404, "Workspace not found");
    this.ok(response, { tasks: await this.tasks.definitions(workspace.path) });
  }
  private async taskLogs(path: string, response: ServerResponse): Promise<void> { this.ok(response, this.tasks.logs(path.split("/").pop()!)); }
  private async startTask(request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await this.body<{ workspace_id?: string; label?: string }>(request); const workspace = body.workspace_id ? this.workspaces.get(body.workspace_id) : undefined; if (!workspace || !body.label) return this.error(response, 400, "workspace_id and label are required"); this.ok(response, await this.tasks.start(workspace.id, workspace.path, body.label)); }
  private async stopTask(request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await this.body<{ task_id?: string }>(request); if (!body.task_id) return this.error(response, 400, "task_id is required"); this.ok(response, await this.tasks.stop(body.task_id)); }
  private async restartTask(request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await this.body<{ task_id?: string }>(request); if (!body.task_id) return this.error(response, 400, "task_id is required"); this.ok(response, await this.tasks.restart(body.task_id)); }
  private async removeTask(path: string, response: ServerResponse): Promise<void> { await this.tasks.remove(path.split("/").pop()!); this.ok(response, null); }

  private safePath(input: string): string {
    const expanded = input === "~" ? homedir() : input.startsWith("~/") ? join(homedir(), input.slice(2)) : input;
    if (!expanded) throw new Error("path is required");
    const candidate = resolve(expanded);
    const roots = [...this.workspaces.values()].filter((workspace) => workspace.status === "active").map((workspace) => resolve(workspace.path));
    if (!roots.some((root) => {
      const relative = relativePath(root, candidate);
      return relative === "" || (!relative.startsWith("..") && !isAbsolute(relative));
    })) throw new HttpError(403, "Path is outside configured workspaces");
    return candidate;
  }

  private async createDevice(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ code?: string; name?: string }>(request);
    const local = this.isLocalRequest(request) && this.hasSameOrigin(request);
    try {
      const device = body.code ? this.authenticated().issueWithCode(body.code, body.name) : local ? this.authenticated().issueDevice(body.name) : (() => { throw new HttpError(403, "A device code is required"); })();
      const token = String(device.token);
      response.setHeader("Set-Cookie", `aijee_token=${token}; HttpOnly; SameSite=Strict; Path=/`);
      this.ok(response, { device_id: device.device_id, token, name: device.name, created_at: device.created_at }, 201);
    } catch (error) { this.error(response, error instanceof HttpError ? error.status : 422, error instanceof Error ? error.message : "Device authorization failed"); }
  }

  private listDevices(request: IncomingMessage, response: ServerResponse): void {
    if (!this.authorized(request)) return this.error(response, 401, "Unauthorized");
    this.ok(response, this.authenticated().list());
  }

  private deleteDevice(request: IncomingMessage, response: ServerResponse, deviceId: string): void {
    if (!this.authorized(request)) return this.error(response, 401, "Unauthorized");
    this.ok(response, null, this.authenticated().revoke(deviceId) ? 200 : 404);
  }

  private logout(request: IncomingMessage, response: ServerResponse): void {
    const device = this.authenticated().authenticate(request.headers.authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined);
    if (!device) return this.error(response, 401, "Unauthorized");
    this.authenticated().revoke(device.device_id);
    response.setHeader("Set-Cookie", "aijee_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    this.ok(response, null);
  }

  private async createDeviceCode(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!this.authorized(request)) return this.error(response, 401, "Unauthorized");
    const value = this.authenticated().mintCode();
    await this.authenticated().flush();
    this.deviceCodeResponse(request, response, value.code);
  }

  private async getDeviceCode(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!this.authorized(request)) return this.error(response, 401, "Unauthorized");
    const code = this.authenticated().currentCode().code;
    await this.authenticated().flush();
    this.deviceCodeResponse(request, response, code);
  }

  private deviceCodeResponse(request: IncomingMessage, response: ServerResponse, code: string): void {
    const protocol = typeof request.headers["x-forwarded-proto"] === "string" ? request.headers["x-forwarded-proto"] : "http";
    const host = typeof request.headers.host === "string" ? request.headers.host : "127.0.0.1:10088";
    this.ok(response, { code, url: `${protocol}://${host}/?k=${encodeURIComponent(code)}`, expires_at: null });
  }

  private version(response: ServerResponse): void { this.json(response, 200, { name: "aijee", version: "0.1.0", server_id: this.localMode ? "local" : "runtime", remote: !this.localMode, auth_model: "device-token" }); }

  private authorized(request: IncomingMessage): boolean { return this.isLocalRequest(request) || this.authenticated().validate(request.headers.authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined); }
  private isLocalRequest(request: IncomingMessage): boolean {
    const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
    const socketAddress = request.socket.remoteAddress ?? "";
    if (!loopback.has(socketAddress)) return false;
    const forwarded = request.headers["x-forwarded-for"];
    const clientAddress = typeof forwarded === "string" ? forwarded.split(",", 1)[0]!.trim() : socketAddress;
    return loopback.has(clientAddress);
  }
  private hasSameOrigin(request: IncomingMessage): boolean {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (typeof origin === "string" && typeof host === "string") {
      try {
        const url = new URL(origin);
        if ((url.protocol === "http:" || url.protocol === "https:") && url.host === host) return true;
      } catch {
        // Fall through to the browser same-site signal below.
      }
    }
    return request.headers["sec-fetch-site"] === "same-origin";
  }

  private async createWorkspace(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ name?: string; path?: string; color?: string; workspace_enabled?: boolean; startup_script?: string }>(request);
    if (!body.name || !body.path) return this.error(response, 422, "name and path are required");
    if (!existsSync(body.path)) return this.error(response, 400, `Path does not exist: ${body.path}`);
    const now = new Date().toISOString();
    const workspace: Workspace = { id: randomUUID(), name: body.name, path: body.path, color: body.color ?? null, workspace_enabled: body.workspace_enabled ?? true, startup_script: body.startup_script ?? null, status: "active", created_at: now, updated_at: now };
    this.workspaces.set(workspace.id, workspace);
    await this.persist();
    this.ok(response, workspace, 201);
  }

  private async createMode(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<Omit<Mode, "id"> & { name?: string }>(request);
    if (!body.name?.trim()) return this.error(response, 422, "name is required");
    const mode: Mode = { ...body, id: randomUUID(), name: body.name.trim() };
    this.modes.set(mode.id, mode);
    await this.persist();
    this.ok(response, mode, 201);
  }

  private async modeRoute(request: IncomingMessage, response: ServerResponse, id: string): Promise<void> {
    const mode = this.modes.get(id);
    if (request.method === "DELETE") {
      if (!mode) return this.error(response, 404, "Mode not found");
      this.modes.delete(id); await this.persist(); return this.ok(response, null);
    }
    if (request.method === "PUT") {
      if (!mode) return this.error(response, 404, "Mode not found");
      Object.assign(mode, await this.body<Partial<Mode>>(request)); await this.persist(); return this.ok(response, mode);
    }
    return this.error(response, 405, "Method not allowed");
  }

  private async sessionMode(request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const record = this.sessionRecords.get(sessionId);
    if (!record) return this.error(response, 404, "Session not found");
    if (request.method === "GET") return this.ok(response, { session_id: sessionId, mode: record.mode_id ? this.modes.get(record.mode_id) ?? null : null });
    if (request.method !== "PUT") return this.error(response, 405, "Method not allowed");
    const body = await this.body<{ mode_id?: string | null }>(request);
    if (body.mode_id !== null && body.mode_id !== undefined && !this.modes.has(body.mode_id)) return this.error(response, 404, "Mode not found");
    record.mode_id = body.mode_id ?? undefined;
    const managed = await this.restoreSession(sessionId);
    if (managed) { managed.modeId = record.mode_id; await this.applyMode(managed.session, record.mode_id); }
    await this.persist();
    this.ok(response, { session_id: sessionId, mode: record.mode_id ? this.modes.get(record.mode_id) ?? null : null });
  }

  private async workspaceRoute(request: IncomingMessage, response: ServerResponse, id: string, action?: string): Promise<void> {
    const workspace = this.workspaces.get(id);
    if (!workspace) return this.error(response, 404, "Workspace not found");
    if (request.method === "GET" && !action) return this.ok(response, workspace);
    if (request.method === "DELETE" && !action) {
      this.workspaces.delete(id);
      await this.persist();
      return this.ok(response, "Workspace deleted");
    }
    if (request.method === "POST" && (action === "archive" || action === "unarchive")) {
      workspace.status = action === "archive" ? "archived" : "active";
      workspace.updated_at = new Date().toISOString();
      await this.persist();
      return this.ok(response, workspace);
    }
    if (request.method === "PUT" && !action) {
      const body = await this.body<Partial<Pick<Workspace, "name" | "path" | "color" | "workspace_enabled" | "startup_script">>>(request);
      if (body.path !== undefined && !existsSync(body.path)) return this.error(response, 400, `Path does not exist: ${body.path}`);
      Object.assign(workspace, body, { updated_at: new Date().toISOString() });
      await this.persist();
      return this.ok(response, workspace);
    }
    return this.error(response, 405, "Method not allowed");
  }

  private async workspaceSessionRoute(request: IncomingMessage, response: ServerResponse, workspaceId: string, sessionId?: string, action?: string, entryId?: string): Promise<void> {
    if (!this.workspaces.has(workspaceId)) return this.error(response, 404, "Workspace not found");
    const managed = sessionId ? await this.restoreSession(sessionId) : undefined;
    if (sessionId && (!managed || managed.workspaceId !== workspaceId)) {
      if (!managed && request.method === "POST" && action === "archive") {
        const record = this.sessionRecords.get(sessionId);
        if (record?.workspace_id === workspaceId) {
          this.sessionRecords.delete(sessionId);
        }
        this.archivedSessionIds.add(sessionId);
        await this.persist();
        return this.ok(response, "Session already archived");
      }
      return this.error(response, 404, "Session not found");
    }
    if (!sessionId && request.method === "GET") {
      const page = Math.max(1, Number(new URL(request.url ?? "/", "http://localhost").searchParams.get("page") ?? 1));
      const limit = Math.min(100, Math.max(1, Number(new URL(request.url ?? "/", "http://localhost").searchParams.get("limit") ?? 20)));
      const items = await this.mergedSessionItems(this.workspaces.get(workspaceId)!.path, workspaceId);
      const offset = (page - 1) * limit;
      return this.ok(response, { items: items.slice(offset, offset + limit), page, limit, total: items.length, has_more: offset + limit < items.length });
    }
    if (!managed || !sessionId) return this.error(response, 404, "Session not found");
    if (request.method === "GET" && !action) return this.ok(response, this.chatSessionInfo(sessionId));
    if (request.method === "GET" && action === "tree") return this.ok(response, managed.session.tree());
    const entries = managed.session.entries() as Array<Record<string, unknown>>;
    if (request.method === "GET" && action === "leaf") return this.ok(response, entries.at(-1) ?? null);
    if (request.method === "GET" && (action === "children" || action === "branch")) {
      if (action === "children") return this.ok(response, entries.filter((entry) => entry.parentId === entryId || entry.parent_id === entryId));
      const index = entries.findIndex((entry) => entry.id === entryId);
      return this.ok(response, index < 0 ? [] : entries.slice(0, index + 1));
    }
    if (request.method === "POST" && action === "archive") {
      const sessionFile = managed.session.describe().sessionFile;
      await this.runtime.sessions.remove(managed.key);
      if (sessionFile && existsSync(sessionFile)) {
        const archiveDir = join(dirname(sessionFile), ".archive");
        await mkdir(archiveDir, { recursive: true });
        await rename(sessionFile, join(archiveDir, basename(sessionFile)));
      }
      this.unbindSessionEvents(sessionId);
      this.sessions.delete(sessionId);
      this.sessionRecords.delete(sessionId);
      this.archivedSessionIds.add(sessionId);
      await this.persist();
      return this.ok(response, "Session archived");
    }
    if (request.method === "DELETE" && !action) return this.deleteSession(sessionId, response);
    if (request.method === "PATCH" && !action) {
      const body = await this.body<{ name?: string }>(request);
      const name = body.name?.trim() ?? "";
      if (!name || name.length > 200) return this.error(response, 400, "Session name must be 1-200 characters");
      managed.session.setSessionName(name);
      return this.ok(response, "Session renamed");
    }
    return this.error(response, 405, "Method not allowed");
  }

  private async createChatSession(_request: IncomingMessage, response: ServerResponse): Promise<void> {
    await this.createManagedSession(response, this.systemWorkspacePath, undefined, "__chat__");
  }

  private async listChatSessions(url: URL, response: ServerResponse): Promise<void> {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const items = await this.mergedSessionItems(this.systemWorkspacePath, "__chat__");
    const offset = (page - 1) * limit;
    this.ok(response, { items: items.slice(offset, offset + limit), page, limit, total: items.length, has_more: offset + limit < items.length });
  }

  /**
   * Native SDK list for a working directory, overlaid with live in-process
   * sessions (e.g. brand-new ones with no assistant reply yet, so no file).
   * Persisted records are kept only as a fallback for sessions the SDK does
   * not discover, so nothing previously visible disappears.
   */
  private async mergedSessionItems(cwd: string, workspaceId: string): Promise<Array<Record<string, unknown>>> {
    const items = new Map<string, Record<string, unknown>>();
    const emptyNativeIds = new Set<string>();
    for (const item of await listNativeSessionItems(cwd)) {
      const id = item.id as string;
      if (this.archivedSessionIds.has(id)) continue;
      if ((item.message_count as number) <= 0 && !item.display_name && workspaceId !== "__chat__") emptyNativeIds.add(id);
      else items.set(id, item);
    }
    for (const record of this.sessionRecords.values()) {
      if (record.workspace_id !== workspaceId || (workspaceId === "__chat__" && !this.isSystemWorkspacePath(record.cwd)) || this.archivedSessionIds.has(record.session_id) || items.has(record.session_id) || emptyNativeIds.has(record.session_id)) continue;
      items.set(record.session_id, {
        id: record.session_id,
        file_path: record.session_file,
        cwd: record.cwd,
        display_name: null,
        created_at: record.created_at,
        last_active: record.last_active,
        message_count: 0,
        version: 0,
      });
    }
    for (const managed of this.sessions.values()) {
      if (managed.workspaceId !== workspaceId || managed.draft || this.archivedSessionIds.has(managed.session.describe().sessionId) || (workspaceId !== "__chat__" && managed.session.messages().length === 0) || items.has(managed.session.describe().sessionId)) continue;
      const descriptor = managed.session.describe();
      items.set(descriptor.sessionId, {
        id: descriptor.sessionId,
        file_path: descriptor.sessionFile ?? "",
        cwd: descriptor.cwd,
        display_name: null,
        created_at: managed.createdAt,
        last_active: managed.lastActive,
        message_count: managed.session.messages().length,
        version: (managed.session.entries() as Array<Record<string, unknown>>).length,
      });
    }
    return [...items.values()].sort((a, b) => (b.last_active as number) - (a.last_active as number));
  }

  private async touchChatSession(request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const existing = await this.restoreSession(sessionId);
    if (existing) return this.ok(response, this.sessionInfo(sessionId));
    const body = await this.body<{ session_file?: string }>(request);
    await this.createManagedSession(response, this.systemWorkspacePath, body.session_file, "__chat__");
  }

  private async createManagedSession(response: ServerResponse, cwd: string, sessionFile?: string, workspaceId = "__chat__", modeId?: string): Promise<void> {
    const key = randomUUID();
    const descriptor = await this.runtime.createSession(key, { cwd, sessionFile });
    const session = this.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost newly created session");
    const now = new Date().toISOString();
    this.sessions.set(descriptor.sessionId, { key, workspaceId, session, createdAt: now, lastActive: Date.now(), modeId });
    this.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: workspaceId, cwd: descriptor.cwd, created_at: now, last_active: Date.now(), mode_id: modeId });
    await this.applyMode(session, modeId);
    await this.persist();
    this.bindSessionEvents(descriptor.sessionId, session, workspaceId);
    this.ok(response, this.sessionInfo(descriptor.sessionId), 201);
  }

  private chatSessionInfo(sessionId: string): Record<string, unknown> {
    const managed = this.sessions.get(sessionId);
    const record = this.sessionRecords.get(sessionId);
    if (!managed && record) return { id: sessionId, file_path: record.session_file, cwd: record.cwd, display_name: null, created_at: record.created_at, last_active: record.last_active, message_count: null, version: null };
    if (!managed) throw new Error("Session not found");
    const descriptor = managed.session.describe();
    const entries = managed.session.entries() as Array<Record<string, unknown>>;
    return { id: sessionId, file_path: descriptor.sessionFile ?? "", cwd: descriptor.cwd, display_name: null, created_at: managed.createdAt, last_active: managed.lastActive, message_count: managed.session.messages().length, version: entries.length };
  }

  private async createSession(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ workspace_id?: string; session_path?: string; mode_id?: string; draft?: boolean }>(request);
    const workspace = body.workspace_id ? this.workspaces.get(body.workspace_id) : undefined;
    if (!workspace) return this.error(response, 404, "Workspace not found");
    if (body.draft) {
      const existing = [...this.sessions.values()].find((managed) => managed.draft && managed.workspaceId === workspace.id);
      if (existing) {
        if (existing.modeId !== body.mode_id) {
          existing.modeId = body.mode_id;
          await this.applyMode(existing.session, body.mode_id);
        }
        return this.ok(response, this.sessionInfo(existing.session.describe().sessionId), 200);
      }
    }
    const key = randomUUID();
    const descriptor = await this.runtime.createSession(key, { cwd: workspace.path, sessionFile: body.session_path });
    const session = this.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost newly created session");
    const now = new Date().toISOString();
    this.sessions.set(descriptor.sessionId, { key, workspaceId: workspace.id, session, createdAt: now, lastActive: Date.now(), modeId: body.mode_id, draft: body.draft });
    if (!body.draft) this.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: workspace.id, cwd: descriptor.cwd, created_at: now, last_active: Date.now(), mode_id: body.mode_id });
    await this.applyMode(session, body.mode_id);
    if (!body.draft) await this.persist();
    this.bindSessionEvents(descriptor.sessionId, session, workspace.id);
    this.ok(response, this.sessionInfo(descriptor.sessionId), 201);
  }

  private async touchAgentSession(request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const existing = await this.restoreSession(sessionId);
    if (existing) return this.ok(response, this.sessionInfo(sessionId));
    const body = await this.body<{ session_file?: string; workspace_id?: string }>(request);
    const workspace = body.workspace_id ? this.workspaces.get(body.workspace_id) : undefined;
    if (!workspace) return this.error(response, 404, "Workspace not found");
    await this.createManagedSession(response, workspace.path, body.session_file, workspace.id);
  }

  private async prompt(request: IncomingMessage, response: ServerResponse, action: "prompt" | "steer" | "followUp"): Promise<void> {
    const body = await this.body<{ session_id?: string; message?: string; images?: unknown; streaming_behavior?: unknown }>(request, maxPromptBodyBytes);
    const managed = body.session_id ? await this.restoreSession(body.session_id) : undefined;
    if (!managed || !body.message) return this.error(response, 404, "Session or message not found");
    if (managed.draft) {
      const descriptor = managed.session.describe();
      managed.draft = false;
      this.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: managed.workspaceId, cwd: descriptor.cwd, created_at: managed.createdAt, last_active: Date.now(), mode_id: managed.modeId });
      await this.persist();
    }
    const capability = action === "prompt" ? "streaming" : action === "steer" ? "steering" : "followUp";
    if (!managed.session.capabilities[capability]) return this.error(response, 501, `${action} is not supported by the selected engine`);
    let images;
    try {
      images = normalizeImageAttachments(body.images);
    } catch (error) {
      return this.error(response, 422, error instanceof Error ? error.message : "Invalid image attachment");
    }
    // The client always posts to /prompt and lets the engine decide whether the
    // message runs now or queues, which pi only does when it is told how to
    // queue: dropping this field made every mid-turn message fail silently.
    const streamingBehavior = body.streaming_behavior === "followUp" ? ("followUp" as const) : ("steer" as const);
    const operation = action === "prompt"
      ? managed.session.prompt(body.message, { images, streamingBehavior })
      : action === "steer" ? managed.session.steer(body.message, images) : managed.session.followUp(body.message, images);
    void operation.catch((error) => recordTelemetry("agent.command.failed", { action, session_id: body.session_id ?? "", error: error instanceof Error ? error.message : String(error) }));
    this.ok(response, null);
  }

  private async agentBash(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ session_id?: string; command?: string; id?: string }>(request);
    const managed = body.session_id ? await this.restoreSession(body.session_id) : undefined;
    if (!managed || !body.command) return this.error(response, 404, "Session or command not found");
    if (!managed.session.capabilities.bash) return this.error(response, 501, "Bash is not supported by the selected engine");
    this.ok(response, await managed.session.bash(body.command, body.id));
  }

  private async sessionHistory(sessionId: string, url: URL, response: ServerResponse): Promise<void> {
    const managed = await this.restoreSession(sessionId);
    if (!managed) return this.error(response, 404, "Session not found");
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const entries = managed.session.entries() as Array<Record<string, unknown>>;
    const before = url.searchParams.get("before");
    const end = before ? Math.max(0, entries.findIndex((entry) => entry.id === before)) : entries.length;
    const selected = entries.slice(Math.max(0, end - limit), end);
    this.ok(response, {
      messages: selected.map((entry) => {
        const raw = entry.raw;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const message = (raw as Record<string, unknown>).message;
          if (message && typeof message === "object" && !Array.isArray(message)) return message;
        }
        const message = entry.message;
        return message && typeof message === "object" && !Array.isArray(message) ? message : raw ?? entry;
      }),
      oldest_entry_id: selected[0]?.id ?? null,
      has_more: end - limit > 0,
    });
  }

  private async abort(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.body<{ session_id?: string }>(request);
    // Abort only makes sense for a live session: do not restore just to abort.
    const managed = body.session_id ? this.sessions.get(body.session_id) : undefined;
    if (!managed) return this.error(response, 404, "Session not found");
    await managed.session.abort();
    this.ok(response, null);
  }

  private async sessionCommand(request: IncomingMessage, response: ServerResponse, command: (session: EngineSession, body: Record<string, unknown>) => unknown, capability?: keyof EngineSession["capabilities"]): Promise<void> {
    const body = await this.body<Record<string, unknown>>(request);
    // Restore on demand: sessions are lazy, so a page reload or server restart
    // must not turn model/tool/stats lookups into 404s.
    const managed = typeof body.session_id === "string" ? await this.restoreSession(body.session_id) : undefined;
    if (!managed) return this.error(response, 404, "Session not found");
    if (capability && !managed.session.capabilities[capability]) return this.error(response, 501, `${capability} is not supported by the selected engine`);
    this.ok(response, await command(managed.session, body));
  }

  private async mutateSession(request: IncomingMessage, response: ServerResponse, command: (session: EngineSession, body: Record<string, unknown>) => unknown, capability?: keyof EngineSession["capabilities"]): Promise<void> { return this.sessionCommand(request, response, async (session, body) => { await command(session, body); return null; }, capability); }

  private async replaceSession(request: IncomingMessage, response: ServerResponse, action: "new" | "switch"): Promise<void> {
    const body = await this.body<Record<string, unknown>>(request);
    const oldId = typeof body.session_id === "string" ? body.session_id : "";
    const managed = await this.restoreSession(oldId);
    if (!managed) return this.error(response, 404, "Session not found");
    const descriptor = action === "new" ? await managed.session.newSession() : await managed.session.switchSession(String(body.sessionPath ?? body.session_path ?? ""));
    this.unbindSessionEvents(oldId);
    this.sessions.delete(oldId);
    this.sessions.set(descriptor.sessionId, { ...managed, session: managed.session });
    const record = this.sessionRecords.get(oldId);
    if (record) {
      this.sessionRecords.delete(oldId);
      this.sessionRecords.set(descriptor.sessionId, { ...record, session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? record.session_file, last_active: Date.now() });
      await this.persist();
    }
    this.bindSessionEvents(descriptor.sessionId, managed.session, managed.workspaceId);
    this.ok(response, { result: { cancelled: false }, session: this.sessionInfo(descriptor.sessionId) });
  }

  private deleteSession(sessionId: string, response: ServerResponse): void {
    const managed = this.sessions.get(sessionId);
    if (!managed) return this.error(response, 404, "Session not found");
    void this.runtime.sessions.remove(managed.key);
    this.unbindSessionEvents(sessionId);
    this.sessions.delete(sessionId);
    this.sessionRecords.delete(sessionId);
    void this.persist();
    this.ok(response, null);
  }

  private async stream(request: IncomingMessage, sessionId: string, response: ServerResponse): Promise<void> {
    const managed = await this.restoreSession(sessionId);
    if (!managed) return this.error(response, 404, "Session not found");
    openSse(response);
    response.write(sseFrame({ type: "session_stream_hello", session_id: sessionId }));
    this.replayEvents(response, request.headers["last-event-id"], sessionId, new URL(request.url ?? "/", "http://localhost").searchParams.get("from"));
    const streams = this.sessionStreams.get(sessionId) ?? new Set<ServerResponse>();
    streams.add(response);
    this.sessionStreams.set(sessionId, streams);
    const keepalive = setInterval(() => response.write(keepAliveFrame()), 15_000);
    response.once("close", () => { clearInterval(keepalive); streams.delete(response); if (streams.size === 0) this.sessionStreams.delete(sessionId); });
  }

  private globalStream(request: IncomingMessage, response: ServerResponse): void {
    openSse(response);
    response.write(sseFrame({ type: "server_hello", instance_id: this.instanceId, connection_id: randomUUID() }));
    response.write(sseFrame({ type: "active_sessions", data: { session_ids: this.activeStreamingSessionIds() } }));
    this.replayEvents(response, request.headers["last-event-id"], undefined, new URL(request.url ?? "/", "http://localhost").searchParams.get("from"));
    this.globalStreams.add(response);
    const keepalive = setInterval(() => response.write(keepAliveFrame()), 15_000);
    response.once("close", () => { clearInterval(keepalive); this.globalStreams.delete(response); });
  }

  private bindSessionEvents(sessionId: string, session: EngineSession, workspaceId: string): void {
    this.unbindSessionEvents(sessionId);
    const unsubscribe = session.subscribe((event) => {
      const managed = this.sessions.get(sessionId);
      if (managed) managed.lastActive = Date.now();
      const record = this.sessionRecords.get(sessionId);
      if (record) record.last_active = Date.now();
      this.publishEvent({ id: this.nextEventId++, session_id: sessionId, workspace_id: workspaceId, type: event.type, data: event.data, timestamp: event.timestamp });
      const streaming = session.describe().streaming;
      if (this.sessionStreamingStates.get(sessionId) !== streaming) {
        this.sessionStreamingStates.set(sessionId, streaming);
        this.publishEvent({ id: this.nextEventId++, session_id: sessionId, workspace_id: workspaceId, type: "session_state", data: { isStreaming: streaming }, timestamp: Date.now() });
        this.publishEvent({ id: this.nextEventId++, type: "active_sessions", data: { session_ids: this.activeStreamingSessionIds() }, timestamp: Date.now() });
      }
    });
    this.sessionEventUnsubscribers.set(sessionId, unsubscribe);
  }

  private unbindSessionEvents(sessionId: string): void {
    this.sessionEventUnsubscribers.get(sessionId)?.();
    this.sessionEventUnsubscribers.delete(sessionId);
    this.sessionStreamingStates.delete(sessionId);
  }

  private handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(request.url ?? "/", "http://localhost");
    const sessionMatch = /^\/api\/ws\/stream\/([^/]+)$/.exec(url.pathname);
    const isPreview = url.pathname === "/api/preview/ws";
    const isGlobal = url.pathname === "/api/ws/stream" || url.pathname === "/api/desktop/ws";
    if (!isGlobal && !isPreview && !sessionMatch) { socket.destroy(); return; }
    const authorization = request.headers.authorization ?? (url.searchParams.get("token") ? `Bearer ${url.searchParams.get("token")}` : undefined);
    if (!this.auth || (!this.auth.initialized() && !this.localMode) || !(this.localMode && this.isLocalRequest(request)) && !this.auth.validate(authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined)) { socket.destroy(); return; }
    if (sessionMatch && !this.sessions.has(sessionMatch[1])) { socket.destroy(); return; }
    this.wsServer.handleUpgrade(request, socket, head, (client) => {
      if (isPreview) this.previewBroker.attach(client);
      else if (sessionMatch) this.attachSessionSocket(sessionMatch[1], client);
      else this.attachGlobalSocket(client);
    });
  }

  private attachGlobalSocket(socket: WebSocket): void {
    this.globalSockets.add(socket);
    this.sendSocket(socket, { type: "server_hello", instance_id: this.instanceId, connection_id: randomUUID() });
    this.sendSocket(socket, { type: "active_sessions", data: { session_ids: this.activeStreamingSessionIds() } });
    socket.once("close", () => this.globalSockets.delete(socket));
  }

  private activeStreamingSessionIds(): string[] {
    return [...this.sessions.entries()]
      .filter(([, managed]) => managed.session.describe().streaming)
      .map(([sessionId]) => sessionId);
  }

  private attachSessionSocket(sessionId: string, socket: WebSocket): void {
    const sockets = this.sessionSockets.get(sessionId) ?? new Set<WebSocket>();
    sockets.add(socket);
    this.sessionSockets.set(sessionId, sockets);
    this.sendSocket(socket, { type: "session_stream_hello", session_id: sessionId });
    socket.once("close", () => {
      sockets.delete(socket);
      if (sockets.size === 0) this.sessionSockets.delete(sessionId);
    });
  }

  private sendSocket(socket: WebSocket, payload: unknown): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }

  private publishEvent(payload: Record<string, unknown>): void {
    this.eventHistory.push(payload);
    if (this.eventHistory.length > 5000) this.eventHistory.splice(0, this.eventHistory.length - 5000);
    const frame = sseFrame(payload);
    for (const stream of this.globalStreams) try { stream.write(frame); } catch { this.globalStreams.delete(stream); }
    const sessionId = typeof payload.session_id === "string" ? payload.session_id : "";
    for (const stream of this.sessionStreams.get(sessionId) ?? []) try { stream.write(frame); } catch { this.sessionStreams.get(sessionId)?.delete(stream); }
    for (const socket of this.globalSockets) this.sendSocket(socket, payload);
    for (const socket of this.sessionSockets.get(sessionId) ?? []) this.sendSocket(socket, payload);
  }

  private replayEvents(response: ServerResponse, lastEventId: string | string[] | undefined, sessionId?: string, queryFrom?: string | null): void {
    const raw = Array.isArray(lastEventId) ? lastEventId[0] : lastEventId ?? queryFrom ?? "0";
    const last = Number(raw);
    for (const event of this.eventHistory) if (typeof event.id === "number" && event.id > last && (!sessionId || event.session_id === sessionId)) response.write(sseFrame(event));
  }

  private async restoreSession(sessionId: string): Promise<ManagedSession | undefined> {
    const active = this.sessions.get(sessionId);
    if (active) return active;
    // Concurrent callers (history fetch + model fetch on page open) must share one
    // restore, otherwise each would open its own engine session on the same file.
    const pending = this.restoring.get(sessionId);
    if (pending) return pending;
    const record = this.sessionRecords.get(sessionId);
    if (!record?.session_file) return undefined;
    const restore = this.openPersistedSession(sessionId, record).finally(() => this.restoring.delete(sessionId));
    this.restoring.set(sessionId, restore);
    return restore;
  }

  private async openPersistedSession(sessionId: string, record: PersistedSession): Promise<ManagedSession> {
    // Stable registry key so the engine registry itself also deduplicates.
    const key = `session:${sessionId}`;
    const descriptor = await this.runtime.createSession(key, { cwd: record.cwd, sessionFile: record.session_file });
    const session = this.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost restored session");
    const managed = { key, workspaceId: record.workspace_id, session, createdAt: record.created_at, lastActive: record.last_active, modeId: record.mode_id };
    this.sessions.set(sessionId, managed);
    this.bindSessionEvents(sessionId, session, record.workspace_id);
    await this.applyMode(session, record.mode_id);
    // A session file that no longer exists yields a fresh engine session with a
    // new id. Re-key both maps so later lookups by the new id resolve, and keep
    // the requested id pointing at the same live session for in-flight clients.
    if (descriptor.sessionId !== sessionId) {
      const rekeyed: PersistedSession = { ...record, session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? record.session_file, last_active: Date.now() };
      this.sessionRecords.delete(sessionId);
      this.sessionRecords.set(descriptor.sessionId, rekeyed);
      this.sessions.set(descriptor.sessionId, managed);
      await this.persist();
    }
    return managed;
  }

  private async applyMode(session: EngineSession, modeId?: string): Promise<void> {
    const mode = modeId ? this.modes.get(modeId) : [...this.modes.values()].find((candidate) => candidate.is_default);
    if (!mode) return;
    if (mode.model) {
      const [provider, ...model] = mode.model.split("/");
      if (provider && model.length > 0) await session.setModel(provider, model.join("/"));
    }
    if (mode.thinking_level) session.setThinkingLevel(mode.thinking_level);
  }

  private listSessions(): unknown[] { return [...this.sessionRecords.keys()].map((id) => this.sessionInfo(id)); }
  private runtimeStatus(): Record<string, unknown> {
    return { ready: true, can_install_pi: false, node: { command: process.execPath, installed: true, version: process.version, path: process.execPath, details: null }, pi: { command: "embedded-sdk", installed: true, version: null, path: null, details: { engines: this.runtime.sessions.enginesList() } } };
  }
  private authenticated(): RuntimeAuth { if (!this.auth) throw new Error("AiJee runtime is not initialized"); return this.auth; }
  private persist(): Promise<void> { return this.store.save({ workspaces: [...this.workspaces.values()], identity: undefined, runtime_secret: this.runtimeSecret, devices: this.auth?.snapshot(), device_codes: this.auth?.codeSnapshot(), local_signing_secret: this.localSigningSecret, custom_models: this.customModels, modes: [...this.modes.values()], sessions: [...this.sessionRecords.values()], archived_session_ids: [...this.archivedSessionIds] }); }

  /** Pi owns the canonical models file.  The runtime creates a fresh Pi service
   * graph for every session, so writing here makes a saved provider available
   * to every subsequently created or reopened session. */
  async getCustomModels(): Promise<Record<string, unknown>> { return this.customModels; }

  /** Built-in providers are intentionally discovered from the installed Pi SDK,
   * not copied into AiJee.  This keeps the settings UI aligned with SDK updates. */
  async listBuiltinProviders(): Promise<unknown[]> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const customIds = new Set(Object.keys((this.customModels.providers as Record<string, unknown>) ?? {}));
    return Promise.all(runtime.getProviders()
      .filter((provider) => !customIds.has(provider.id))
      .map(async (provider) => {
        const auth = await runtime.checkAuth(provider.id);
        return {
          id: provider.id,
          name: provider.name ?? provider.id,
          configured: auth !== undefined,
          model_count: runtime.getModels(provider.id).length,
          supports_oauth: provider.auth?.oauth !== undefined,
          supports_api_key: provider.auth?.apiKey !== undefined,
          auth_label: auth === undefined ? null : "已配置",
        };
      }));
  }

  async saveBuiltinProviderKey(providerId: string, key: string): Promise<void> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const provider = runtime.getProviders().find((candidate) => candidate.id === providerId);
    if (!provider || provider.auth?.apiKey === undefined) throw new HttpError(404, "Provider does not accept an API key");
    if (!key.trim()) throw new HttpError(400, "API key is required");
    await this.saveApiKey(providerId, key.trim());
  }

  async removeBuiltinProviderKey(providerId: string): Promise<void> {
    let root: Record<string, unknown> = {};
    try { const raw = await readFile(this.piAuthPath, "utf8"); if (raw.trim()) { const parsed: unknown = JSON.parse(raw); if (!isObject(parsed)) throw new HttpError(422, "~/.pi/agent/auth.json must contain an object"); root = parsed; } }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (!(providerId in root)) return;
    delete root[providerId];
    await mkdir(dirname(this.piAuthPath), { recursive: true });
    const temporary = `${this.piAuthPath}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(root, null, 2)}\n`, "utf8");
    await rename(temporary, this.piAuthPath);
  }

  async startProviderOAuth(providerId: string): Promise<Record<string, unknown>> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const provider = runtime.getProviders().find((candidate) => candidate.id === providerId);
    if (!provider?.auth?.oauth) throw new HttpError(404, "Provider does not support OAuth");
    const flow: OAuthLogin = { id: randomUUID(), providerId, url: null, instructions: null, status: "pending", error: null, controller: new AbortController(), expiresAt: Date.now() + 10 * 60_000, prompt: null, resolvePrompt: null };
    this.oauthLogins.set(flow.id, flow);
    void runtime.login(providerId, "oauth", {
      signal: flow.controller.signal,
      notify: (event: any) => { if (event.type === "auth_url") { flow.url = String(event.url); flow.instructions = typeof event.instructions === "string" ? event.instructions : null; } },
      prompt: async (prompt: any) => new Promise<string>((resolve, reject) => {
        const id = randomUUID();
        flow.resolvePrompt = resolve;
        flow.prompt = { id, message: String(prompt.message ?? "继续登录"), type: String(prompt.type ?? "text"), options: Array.isArray(prompt.options) ? prompt.options.map((option: any) => ({ id: String(option.id), label: String(option.label ?? option.id), ...(typeof option.description === "string" ? { description: option.description } : {}) })) : undefined };
        prompt.signal?.addEventListener("abort", () => reject(new Error("Login cancelled")), { once: true });
      }),
    }).then(() => { flow.status = "complete"; }).catch((error) => { flow.status = "failed"; flow.error = error instanceof Error ? error.message : "OAuth login failed"; });
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.oauthStatus(flow.id);
  }

  oauthStatus(loginId: string): Record<string, unknown> {
    const flow = this.oauthLogins.get(loginId);
    if (!flow || flow.expiresAt < Date.now()) { this.oauthLogins.delete(loginId); throw new HttpError(404, "OAuth login expired"); }
    return { id: flow.id, provider_id: flow.providerId, url: flow.url, instructions: flow.instructions, status: flow.status, error: flow.error, prompt: flow.prompt };
  }

  resolveOAuthPrompt(loginId: string, promptId: string, value: string): void { const flow = this.oauthLogins.get(loginId); if (!flow || flow.prompt?.id !== promptId || !flow.resolvePrompt) throw new HttpError(404, "OAuth prompt expired"); const resolve = flow.resolvePrompt; flow.resolvePrompt = null; flow.prompt = null; resolve(value); }

  async saveCustomModels(config: unknown): Promise<Record<string, unknown>> {
    if (!isObject(config) || !isObject(config.providers)) throw new HttpError(400, "providers must be an object");
    const submittedProviders = config.providers;
    for (const [id, provider] of Object.entries(submittedProviders)) {
      if (!id.trim() || !isObject(provider)) throw new HttpError(400, "Each provider needs an id and object configuration");
    }
    const root = await this.readPiModelsRoot();
    const providers: Record<string, unknown> = {};
    for (const [id, provider] of Object.entries(submittedProviders)) {
      const { apiKey, ...modelConfig } = provider as Record<string, unknown>;
      if (typeof apiKey === "string" && apiKey.trim()) await this.saveApiKey(id, apiKey.trim());
      providers[id] = modelConfig;
    }
    const next = { ...root, providers };
    await this.writePiModelsRoot(next);
    this.customModels = { providers };
    // Retain runtime.json only as a migration fallback for older AiJee installs.
    await this.persist();
    return this.customModels;
  }

  private async loadCustomModels(legacy: Record<string, unknown> | undefined): Promise<void> {
    try {
      const root = await this.readPiModelsRoot();
      const providers = isObject(root.providers) ? root.providers : {};
      const sanitized: Record<string, unknown> = {};
      let migratedCredentials = false;
      for (const [id, value] of Object.entries(providers)) {
        if (!isObject(value)) continue;
        const { apiKey, ...modelConfig } = value;
        if (typeof apiKey === "string" && apiKey.trim()) {
          await this.saveApiKey(id, apiKey.trim());
          migratedCredentials = true;
        }
        sanitized[id] = modelConfig;
      }
      this.customModels = { providers: sanitized };
      if (migratedCredentials) await this.writePiModelsRoot({ ...root, providers: sanitized });
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.customModels = { providers: {}, parseError: "~/.pi/agent/models.json is not valid JSON" };
        return;
      }
      throw error;
    }
    // One-way migration. Do not overwrite an existing Pi file, even if empty.
    if (Object.keys(this.customModels.providers as object).length === 0 && isObject(legacy?.providers)) {
      await this.saveCustomModels({ providers: legacy.providers });
    }
  }

  private async readPiModelsRoot(): Promise<Record<string, unknown>> {
    try {
      const raw = await readFile(this.piModelsPath, "utf8");
      if (!raw.trim()) return {};
      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed)) throw new HttpError(422, "~/.pi/agent/models.json must contain an object");
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw error;
    }
  }

  private async writePiModelsRoot(root: Record<string, unknown>): Promise<void> {
    await mkdir(dirname(this.piModelsPath), { recursive: true });
    const temporary = `${this.piModelsPath}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(root, null, 2)}\n`, "utf8");
    await rename(temporary, this.piModelsPath);
  }

  private async saveApiKey(providerId: string, key: string): Promise<void> {
    let root: Record<string, unknown> = {};
    try {
      const raw = await readFile(this.piAuthPath, "utf8");
      if (raw.trim()) {
        const parsed: unknown = JSON.parse(raw);
        if (!isObject(parsed)) throw new HttpError(422, "~/.pi/agent/auth.json must contain an object");
        root = parsed;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await mkdir(dirname(this.piAuthPath), { recursive: true });
    const temporary = `${this.piAuthPath}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ ...root, [providerId]: { type: "api_key", key } }, null, 2)}\n`, "utf8");
    await rename(temporary, this.piAuthPath);
  }

  private isSystemWorkspacePath(path: string): boolean {
    const root = resolve(this.systemWorkspacePath);
    const candidate = resolve(path);
    const relative = relativePath(root, candidate);
    return relative === "" || (!relative.startsWith("..") && !isAbsolute(relative));
  }

  /**
   * Align persisted session records with the session files that actually exist
   * on disk (importing real sessions, dropping ghost records). Runs once at
   * boot; safe to run again at any time.
   */
  private async reconcileSessions(): Promise<void> {
    const before = this.sessionRecords.size;
    const { sessions, result } = await reconcileSessionRecords(
      [...this.sessionRecords.values()],
      [...this.workspaces.values()],
      this.archivedSessionIds,
      this.systemWorkspacePath,
    );
    if (result.imported === 0 && result.removed === 0) return;
    this.sessionRecords.clear();
    for (const session of sessions) this.sessionRecords.set(session.session_id, session);
    // Patch only the sessions key so devices/identity/etc. are left untouched.
    await this.store.update({ sessions });
    recordTelemetry("sessions.reconciled", { before, imported: result.imported, removed: result.removed, total: result.total });
  }
  private sessionInfo(sessionId: string): Record<string, unknown> {
    const managed = this.sessions.get(sessionId);
    const persisted = this.sessionRecords.get(sessionId);
    if (!managed && persisted) return { session_id: persisted.session_id, session_file: persisted.session_file, workspace_id: persisted.workspace_id, cwd: persisted.cwd, model: null, thinking_level: null, is_compacting: null, session_name: null, auto_compaction_enabled: null, message_count: null, pending_message_count: null, process_alive: false, created_at: persisted.created_at, last_active: persisted.last_active };
    if (!managed) throw new Error("Session not found");
    const descriptor = managed.session.describe();
    const state = managed.session.state();
    const record = this.sessionRecords.get(sessionId);
    if (record) { record.last_active = managed.lastActive; record.session_file = descriptor.sessionFile ?? record.session_file; }
    return { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: managed.workspaceId, cwd: descriptor.cwd, model: state.model ?? null, thinking_level: state.thinkingLevel ?? null, is_compacting: state.isCompacting ?? null, session_name: state.sessionName ?? null, auto_compaction_enabled: state.autoCompactionEnabled ?? null, message_count: managed.session.messages().length, pending_message_count: state.pendingMessageCount ?? null, process_alive: true, created_at: managed.createdAt, last_active: managed.lastActive };
  }
  private cors(response: ServerResponse): void { for (const [name, value] of Object.entries(corsHeaders)) response.setHeader(name, value); }
  private ok(response: ServerResponse, data: unknown, status = 200): void { this.json(response, status, { success: true, data, error: null }); }
  private error(response: ServerResponse, status: number, message: string): void { this.json(response, status, { success: false, data: null, error: message }); }
  private json(response: ServerResponse, status: number, data: unknown): void { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(data)); }

  private async body<T>(request: IncomingMessage, maxBytes = maxJsonBodyBytes): Promise<T> {
    const limitLabel = `${Math.round(maxBytes / (1024 * 1024))}MB`;
    const contentLength = Number(request.headers["content-length"] ?? 0);
    if (contentLength > maxBytes) throw new HttpError(413, `Request body exceeds ${limitLabel}`);
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of request) {
      const value = Buffer.from(chunk);
      total += value.byteLength;
      if (total > maxBytes) throw new HttpError(413, `Request body exceeds ${limitLabel}`);
      chunks.push(value);
    }
    if (total === 0) throw new HttpError(400, "JSON request body is required");
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T; }
    catch { throw new HttpError(400, "Malformed JSON request body"); }
  }
}

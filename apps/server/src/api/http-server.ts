import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AiJeeRuntime } from "../runtime.ts";
import { RuntimeStateStore } from "../storage/state-store.ts";
import { RuntimeAuth, type DeviceCode, type DeviceRecord } from "../auth/runtime-auth.ts";
import { TaskService } from "../orchestrator/task-service.ts";
import { PackageService } from "../orchestrator/package-service.ts";
import { dispatchRoute, type RouteContext } from "./routes/router.ts";
import { errorStatus } from "./middleware/index.ts";
import { recordTelemetry } from "../telemetry/index.ts";
import { PreviewBroker } from "./preview-broker.ts";
import { WebSocketServer, WebSocket } from "ws";
import type { AgentStreamEvent, StreamEventEnvelope } from "@aijee/protocol";
import { createHandlerContext } from "./handlers/index.ts";
import type { HandlerContext, ManagedSession, Mode, OAuthLogin, Workspace, PersistedSession } from "./handlers/context.ts";

export class AiJeeHttpServer {
  private server?: Server;
  private readonly routeContext: HandlerContext;
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
  private readonly eventHistory: StreamEventEnvelope[] = [];
  private readonly sessionStreamingStates = new Map<string, boolean>();
  private readonly tasks: TaskService;
  private readonly packages: PackageService;
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
    this.routeContext = createHandlerContext(this as unknown as HandlerContext);
    this.runtime = runtime;
    this.packages = new PackageService((event) => this.routeContext.publishEvent({ id: this.nextEventId++, type: "package_operation", data: event as unknown as AgentStreamEvent, timestamp: Date.now() } as StreamEventEnvelope));
    this.store = new RuntimeStateStore(statePath);
    this.tasks = new TaskService(join(dirname(statePath), "tasks.json"));
    this.webRoot = process.env.AIJEE_WEB_ROOT ?? join(fileURLToPath(new URL("../../public", import.meta.url)));
    this.systemWorkspacePath = systemWorkspacePath ?? process.env.AIJEE_SYSTEM_WORKSPACE ?? join(homedir(), ".aijee", "system-workspace");
    this.piModelsPath = join(homedir(), ".pi", "agent", "models.json");
    this.piAuthPath = join(homedir(), ".pi", "agent", "auth.json");
  }

  async listen(port = 8081, host = "127.0.0.1"): Promise<void> {
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
    await this.routeContext.loadCustomModels(state.custom_models);
    for (const candidate of state.modes ?? []) { const mode = candidate as Mode; if (typeof mode.id === "string" && typeof mode.name === "string") this.modes.set(mode.id, mode); }
    for (const session of state.sessions ?? []) {
      if (!session.session_id || !session.session_file || !session.cwd) continue;
      if (session.workspace_id === "__chat__" && !this.routeContext.isSystemWorkspacePath(session.cwd)) continue;
      this.sessionRecords.set(session.session_id, session);
    }
    for (const sessionId of state.archived_session_ids ?? []) if (typeof sessionId === "string") this.archivedSessionIds.add(sessionId);
    this.auth = new RuntimeAuth(this.runtimeSecret, (state.devices ?? []) as DeviceRecord[], async (secret, devices, deviceCodes) => {
      await this.store.update({ runtime_secret: secret, devices, device_codes: deviceCodes, local_signing_secret: this.localSigningSecret, workspaces: [...this.workspaces.values()], custom_models: this.customModels, modes: [...this.modes.values()], sessions: [...this.sessionRecords.values()] });
    }, state.identity, (state.device_codes ?? []) as DeviceCode[]);
    if (removedLegacySeed || !state.local_signing_secret || !state.runtime_secret || !Array.isArray(state.devices)) {
      await this.store.update({ runtime_secret: this.runtimeSecret, devices: this.auth.snapshot(), device_codes: this.auth.codeSnapshot(), local_signing_secret: this.localSigningSecret, workspaces: [...this.workspaces.values()] });
    }
    await this.routeContext.reconcileSessions();
    this.server = createServer((request, response) => void this.handle(request, response));
    this.server.on("upgrade", (request, socket, head) => this.routeContext.handleUpgrade(request, socket, head));
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
    const device = this.routeContext.authenticated().snapshot().find((item: DeviceRecord) => !item.revoked_at) ?? this.routeContext.authenticated().issueDevice("Owner device");
    const code = this.routeContext.authenticated().currentCode();
    await this.routeContext.authenticated().flush();
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
    this.routeContext.cors(response);
    if (request.method === "OPTIONS") { response.end(); return; }
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      await dispatchRoute(this.routeContext as RouteContext, request, response, url);
    } catch (error) {
      const status = errorStatus(error);
      this.routeContext.error(response, status, error instanceof Error ? error.message : "Runtime error");
      recordTelemetry("http.request.failed", { method: request.method ?? "", path: url.pathname, status });
    }
  }


}

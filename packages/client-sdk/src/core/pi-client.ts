import { BehaviorSubject, Subject, Observable, filter, map, distinctUntilChanged } from "rxjs";
import type { ConnectionState, PiClientConfig, SessionListItem } from "../types";
import type { StreamEventEnvelope, ImageContent, AgentStateData } from "../types/stream-events";
import type { ChatMessage, AgentMode, PendingExtensionUiRequest } from "../types/chat-message";
import { ApiClient } from "./api-client";
import { StreamConnection } from "./stream-connection";
import { reduceStreamEvent, createEmptySessionState, convertRawMessages, isModeSlashCommand, type SessionState } from "./message-reducer";

export interface SessionListState {
  items: SessionListItem[];
  page: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
}

export class PiClient {
  readonly api: ApiClient;
  private readonly _stream: StreamConnection;
  private readonly _sessionStates = new Map<string, BehaviorSubject<SessionState>>();
  private readonly _sessionListStates = new Map<string, BehaviorSubject<SessionListState>>();
  private readonly _activeSessionIds$ = new BehaviorSubject<Set<string>>(new Set());
  private readonly _streamingSessionIds$ = new BehaviorSubject<Set<string>>(new Set());
  private readonly _config: PiClientConfig;
  private readonly _serverRestart$ = new Subject<void>();
  private readonly _fileSystemChanged$ = new Subject<void>();
  private _instanceId: string | null = null;
  private _activeSessionIds = new Set<string>();
  private _streamingSessionIds = new Set<string>();
  private _viewedSessionId: string | null = null;
  private _pendingActiveSession: string | null | undefined = undefined;
  /**
   * Monotonic per-session history request counter. Session open and stream
   * (re)connect both fetch history, so responses can interleave; without this
   * guard a stale or empty response would overwrite freshly rendered messages.
   */
  private readonly _historyRequestIds = new Map<string, number>();
  private readonly _highWaterMarks = new Map<string, number>();
  private readonly _deltaHighWaterMarks = new Map<string, number>();

  constructor(config: PiClientConfig) {
    this._config = config;
    this.api = new ApiClient(config.serverUrl, config.accessToken);
    if (config.onApiAuthError) {
      this.api.setAuthErrorHandler(config.onApiAuthError);
    }
    this._stream = new StreamConnection({
      serverUrl: config.serverUrl,
      getAccessToken: () => this._config.accessToken,
      onAuthError: config.onAuthError,
      transport: config.transport,
      reconnectBaseMs: config.reconnectBaseMs,
      reconnectMaxMs: config.reconnectMaxMs,
    });

    this._stream.events$.subscribe((envelope) => {
      if (__DEV__) console.log("[pi:stream]", envelope.type, envelope.session_id, envelope.id);
      this._processEvent(envelope);
    });

    this._stream.instanceId$.subscribe((instanceId) => {
      this._handleInstanceId(instanceId);
    });

    this._stream.connectionId$.subscribe(() => {
      this._pendingActiveSession = undefined;
    });

    this._stream.activeSessions$.subscribe((sessionIds) => {
      this._activeSessionIds = new Set(sessionIds);
      this._activeSessionIds$.next(this._activeSessionIds);
      // A session whose process is gone cannot still be mid-turn. Without this,
      // a turn that ends by the agent exiting would spin forever.
      if (this._streamingSessionIds.size > 0) {
        const stillStreaming = new Set(
          [...this._streamingSessionIds].filter((id) => this._activeSessionIds.has(id)),
        );
        if (stillStreaming.size !== this._streamingSessionIds.size) {
          this._streamingSessionIds = stillStreaming;
          this._streamingSessionIds$.next(stillStreaming);
        }
      }
    });
  }

  get connection$(): Observable<ConnectionState> {
    return this._stream.connection$;
  }

  get connectionSnapshot(): ConnectionState {
    return this._stream.connectionSnapshot;
  }

  connect(): void {
    this._stream.connect();
  }

  disconnect(): void {
    this._stream.disconnect();
  }

  reconnect(): void {
    this._stream.reconnect();
  }

  get serverRestart$(): Observable<void> {
    return this._serverRestart$.asObservable();
  }

  get fileSystemChanged$(): Observable<void> {
    return this._fileSystemChanged$.asObservable();
  }

  get activeSessions$(): Observable<Set<string>> {
    return this._activeSessionIds$.asObservable();
  }

  /**
   * Sessions whose agent is mid-turn.
   *
   * Distinct from `activeSessions$`, which only says a process is alive: an
   * agent that finished its answer minutes ago is still "active". Every event
   * is reduced for every session, not just the one on screen, so this stays
   * accurate for sessions the UI has never opened.
   */
  get streamingSessions$(): Observable<Set<string>> {
    return this._streamingSessionIds$.asObservable();
  }

  isSessionStreaming(sessionId: string): boolean {
    return this._streamingSessionIds.has(sessionId);
  }

  isSessionActive(sessionId: string): boolean {
    return this._activeSessionIds.has(sessionId);
  }

  updateToken(accessToken: string): void {
    (this._config as { accessToken: string }).accessToken = accessToken;
    this.api.updateToken(accessToken);
  }

  get events$(): Observable<StreamEventEnvelope> {
    return this._stream.events$;
  }

  sessionEvents$(sessionId: string): Observable<StreamEventEnvelope> {
    return this._stream.events$.pipe(filter((e) => e.session_id === sessionId));
  }

  // ---------------------------------------------------------------------------
  // Session lifecycle
  // ---------------------------------------------------------------------------

  async openSession(
    sessionId: string,
    params: { workspaceId?: string; sessionFile: string },
  ): Promise<void> {
    this._viewedSessionId = sessionId;

    const subject = this._getOrCreateSessionSubject(sessionId);
    const current = subject.getValue();

    const touch = async () => {
      if (params.workspaceId) {
        await this.api.touchAgentSession(sessionId, {
          workspaceId: params.workspaceId,
          sessionFile: params.sessionFile,
        });
      } else {
        await this.api.touchChatSession(sessionId, params.sessionFile);
      }
    };

    if (__DEV__) console.log("[pi:open]", sessionId, { ready: current.isReady, workspace: params.workspaceId });
    if (current.isReady) {
      touch().catch(() => {});
      await this._fetchAndApplyHistory(sessionId);
      this._setActiveSessionOnBackend(sessionId);
      return;
    }

    subject.next({ ...current, isLoading: true });

    try { await touch(); } catch (error) {
      if (__DEV__) console.warn("[pi:open] touch failed", sessionId, error);
      await this._fetchAndApplyHistory(sessionId);
      this._setActiveSessionOnBackend(sessionId);
      return;
    }

    await this._fetchAndApplyHistory(sessionId);
    this._setActiveSessionOnBackend(sessionId);
  }

  closeSession(sessionId: string): void {
    if (__DEV__) console.log("[pi:close]", sessionId);
    if (this._viewedSessionId === sessionId) {
      this._viewedSessionId = null;
      this._setActiveSessionOnBackend(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Observables
  // ---------------------------------------------------------------------------

  session$(sessionId: string): Observable<SessionState> {
    return this._getOrCreateSessionSubject(sessionId).asObservable();
  }

  messages$(sessionId: string): Observable<ChatMessage[]> {
    return this.session$(sessionId).pipe(map((s) => s.messages), distinctUntilChanged());
  }

  isStreaming$(sessionId: string): Observable<boolean> {
    return this.session$(sessionId).pipe(map((s) => s.isStreaming), distinctUntilChanged());
  }

  mode$(sessionId: string): Observable<AgentMode> {
    return this.session$(sessionId).pipe(map((s) => s.mode), distinctUntilChanged());
  }

  pendingExtensionUiRequest$(sessionId: string): Observable<PendingExtensionUiRequest | null> {
    return this.session$(sessionId).pipe(map((s) => s.pendingExtensionUiRequest), distinctUntilChanged());
  }

  agentState$(sessionId: string): Observable<AgentStateData | null> {
    return this.session$(sessionId).pipe(map((s) => s.agentState), distinctUntilChanged());
  }

  getSessionSnapshot(sessionId: string): SessionState {
    return this._getOrCreateSessionSubject(sessionId).getValue();
  }

  hasMoreMessages$(sessionId: string): Observable<boolean> {
    return this.session$(sessionId).pipe(map((s) => s.hasMoreMessages), distinctUntilChanged());
  }

  // ---------------------------------------------------------------------------
  // Load older messages (pagination)
  // ---------------------------------------------------------------------------

  async loadOlderMessages(sessionId: string, limit = 50): Promise<void> {
    const subject = this._getOrCreateSessionSubject(sessionId);
    const current = subject.getValue();
    if (!current.hasMoreMessages || current.isLoadingOlderMessages) return;

    subject.next({ ...current, isLoadingOlderMessages: true });

    try {
      const result = await this.api.getSessionHistory(sessionId, {
        before: current.oldestEntryId ?? undefined,
        limit,
      });

      const rawMessages = result.messages as Record<string, string>[];
      if (rawMessages.length > 0) {
        const latest = subject.getValue();
        const converted = convertRawMessages(rawMessages, { tailContext: latest.messages });
        const existingKeys = new Set(latest.messages.map((m) => m.entryId).filter(Boolean));
        const unique = converted.filter((m) => !m.entryId || !existingKeys.has(m.entryId));
        subject.next({
          ...latest,
          messages: [...unique, ...latest.messages],
          hasMoreMessages: result.has_more,
          oldestEntryId: result.oldest_entry_id ?? null,
          isLoadingOlderMessages: false,
        });
      } else {
        subject.next({
          ...subject.getValue(),
          hasMoreMessages: result.has_more,
          oldestEntryId: result.oldest_entry_id ?? null,
          isLoadingOlderMessages: false,
        });
      }
    } catch {
      subject.next({ ...subject.getValue(), isLoadingOlderMessages: false });
    }
  }

  // ---------------------------------------------------------------------------
  // Session list management
  // ---------------------------------------------------------------------------

  sessionList$(workspaceId: string): Observable<SessionListState> {
    return this._getOrCreateSessionListSubject(workspaceId).asObservable();
  }

  async loadSessions(workspaceId: string, params?: { page?: number; limit?: number }): Promise<void> {
    const subject = this._getOrCreateSessionListSubject(workspaceId);
    const current = subject.getValue();
    subject.next({ ...current, isLoading: true });

    try {
      const result = await this.api.listWorkspaceSessions(workspaceId, {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      });
      subject.next({
        items: result.items,
        page: result.page,
        total: result.total,
        hasMore: result.has_more,
        isLoading: false,
        isLoadingMore: false,
      });
    } catch {
      subject.next({ ...current, isLoading: false });
    }
  }

  async loadMoreSessions(workspaceId: string): Promise<void> {
    const subject = this._getOrCreateSessionListSubject(workspaceId);
    const current = subject.getValue();
    if (!current.hasMore || current.isLoadingMore) return;

    subject.next({ ...current, isLoadingMore: true });

    try {
      const nextPage = current.page + 1;
      const result = await this.api.listWorkspaceSessions(workspaceId, { page: nextPage, limit: 20 });
      subject.next({
        items: [...current.items, ...result.items],
        page: result.page,
        total: result.total,
        hasMore: result.has_more,
        isLoading: false,
        isLoadingMore: false,
      });
    } catch {
      subject.next({ ...current, isLoadingMore: false });
    }
  }

  async refreshSessions(workspaceId: string): Promise<void> {
    return this.loadSessions(workspaceId, { page: 1 });
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  /**
   * Send a user message.
   *
   * Always goes through pi's `prompt` command: pi decides from its own live
   * state whether to run immediately or queue as steering/follow-up. Calling
   * `steer`/`follow_up` directly from the client would silently queue the
   * message forever whenever the client's streaming flag is stale.
   */
  async prompt(sessionId: string, message: string, options?: {
    images?: ImageContent[];
    streamingBehavior?: "steer" | "followUp";
    workspaceId?: string;
    sessionFile?: string;
  }): Promise<void> {
    const subject = this._getOrCreateSessionSubject(sessionId);
    const pendingId = `pending-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if ((message.trim() || options?.images?.length) && !isModeSlashCommand(message)) {
      const current = subject.getValue();
      subject.next({
        ...current,
        messages: [...current.messages, {
          id: pendingId,
          role: "user",
          text: message,
          timestamp: Date.now(),
          pending: true,
          ...(options?.images?.length ? { attachments: options.images.map((image, index) => ({ id: `pending-img-${index}`, type: "image" as const, mimeType: image.mimeType, data: image.data })) } : {}),
        }],
      });
    }
    try {
      await this.api.prompt({ sessionId, message, images: options?.images, streamingBehavior: options?.streamingBehavior, workspaceId: options?.workspaceId, sessionFile: options?.sessionFile });
    } catch (error) {
      const current = subject.getValue();
      subject.next({ ...current, messages: current.messages.filter((item) => item.id !== pendingId) });
      throw error;
    }
  }

  async steer(sessionId: string, message: string, options?: {
    images?: ImageContent[];
    workspaceId?: string;
    sessionFile?: string;
  }): Promise<void> {
    return this.prompt(sessionId, message, { ...options, streamingBehavior: "steer" });
  }

  async followUp(sessionId: string, message: string, options?: {
    images?: ImageContent[];
    workspaceId?: string;
    sessionFile?: string;
  }): Promise<void> {
    return this.prompt(sessionId, message, { ...options, streamingBehavior: "followUp" });
  }

  async abort(sessionId: string): Promise<void> {
    return this.api.abort(sessionId);
  }

  async setModel(sessionId: string, params: { provider: string; modelId: string }): Promise<void> {
    return this.api.setModel(sessionId, params);
  }

  async setThinkingLevel(sessionId: string, level: string): Promise<void> {
    return this.api.setThinkingLevel(sessionId, level);
  }

  async sendExtensionUiResponse(params: {
    sessionId: string;
    id: string;
    value?: string;
    confirmed?: boolean;
    cancelled?: boolean;
  }): Promise<void> {
    await this.api.extensionUiResponse(params);
    const subject = this._sessionStates.get(params.sessionId);
    if (subject) {
      const current = subject.getValue();
      subject.next({ ...current, pendingExtensionUiRequest: null });
    }
  }

  async killSession(sessionId: string): Promise<void> {
    await this.api.killSession(sessionId);
  }

  async createAgentSession(params: { workspaceId: string; sessionPath?: string; modeId?: string; draft?: boolean }) {
    const info = await this.api.createAgentSession(params);
    const subject = this._getOrCreateSessionSubject(info.session_id);
    subject.next({ ...createEmptySessionState(), isReady: true });
    this.loadSessions(params.workspaceId, { page: 1 });
    return info;
  }

  async createChatSession(params?: { noTools?: boolean; systemPrompt?: string; modeId?: string }) {
    return this.api.createChatSession(params);
  }

  waitForTurnEnd(sessionId: string): Promise<StreamEventEnvelope> {
    return new Promise((resolve) => {
      const sub = this.sessionEvents$(sessionId).pipe(
        filter((e) => e.type === "agent_settled"),
      ).subscribe((event) => {
        sub.unsubscribe();
        resolve(event);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Internal — event processing (single unified stream)
  // ---------------------------------------------------------------------------

  private _knownStreamSessionIds = new Set<string>();

  private _processEvent(envelope: StreamEventEnvelope): void {
    if (envelope.type === "history_messages") return;

    const sessionId = envelope.session_id;

    if (envelope.id > 0) {
      const hwm = this._highWaterMarks.get(sessionId) ?? 0;
      if (envelope.id <= hwm) {
        return;
      }
      this._highWaterMarks.set(sessionId, envelope.id);
      if (envelope.type === "message_update" || envelope.type === "tool_execution_update") {
        this._deltaHighWaterMarks.set(sessionId, envelope.id);
      }
    }

    const subject = this._getOrCreateSessionSubject(sessionId);
    const currentState = subject.getValue();
    const nextState = reduceStreamEvent(currentState, envelope);
    if (nextState !== currentState) {
      subject.next(nextState);
    }
    this._trackStreamingSession(sessionId, nextState.isStreaming);

    if (envelope.type === "turn_end") {
      this._fileSystemChanged$.next();
    } else if (envelope.type === "tool_execution_end") {
      const event = envelope.data as { toolName?: string } | undefined;
      const tool = event?.toolName ?? "";
      if (tool === "write" || tool === "edit" || tool === "bash") {
        this._fileSystemChanged$.next();
      }
    }

    if (
      envelope.type === "message_start" &&
      envelope.workspace_id &&
      !this._knownStreamSessionIds.has(sessionId)
    ) {
      this._knownStreamSessionIds.add(sessionId);
      const listSubject = this._sessionListStates.get(envelope.workspace_id);
      if (listSubject) {
        this.refreshSessions(envelope.workspace_id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal — active session management
  // ---------------------------------------------------------------------------

  private _setActiveSessionOnBackend(sessionId: string | null): void {
    const connectionId = this._stream.connectionId;
    if (!connectionId) {
      this._pendingActiveSession = sessionId;
      return;
    }
    this._pendingActiveSession = undefined;
    this._sendActiveSession(sessionId);
  }

  private _sendActiveSession(sessionId: string | null): void {
    const connectionId = this._stream.connectionId;
    if (!connectionId) return;
    const fromEventId = sessionId ? this._highWaterMarks.get(sessionId) : undefined;
    const fromDeltaEventId = sessionId ? this._deltaHighWaterMarks.get(sessionId) : undefined;
    if (__DEV__) {
      console.log(
        "[pi:active-session]",
        "set",
        sessionId,
        "conn=",
        connectionId,
        "from=",
        fromEventId,
        "fromDelta=",
        fromDeltaEventId,
      );
    }
    this.api.setActiveSession(connectionId, sessionId, fromEventId, fromDeltaEventId).catch((err) => {
      if (__DEV__) console.warn("[pi:active-session]", "failed", err);
    });
  }

  private async _fetchAndApplyHistory(sessionId: string): Promise<void> {
    const subject = this._getOrCreateSessionSubject(sessionId);
    const requestId = (this._historyRequestIds.get(sessionId) ?? 0) + 1;
    this._historyRequestIds.set(sessionId, requestId);
    const isStale = () => this._historyRequestIds.get(sessionId) !== requestId;

    try {
      const result = await Promise.race([
        this.api.getSessionHistory(sessionId, { limit: 50 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Session history timed out")), 8_000)),
      ]);
      if (isStale()) return;
      const rawMessages = result.messages as Record<string, string>[];
      const converted = convertRawMessages(rawMessages);
      const current = subject.getValue();

      // A newer fetch already rendered messages: never replace them with an
      // empty history (a session whose file is not written yet reads as empty).
      if (converted.length === 0 && current.messages.length > 0) {
        subject.next({ ...current, isReady: true, isLoading: false, isLoadingOlderMessages: false });
        return;
      }

      subject.next({
        ...current,
        messages: converted,
        hasMoreMessages: result.has_more,
        oldestEntryId: result.oldest_entry_id ?? null,
        isReady: true,
        isLoading: false,
        isLoadingOlderMessages: false,
        isStreaming: current.isStreaming,
      });
      this._trackStreamingSession(
        sessionId,
        current.isStreaming,
      );
      if (__DEV__) console.log("[pi:history] ready", sessionId, { messages: converted.length });
    } catch (error) {
      if (isStale()) return;
      const current = subject.getValue();
      subject.next({ ...current, isReady: true, isLoading: false, isLoadingOlderMessages: false });
      if (__DEV__) console.warn("[pi:history] failed", sessionId, error);
    }
  }

  private _handleInstanceId(instanceId: string): void {
    if (this._instanceId !== null && this._instanceId !== instanceId) {
      for (const [_id, subject] of this._sessionStates) {
        subject.next({ ...createEmptySessionState(), isLoading: true });
      }
      this._knownStreamSessionIds.clear();
      this._highWaterMarks.clear();
      this._deltaHighWaterMarks.clear();
      // The old server's turns are over whatever their last event said.
      this._streamingSessionIds = new Set();
      this._streamingSessionIds$.next(this._streamingSessionIds);
      this._serverRestart$.next();
    }
    this._instanceId = instanceId;
  }

  // ---------------------------------------------------------------------------
  // Internal — subject factories
  // ---------------------------------------------------------------------------

  private _trackStreamingSession(sessionId: string, streaming: boolean): void {
    if (!sessionId) return;
    const known = this._streamingSessionIds.has(sessionId);
    if (streaming === known) return;
    const next = new Set(this._streamingSessionIds);
    if (streaming) {
      next.add(sessionId);
    } else {
      next.delete(sessionId);
    }
    this._streamingSessionIds = next;
    this._streamingSessionIds$.next(next);
  }

  private _getOrCreateSessionSubject(sessionId: string): BehaviorSubject<SessionState> {
    let subject = this._sessionStates.get(sessionId);
    if (!subject) {
      subject = new BehaviorSubject<SessionState>(createEmptySessionState());
      this._sessionStates.set(sessionId, subject);
    }
    return subject;
  }

  private _getOrCreateSessionListSubject(workspaceId: string): BehaviorSubject<SessionListState> {
    let subject = this._sessionListStates.get(workspaceId);
    if (!subject) {
      subject = new BehaviorSubject<SessionListState>({
        items: [],
        page: 0,
        total: 0,
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      });
      this._sessionListStates.set(workspaceId, subject);
    }
    return subject;
  }

}

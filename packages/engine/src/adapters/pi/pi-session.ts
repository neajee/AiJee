import type {
  AgentSession,
  AgentSessionRuntime,
  AgentSessionEvent,
} from "@earendil-works/pi-coding-agent";
import { adaptAgentEvent } from "./event-adapter.ts";
import type { ImageAttachment, JsonObject, JsonValue, ModelDescriptor, PromptInput, SessionDescriptor, SessionEntry, SessionEventListener, SessionStats, ToolDescriptor } from "../../core/types.ts";
import type { EngineSession } from "../../core/session.ts";
import { piCapabilities } from "./capabilities.ts";

export class PiSession implements EngineSession {
  readonly capabilities = piCapabilities;
  private unsubscribe?: () => void;
  private readonly listeners = new Set<SessionEventListener>();
  readonly runtime: AgentSessionRuntime;
  readonly cwd: string;

  constructor(runtime: AgentSessionRuntime, cwd: string) {
    this.runtime = runtime;
    this.cwd = cwd;
    this.bind();
  }

  get session(): AgentSession {
    return this.runtime.session;
  }

  describe(): SessionDescriptor {
    return {
      sessionId: this.session.sessionId,
      sessionFile: this.session.sessionFile,
      cwd: this.cwd,
      streaming: this.session.isStreaming,
    };
  }

  subscribe(listener: SessionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async prompt(text: string, options?: PromptInput): Promise<void> {
    // pi throws when a prompt arrives mid-stream without a queue behaviour, so
    // both the images and that choice have to be forwarded, not dropped.
    await this.session.prompt(text, {
      images: options?.images,
      ...(options?.streamingBehavior
        ? { streamingBehavior: options.streamingBehavior }
        : {}),
    });
  }

  async steer(text: string, images?: ImageAttachment[]): Promise<void> {
    await this.session.steer(text, images);
  }

  async followUp(text: string, images?: ImageAttachment[]): Promise<void> {
    await this.session.followUp(text, images);
  }

  async abort(): Promise<void> {
    await this.session.abort();
  }

  state(): JsonObject {
    const state = this.session.state as unknown as JsonObject;
    return {
      ...state,
      messages: this.messages(),
      model: (this.session.model ?? null) as JsonValue,
      thinkingLevel: this.session.thinkingLevel,
      isStreaming: this.session.isStreaming,
      sessionName: this.session.sessionName ?? null,
    };
  }

  messages(): JsonValue[] { return this.session.messages as unknown as JsonValue[]; }
  listThinkingLevels(): string[] { return this.session.getAvailableThinkingLevels() as string[]; }
  availableThinkingLevels(): string[] { return this.listThinkingLevels(); }
  cycleThinkingLevel(): string | undefined { return this.session.cycleThinkingLevel(); }
  async cycleModel(): Promise<JsonValue | undefined> { return (await this.session.cycleModel()) as unknown as JsonValue | undefined; }
  setThinkingLevel(level: string): void { this.session.setThinkingLevel(level as never); }
  availableModels(): ModelDescriptor[] { return [...this.runtime.services.modelRuntime.getAvailableSnapshot()] as unknown as ModelDescriptor[]; }
  listModels(): ModelDescriptor[] { return this.availableModels(); }
  listTools(): ToolDescriptor[] { return this.session.getAllTools() as unknown as ToolDescriptor[]; }
  async setModel(provider: string, modelId: string): Promise<void> {
    const model = this.runtime.services.modelRuntime.getModel(provider, modelId);
    if (!model) throw new Error(`Model not found: ${provider}/${modelId}`);
    await this.session.setModel(model);
  }
  setSteeringMode(mode: "all" | "one-at-a-time"): void { this.session.setSteeringMode(mode); }
  setFollowUpMode(mode: "all" | "one-at-a-time"): void { this.session.setFollowUpMode(mode); }
  async compact(instructions?: string): Promise<JsonValue> { return (await this.session.compact(instructions)) as unknown as JsonValue; }
  setAutoCompaction(enabled: boolean): void { this.session.setAutoCompactionEnabled(enabled); }
  setAutoRetry(enabled: boolean): void { this.session.setAutoRetryEnabled(enabled); }
  abortRetry(): void { this.session.abortRetry(); }
  abortBash(): void { this.session.abortBash(); }
  async bash(command: string, id?: string): Promise<JsonValue> { return (await this.session.executeBash(command, undefined, { id })) as unknown as JsonValue; }
  sessionStats(): SessionStats { return this.session.getSessionStats() as unknown as SessionStats; }
  setSessionName(name: string): void { this.session.setSessionName(name); }
  entries(since?: string): SessionEntry[] { const entries = this.session.sessionManager.getEntries(); return (since ? entries.slice(entries.findIndex((entry) => entry.id === since) + 1) : entries) as unknown as SessionEntry[]; }
  tree(): JsonValue { return this.session.sessionManager.getTree() as unknown as JsonValue; }
  async fork(entryId: string, options?: { position?: "before" | "at" }): Promise<JsonValue> {
    const result = await this.runtime.fork(entryId, options);
    if (!result.cancelled) this.bind();
    return result as unknown as JsonValue;
  }
  async navigateTree(entryId: string): Promise<{ cancelled: boolean }> { return this.session.navigateTree(entryId, { summarize: false }); }
  forkMessages(): Array<{ entryId: string; text: string }> { return this.session.getUserMessagesForForking(); }
  lastAssistantText(): string | null { return this.session.getLastAssistantText() ?? null; }
  async exportHtml(outputPath?: string): Promise<string> { return this.session.exportToHtml(outputPath); }
  commands(): JsonValue[] { return this.session.extensionRunner.getRegisteredCommands() as unknown as JsonValue[]; }
  async reloadResources(): Promise<void> {
    await this.session.reload();
  }

  async newSession(): Promise<SessionDescriptor> {
    await this.runtime.newSession();
    this.bind();
    return this.describe();
  }

  async switchSession(sessionFile: string): Promise<SessionDescriptor> {
    await this.runtime.switchSession(sessionFile);
    this.bind();
    return this.describe();
  }

  async dispose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.listeners.clear();
    await this.runtime.dispose();
  }

  private bind(): void {
    this.unsubscribe?.();
    this.unsubscribe = this.session.subscribe((event: AgentSessionEvent) => {
      const adapted = adaptAgentEvent(event);
      for (const listener of this.listeners) listener(adapted);
    });
  }
}

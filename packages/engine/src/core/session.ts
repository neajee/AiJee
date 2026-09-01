import type { EngineCapabilities } from "./capabilities.ts";
import type { AgentEvent, ImageAttachment, JsonObject, JsonValue, ModelDescriptor, PromptInput, SessionDescriptor, SessionEntry, SessionEventListener, SessionStats, ToolDescriptor } from "./types.ts";

export type SessionMode = "all" | "one-at-a-time";

export interface EngineSession {
  readonly capabilities: EngineCapabilities;
  describe(): SessionDescriptor;
  prompt(text: string, options?: PromptInput): Promise<void>;
  steer(text: string, images?: ImageAttachment[]): Promise<void>;
  followUp(text: string, images?: ImageAttachment[]): Promise<void>;
  abort(): Promise<void>;
  subscribe(listener: SessionEventListener): () => void;
  state(): JsonObject;
  messages(): JsonValue[];
  listModels(): ModelDescriptor[];
  listTools(): ToolDescriptor[];
  listThinkingLevels(): string[];
  cycleModel(): Promise<JsonValue | undefined>;
  cycleThinkingLevel(): string | undefined;
  setModel(provider: string, modelId: string): Promise<void>;
  setThinkingLevel(level: string): void;
  setSteeringMode(mode: SessionMode): void;
  setFollowUpMode(mode: SessionMode): void;
  compact(instructions?: string): Promise<JsonValue>;
  setAutoCompaction(enabled: boolean): void;
  setAutoRetry(enabled: boolean): void;
  abortRetry(): void;
  abortBash(): void;
  bash(command: string, id?: string): Promise<JsonValue>;
  sessionStats(): SessionStats;
  setSessionName(name: string): void;
  entries(since?: string): SessionEntry[];
  activeEntries?(): SessionEntry[];
  tree(): JsonValue;
  fork(entryId: string, options?: { position?: "before" | "at" }): Promise<JsonValue>;
  navigateTree?(entryId: string): Promise<{ cancelled: boolean }>;
  forkMessages(): Array<{ entryId: string; text: string }>;
  lastAssistantText(): string | null;
  exportHtml(outputPath?: string): Promise<string>;
  commands(): JsonValue[];
  reloadResources?(): Promise<void>;
  newSession(): Promise<SessionDescriptor>;
  switchSession(sessionFile: string): Promise<SessionDescriptor>;
  dispose(): Promise<void>;
}

export type { AgentEvent };

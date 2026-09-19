import type { ContentBlock, ToolContent } from "./content.ts";

export interface CostInfo {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
}

export interface UsageInfo {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  totalTokens?: number;
  cost?: CostInfo;
}

export type ModelInputType = "text" | "image";
export type ModelThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
export type ThinkingLevelMap = Partial<Record<ModelThinkingLevel, string | null>>;

export interface ModelInfo {
  id: string;
  name?: string;
  provider?: string;
  api?: string;
  baseUrl?: string;
  reasoning?: boolean;
  thinkingLevelMap?: ThinkingLevelMap | null;
  input?: ModelInputType[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
}

export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";
export interface UserMessage { role: "user"; content: string | ContentBlock[]; timestamp: number; attachments?: Attachment[]; }
export interface AssistantMessage { role: "assistant"; content: ContentBlock[]; api?: string; provider?: string; model?: string; responseId?: string; usage?: UsageInfo; stopReason?: StopReason; errorMessage?: string; timestamp: number; }
export interface ToolResultMessage { role: "toolResult"; toolCallId: string; toolName: string; content: ContentBlock[]; usage?: UsageInfo; isError: boolean; timestamp: number; }
export interface BashExecutionMessage { role: "bashExecution"; command: string; output: string; exitCode: number; cancelled: boolean; truncated: boolean; fullOutputPath: string | null; timestamp: number; }
export type AgentMessage = UserMessage | AssistantMessage | ToolResultMessage | BashExecutionMessage;

export interface Attachment { id: string; type: "image"; fileName: string; mimeType: string; size: number; content: string; extractedText: string | null; preview: string | null; }
export interface ToolCallPartial { id?: string; name?: string; }
export interface ToolCallFull { id: string; name: string; arguments: Record<string, string>; }
export type MessageDelta =
  | { type: "start" }
  | { type: "text_start" | "thinking_start" | "thinking_end"; contentIndex?: number; partial?: AssistantMessage }
  | { type: "text_delta" | "thinking_delta"; delta: string; contentIndex?: number; partial?: AssistantMessage }
  | { type: "text_end"; contentIndex?: number; content?: string; partial?: AssistantMessage }
  | { type: "toolcall_start"; contentIndex?: number; partial?: ToolCallPartial }
  | { type: "toolcall_delta"; delta: string; contentIndex?: number }
  | { type: "toolcall_end"; contentIndex?: number; toolCall: ToolCallFull }
  | { type: "done"; reason?: StopReason; message?: AssistantMessage }
  | { type: "error"; reason?: string; message?: AssistantMessage };

export interface CompactionResult { summary?: string; firstKeptEntryId?: string; tokensBefore?: number; estimatedTokensAfter?: number; usage?: UsageInfo; details?: Record<string, unknown>; }
export type ExtensionUiRequest =
  | { method: "select"; title: string; options: string[]; timeout?: number }
  | { method: "confirm"; title: string; message?: string; timeout?: number }
  | { method: "input"; title: string; placeholder?: string }
  | { method: "editor"; title: string; prefill?: string }
  | { method: "notify"; message: string; notifyType?: "info" | "warning" | "error" }
  | { method: "setStatus"; statusKey: string; statusText?: string }
  | { method: "setWidget"; widgetKey: string; widgetLines?: string[]; widgetPlacement?: "aboveEditor" | "belowEditor" }
  | { method: "setTitle"; title: string }
  | { method: "set_editor_text"; text: string };

export interface AgentStateData {
  model?: ModelInfo | null; thinkingLevel?: string; mode?: "chat" | "work" | "plan"; isStreaming?: boolean; isCompacting?: boolean;
  steeringMode?: "all" | "one-at-a-time"; followUpMode?: "all" | "one-at-a-time"; sessionFile?: string; sessionId?: string;
  sessionName?: string; autoCompactionEnabled?: boolean; messageCount?: number; pendingMessageCount?: number;
  pendingExtensionUiRequest?: (ExtensionUiRequest & { id: string }) | null;
}

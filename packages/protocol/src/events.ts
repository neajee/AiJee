import type { AgentMessage, AgentStateData, AssistantMessage, CompactionResult, MessageDelta, ToolResultMessage } from "./messages.ts";
import type { ToolContent } from "./content.ts";

export type AgentStreamEvent =
  | { type: "agent_start" }
  | { type: "agent_end"; messages: AgentMessage[]; willRetry?: boolean }
  | { type: "agent_settled" }
  | { type: "turn_start"; turnIndex?: number; timestamp?: number }
  | { type: "turn_end"; message?: AssistantMessage; toolResults?: ToolResultMessage[]; turnIndex?: number; timestamp?: number }
  | { type: "message_start"; message: AssistantMessage }
  | { type: "message_update"; assistantMessageEvent: MessageDelta; usage?: import("./messages.ts").UsageInfo; message?: AssistantMessage }
  | { type: "message_end"; message: AssistantMessage }
  | { type: "tool_execution_start"; toolCallId: string; toolName: string; args?: Record<string, string> }
  | { type: "tool_execution_update"; toolCallId: string; toolName: string; args?: Record<string, string>; partialResult?: ToolContent }
  | { type: "tool_execution_end"; toolCallId: string; toolName: string; result?: ToolContent; isError: boolean }
  | { type: "compaction_start"; reason: "manual" | "threshold" | "overflow" }
  | { type: "compaction_end"; reason?: "manual" | "threshold" | "overflow"; result?: CompactionResult | null; aborted: boolean; willRetry: boolean; errorMessage?: string }
  | { type: "bash_execution_update"; id?: string; delta: string }
  | { type: "queue_update"; steering: string[]; followUp: string[] }
  | { type: "entry_appended"; entry: Record<string, unknown> }
  | { type: "session_info_changed"; name?: string }
  | { type: "thinking_level_changed"; level: string }
  | { type: "summarization_retry_scheduled"; attempt: number; maxAttempts: number; delayMs: number; errorMessage: string }
  | { type: "summarization_retry_attempt_start"; source: "compaction" | "branchSummary"; reason?: "manual" | "threshold" | "overflow" }
  | { type: "summarization_retry_finished" }
  | { type: "auto_retry_start"; attempt: number; maxAttempts: number; delayMs: number; errorMessage: string }
  | { type: "auto_retry_end"; success: boolean; attempt: number; finalError?: string }
  | { type: "extension_error"; extensionPath: string; event: string; error: string }
  | ({ type: "extension_ui_request"; id: string } & import("./messages.ts").ExtensionUiRequest)
  | ({ type: "agent_state" } & AgentStateData)
  | { type: "session_state"; isStreaming?: boolean }
  | { type: "session_process_exited" }
  | { type: "session_idle_timeout" };

export type ServerEvent =
  | { type: "server_hello"; instance_id: string; connection_id: string }
  | { type: "session_stream_hello"; session_id: string }
  | { type: "active_sessions"; data: { session_ids: string[] } };

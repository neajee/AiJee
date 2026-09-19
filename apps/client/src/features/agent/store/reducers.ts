import { isAbortReason } from "@aijee/client-sdk";
import type { AgentConnectionState, ChatMessage, StreamEvent, ToolCallInfo } from "../types";
import { parsePendingExtensionUiRequest, type PendingExtensionUiRequest } from "../extension-ui";
import { extractAgentMode, type AgentMode } from "../mode";
import { extractTextFromContent, extractUsageInfo, getAssistantErrorMessage } from "./message-converter";

function isModeSlashCommand(message: string): boolean {
  const firstToken = message.trim().split(/\s+/)[0];
  return firstToken === "/chat" || firstToken === "/work" || firstToken === "/plan";
}

const PENDING_EXTENSION_UI_CLEAR_EVENTS = new Set([
  "turn_start",
  "message_start",
  "message_update",
  "message_end",
  "tool_execution_start",
  "tool_execution_update",
  "tool_execution_end",
  "turn_end",
  "agent_settled",
  "session_process_exited",
]);

export const DEFAULT_CONNECTION_STATE: AgentConnectionState = {
  status: "idle",
  retryAttempt: 0,
  nextRetryAt: null,
  lastDisconnectReason: null,
  disconnectedAt: null,
};

function updateToolCall(
  messages: ChatMessage[],
  toolCallId: string,
  updater: (toolCall: ToolCallInfo) => ToolCallInfo,
): ChatMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.toolCalls) {
      const toolCallIndex = msg.toolCalls.findIndex((t) => t.id === toolCallId);
      if (toolCallIndex === -1) continue;

      const currentToolCall = msg.toolCalls[toolCallIndex]!;
      const nextToolCall = updater(currentToolCall);
      if (nextToolCall === currentToolCall) {
        return messages;
      }

      const nextToolCalls = [...msg.toolCalls];
      nextToolCalls[toolCallIndex] = nextToolCall;

      const nextMessages = [...messages];
      nextMessages[i] = {
        ...msg,
        toolCalls: nextToolCalls,
      };

      return nextMessages;
    }
  }
  return messages;
}

export interface AgentState {
  messages: Record<string, ChatMessage[]>;
  modes: Record<string, AgentMode | null | undefined>;
  pendingExtensionUiRequests: Record<
    string,
    PendingExtensionUiRequest | null | undefined
  >;
  streaming: Record<string, boolean>;
  lastEventId: number | null;
  connection: AgentConnectionState;
  reconnectNonce: number;
  pendingPrompt: { workspaceId: string; text: string } | null;
  alertMessage: string | null;

  processStreamEvent: (event: StreamEvent) => void;
  processStreamEvents: (events: StreamEvent[]) => void;
  setHistoryMessages: (sessionId: string, piMessages: any[]) => void;
  setHistoryEntries: (sessionId: string, entries: any[]) => void;
  clearMessages: (sessionId: string) => void;
  setConnectionState: (connection: AgentConnectionState) => void;
  requestReconnect: () => void;
  setPendingPrompt: (
    pending: { workspaceId: string; text: string } | null,
  ) => void;
  setAlertMessage: (message: string | null) => void;
  setPendingExtensionUiRequest: (
    sessionId: string,
    pending: PendingExtensionUiRequest | null,
  ) => void;
}

function getStreamAlertMessage(event: StreamEvent): string | null {
  const data = event.data as Record<string, any> | undefined;

  if (event.type === "message_update") {
    const delta = data?.assistantMessageEvent as
      | { type?: string; reason?: string }
      | undefined;
    if (delta?.type === "error" && !isAbortReason(delta.reason)) {
      return delta?.reason
        ? `Agent error: ${delta.reason}`
        : "Agent response failed.";
    }
  }

  if (event.type === "extension_error" && typeof data?.error === "string") {
    return `Extension error: ${data.error}`;
  }

  if (
    event.type === "auto_retry_end" &&
    data?.success === false &&
    typeof data?.finalError === "string"
  ) {
    return `Retry failed: ${data.finalError}`;
  }

  if (
    event.type === "compaction_end" &&
    data?.result == null &&
    data?.aborted === false &&
    typeof data?.errorMessage === "string"
  ) {
    return `Compaction failed: ${data.errorMessage}`;
  }

  return null;
}

/**
 * Aborted turns never deliver `tool_execution_end`, so in-flight tool calls
 * would keep spinning after the run stops.
 */
function cancelInFlightToolCalls(msgs: ChatMessage[]): ChatMessage[] {
  let changed = false;
  const next = msgs.map((msg) => {
    if (!msg.toolCalls?.length) return msg;
    let msgChanged = false;
    const toolCalls = msg.toolCalls.map((tc) => {
      if (!["streaming", "pending", "running"].includes(tc.status)) return tc;
      msgChanged = true;
      return { ...tc, status: "cancelled" as const };
    });
    if (!msgChanged) return msg;
    changed = true;
    return { ...msg, toolCalls };
  });
  return changed ? next : msgs;
}

export function reduceStreamEvents(
  state: Pick<
    AgentState,
    "messages" | "modes" | "pendingExtensionUiRequests" | "streaming" | "lastEventId" | "alertMessage"
  >,
  events: StreamEvent[],
) {
  const messages = { ...state.messages };
  const modes = { ...state.modes };
  const pendingExtensionUiRequests = {
    ...state.pendingExtensionUiRequests,
  };
  const streaming = { ...state.streaming };
  let lastEventId = state.lastEventId;
  let alertMessage = state.alertMessage;

  for (const event of events) {
    const { session_id: sessionId } = event;
    const piEvent = event.data;
    const eventType = event.type;
    let msgs = [...(messages[sessionId] ?? [])];
    const streamedMode = extractAgentMode(piEvent);

    if (streamedMode) {
      modes[sessionId] = streamedMode;
    }

    if (PENDING_EXTENSION_UI_CLEAR_EVENTS.has(eventType)) {
      pendingExtensionUiRequests[sessionId] = null;
    }

    switch (eventType) {
      case "client_command": {
        if (
          ["prompt", "steer", "follow_up"].includes(piEvent.type) &&
          piEvent.message &&
          !isModeSlashCommand(piEvent.message)
        ) {
          msgs.push({
            id: `user-${event.id}`,
            role: "user",
            text: piEvent.message,
            timestamp: event.timestamp,
          });
        }
        if (piEvent.type === "extension_ui_response") {
          pendingExtensionUiRequests[sessionId] = null;
        }
        break;
      }

      case "agent_start": {
        streaming[sessionId] = true;
        break;
      }

      case "turn_start": {
        streaming[sessionId] = true;
        break;
      }

      case "agent_end": {
        if (piEvent.willRetry !== true) {
          streaming[sessionId] = false;
          msgs = cancelInFlightToolCalls(msgs);
        }
        break;
      }

      case "agent_settled": {
        streaming[sessionId] = false;
        msgs = cancelInFlightToolCalls(msgs);
        break;
      }

      case "extension_ui_request": {
        if (piEvent.method === "setStatus" && piEvent.statusKey === "plan-mode") {
          const statusText =
            typeof piEvent.statusText === "string"
              ? piEvent.statusText.toLowerCase()
              : "";
          modes[sessionId] = statusText.includes("plan") ? "plan" : "work";
        }
        const pending = parsePendingExtensionUiRequest(piEvent);
        if (pending) {
          pendingExtensionUiRequests[sessionId] = pending;
        }
        break;
      }

      case "message_start": {
        const msg = piEvent.message;
        if (msg?.role === "assistant") {
          msgs.push({
            id: `assistant-${event.id}`,
            role: "assistant",
            text: "",
            errorMessage: undefined,
            thinking: "",
            toolCalls: [],
            timestamp: event.timestamp,
            isStreaming: true,
            model: msg.model,
            provider: msg.provider,
            api: msg.api,
            responseId: msg.responseId,
            usage: extractUsageInfo(msg),
          });
        }
        break;
      }

      case "message_update": {
        const delta = piEvent.assistantMessageEvent;
        const lastIdx = msgs.findLastIndex(
          (m) => m.role === "assistant" && m.isStreaming,
        );
        if (lastIdx === -1 || !delta) break;

        const lastMsg = { ...msgs[lastIdx] };
        msgs[lastIdx] = lastMsg;

        if (piEvent.message?.role === "assistant") {
          const msg = piEvent.message;
          const content = Array.isArray(msg.content) ? msg.content : [];
          lastMsg.text = content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text ?? "")
            .join("");
          const thinking = content
            .filter((c: any) => c.type === "thinking")
            .map((c: any) => c.thinking ?? "")
            .join("");
          if (thinking) lastMsg.thinking = thinking;
          const toolCalls: ToolCallInfo[] = content
            .filter((c: any) => c.type === "toolCall")
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              arguments:
                typeof c.arguments === "string"
                  ? c.arguments
                  : JSON.stringify(c.arguments),
              status: "streaming" as const,
            }));
          if (toolCalls.length > 0) lastMsg.toolCalls = toolCalls;
          lastMsg.model = msg.model ?? lastMsg.model;
          lastMsg.provider = msg.provider ?? lastMsg.provider;
          lastMsg.api = msg.api ?? lastMsg.api;
          lastMsg.responseId = msg.responseId ?? lastMsg.responseId;
          lastMsg.usage = extractUsageInfo(msg) ?? lastMsg.usage;
          break;
        }

        switch (delta.type) {
          case "text_delta":
            lastMsg.text += delta.delta ?? "";
            break;
          case "thinking_delta":
            lastMsg.thinking = (lastMsg.thinking ?? "") + (delta.delta ?? "");
            break;
          case "toolcall_start": {
            const toolCalls = [...(lastMsg.toolCalls ?? [])];
            toolCalls.push({
              id: delta.partial?.id ?? `tc-${Date.now()}`,
              name: delta.partial?.name ?? "",
              arguments: "",
              status: "streaming",
            });
            lastMsg.toolCalls = toolCalls;
            break;
          }
          case "toolcall_delta": {
            const toolCalls = [...(lastMsg.toolCalls ?? [])];
            const last = toolCalls[toolCalls.length - 1];
            if (last) {
              toolCalls[toolCalls.length - 1] = {
                ...last,
                arguments: last.arguments + (delta.delta ?? ""),
              };
            }
            lastMsg.toolCalls = toolCalls;
            break;
          }
          case "toolcall_end": {
            const toolCalls = [...(lastMsg.toolCalls ?? [])];
            const last = toolCalls[toolCalls.length - 1];
            if (last && delta.toolCall) {
              toolCalls[toolCalls.length - 1] = {
                ...last,
                id: delta.toolCall.id,
                name: delta.toolCall.name,
                arguments:
                  typeof delta.toolCall.arguments === "string"
                    ? delta.toolCall.arguments
                    : JSON.stringify(delta.toolCall.arguments),
                status: "pending",
              };
            }
            lastMsg.toolCalls = toolCalls;
            break;
          }
          case "done":
            lastMsg.isStreaming = false;
            lastMsg.stopReason = delta.reason;
            break;
          case "error": {
            lastMsg.isStreaming = false;
            const aborted = isAbortReason(delta.reason);
            lastMsg.stopReason = aborted ? "aborted" : delta.reason ?? "error";
            lastMsg.errorMessage =
              !aborted &&
              typeof delta.reason === "string" &&
              !["error", "aborted"].includes(delta.reason)
                ? delta.reason
                : undefined;
            break;
          }
        }
        break;
      }

      case "message_end": {
        if (piEvent.message?.role !== "assistant") {
          break;
        }
        const lastIdx = msgs.findLastIndex(
          (m) => m.role === "assistant" && m.isStreaming,
        );
        if (lastIdx !== -1) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            errorMessage:
              msgs[lastIdx].errorMessage ??
              getAssistantErrorMessage(piEvent.message),
            provider: piEvent.message?.provider ?? msgs[lastIdx].provider,
            api: piEvent.message?.api ?? msgs[lastIdx].api,
            responseId:
              piEvent.message?.responseId ?? msgs[lastIdx].responseId,
            usage:
              extractUsageInfo(piEvent.message) ?? msgs[lastIdx].usage,
            isStreaming: false,
            stopReason: piEvent.message?.stopReason,
          };
        }
        break;
      }

      case "tool_execution_start": {
        msgs = updateToolCall(msgs, piEvent.toolCallId, (toolCall) => {
          if (toolCall.status === "running") {
            return toolCall;
          }

          return {
            ...toolCall,
            status: "running",
          };
        });
        break;
      }

      case "tool_execution_update": {
        if (!piEvent.partialResult?.content) break;

        const partialResult = extractTextFromContent(
          piEvent.partialResult.content,
        );

        msgs = updateToolCall(msgs, piEvent.toolCallId, (toolCall) => {
          if (toolCall.partialResult === partialResult) {
            return toolCall;
          }

          return {
            ...toolCall,
            partialResult,
          };
        });
        break;
      }

      case "tool_execution_end": {
        const status = piEvent.isError ? "error" : "complete";
        const result = extractTextFromContent(piEvent.result?.content);

        msgs = updateToolCall(msgs, piEvent.toolCallId, (toolCall) => {
          if (
            toolCall.status === status &&
            toolCall.result === result &&
            toolCall.isError === piEvent.isError
          ) {
            return toolCall;
          }

          return {
            ...toolCall,
            status,
            result,
            isError: piEvent.isError,
          };
        });
        break;
      }

      case "session_process_exited": {
        streaming[sessionId] = false;
        msgs = cancelInFlightToolCalls(msgs);
        break;
      }
    }

    const nextAlertMessage = getStreamAlertMessage(event);
    if (nextAlertMessage) {
      alertMessage = nextAlertMessage;
    }

    messages[sessionId] = msgs;
    lastEventId = event.id;
  }

  return {
    messages,
    modes,
    pendingExtensionUiRequests,
    streaming,
    lastEventId,
    alertMessage,
  };
}

import type { ChatMessage, ToolCallInfo, ProductAgentMode, PendingExtensionUiRequest } from "../../types/chat-message";
import type { AgentStateData, StreamEventEnvelope } from "@aijee/protocol";
import type { SessionState } from "./session-state";
import { extractTextFromContent, extractImagesFromContent, extractMessageEntryId, stampTurnEndFromBackend, findLastStreamingIndex, updateLastStreaming, cancelInFlightToolCalls, extractSubagentMeta, stringifyToolArguments, findToolCallIndex, buildToolCallsFromContent } from "./content.ts";
import { isModeSlashCommand } from "./session-state.ts";
import { isAbortReason } from "./content.ts";
import { normalizeInlineThinking } from "./inline-thinking.ts";
import { updateToolCall, extractUsage, errorMsg } from "./tool-calls.ts";

const CLEAR_PENDING_EVENTS = new Set([
  "turn_start", "message_start", "message_update", "message_end",
  "tool_execution_start", "tool_execution_update", "tool_execution_end",
  "turn_end", "agent_settled", "session_process_exited",
]);

export function reduceStreamEvent(state: SessionState, envelope: StreamEventEnvelope): SessionState {
  const event = envelope.data;
  const eventType = envelope.type;

  let {
    messages,
    isStreaming,
    mode,
    pendingExtensionUiRequest,
    steeringQueue,
    followUpQueue,
    agentState,
  } = state;

  if (CLEAR_PENDING_EVENTS.has(eventType)) {
    pendingExtensionUiRequest = null;
  }

  switch (eventType) {
    case "client_command": {
      const data = event as {
        type: string;
        message?: string;
        images?: { type: "image"; data: string; mimeType: string }[];
      };
      if (
        ["prompt", "steer", "follow_up"].includes(data.type) &&
        data.message &&
        !isModeSlashCommand(data.message)
      ) {
        const attachments = (data.images ?? [])
          .filter((img) => img.type === "image" && !!img.data)
          .map((img) => ({
            id: `img-${envelope.id}-${img.mimeType}-${img.data.length}`,
            type: "image" as const,
            mimeType: img.mimeType || "image/png",
            data: img.data,
          }));
        messages = [...messages, {
          id: `user-${envelope.id}`,
          role: "user",
          text: data.message,
          ...(attachments.length > 0 ? { attachments } : {}),
          timestamp: envelope.timestamp,
        }];
      }
      break;
    }

    case "agent_start":
    case "turn_start": {
      isStreaming = true;
      break;
    }

    case "turn_end": {
      break;
    }

    case "agent_end": {
      const willRetry = "willRetry" in event && event.willRetry === true;
      if (!willRetry) {
        isStreaming = false;
      }
      let lastAssist: ChatMessage | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]!.role === "assistant") { lastAssist = messages[i]; break; }
      }
      if (lastAssist?.stopReason === "stop") {
        const raw = (event as unknown as Record<string, unknown>)["turnStats"] as
          | { filesEdited?: number; filesCreated?: number; linesAdded?: number; linesRemoved?: number; durationMs?: number }
          | undefined;
        if (raw) {
          messages = stampTurnEndFromBackend(messages, raw);
        }
      }
      if (!willRetry) {
        messages = updateLastStreaming(messages, (msg) => ({ ...msg, isStreaming: false }));
        messages = cancelInFlightToolCalls(messages);
      }
      break;
    }

    case "agent_settled": {
      isStreaming = false;
      messages = updateLastStreaming(messages, (msg) => ({ ...msg, isStreaming: false }));
      messages = cancelInFlightToolCalls(messages);
      break;
    }

    case "message_start": {
      if (event.type !== "message_start") break;
      const msg = event.message;
      const raw = msg as unknown as Record<string, unknown>;
      if (raw["role"] === "user") {
        const text = extractTextFromContent(raw["content"] as unknown[] | undefined);
        const content = raw["content"] as unknown[] | undefined;
        const images = extractImagesFromContent(content);
        if ((!text && !images?.length) || isModeSlashCommand(text)) break;
        const entryId = extractMessageEntryId(raw);
        const attachments = images?.map((image, index) => ({
          id: `img-${envelope.id}-${index}`,
          type: "image" as const,
          mimeType: image.mimeType,
          data: image.data,
        }));
        const existingIdx = messages.findIndex((item) =>
          item.role === "user" && ((entryId && item.entryId === entryId) || item.id === `user-${envelope.id}` || (item.pending && item.text === text)),
        );
        const userMessage: ChatMessage = {
          id: `user-${envelope.id}`,
          entryId,
          role: "user",
          text,
          timestamp: envelope.timestamp,
          ...(attachments?.length ? { attachments } : {}),
        };
        if (existingIdx >= 0) {
          const next = [...messages];
          next[existingIdx] = { ...next[existingIdx]!, ...userMessage, pending: undefined };
          messages = next;
        } else {
          messages = [...messages, userMessage];
        }
        break;
      }
      if (msg?.role === "assistant") {
        const newId = `assistant-${envelope.id}`;
        const existingIdx = messages.findIndex((m) => m.id === newId);
        if (existingIdx >= 0) {
          const next = [...messages];
          next[existingIdx] = { ...next[existingIdx]!, isStreaming: true };
          messages = next;
        } else {
          messages = [...messages, {
            id: newId,
            entryId: extractMessageEntryId(msg as unknown as Record<string, unknown>),
            role: "assistant",
            text: "",
            thinking: "",
            toolCalls: [],
            timestamp: envelope.timestamp,
            isStreaming: true,
            model: msg.model,
            provider: msg.provider,
            api: msg.api,
            responseId: msg.responseId,
          }];
        }
      }
      break;
    }

    case "message_update": {
      if (event.type !== "message_update") break;
      let idx = findLastStreamingIndex(messages);
      if (idx === -1) {
        messages = [...messages, {
          id: `assistant-${envelope.id}`,
          role: "assistant" as const,
          text: "",
          thinking: "",
          toolCalls: [],
          timestamp: envelope.timestamp,
          isStreaming: true,
        }];
        idx = messages.length - 1;
      }
      const delta = event.assistantMessageEvent;
      const current = messages[idx]!;
      let updated = { ...current };

      if (event.message?.role === "assistant") {
        const msg = event.message;
        const content = Array.isArray(msg.content) ? msg.content : [];
        updated.text = content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text ?? "")
          .join("");
        const thinking = content
          .filter((c: any) => c.type === "thinking")
          .map((c: any) => c.thinking ?? "")
          .join("");
        if (thinking) updated.thinking = thinking;
        const toolCalls = buildToolCallsFromContent(
          content as unknown as Record<string, unknown>[],
          updated.toolCalls,
          "streaming",
        );
        if (toolCalls.length > 0) updated.toolCalls = toolCalls;
        updated.model = msg.model ?? updated.model;
        updated.provider = msg.provider ?? updated.provider;
        updated.api = msg.api ?? updated.api;
        updated.responseId = msg.responseId ?? updated.responseId;
        updated.entryId = extractMessageEntryId(msg as unknown as Record<string, unknown>) ?? updated.entryId;
        updated.usage = extractUsage(msg as unknown as Record<string, unknown>) ?? updated.usage;
      } else {
        switch (delta.type) {
          case "text_delta":
            updated.text = (updated.text ?? "") + delta.delta;
            break;
          case "thinking_delta":
            updated.thinking = (updated.thinking ?? "") + delta.delta;
            break;
          case "toolcall_start": {
            const toolCalls = [...(updated.toolCalls ?? [])];
            toolCalls.push({
              id: delta.partial?.id ?? `tc-${Date.now()}`,
              name: delta.partial?.name ?? "",
              arguments: "",
              status: "streaming",
              contentIndex: delta.contentIndex,
            });
            updated.toolCalls = toolCalls;
            break;
          }
          case "toolcall_delta": {
            const toolCalls = [...(updated.toolCalls ?? [])];
            const toolCallIndex = findToolCallIndex(toolCalls, delta.contentIndex);
            const currentToolCall = toolCalls[toolCallIndex];
            if (currentToolCall) {
              const nextArgs = currentToolCall.arguments + delta.delta;
              let inferredName = currentToolCall.name;
              if (!inferredName && nextArgs.length > 10) {
                if (nextArgs.includes('"oldText"')) inferredName = "edit";
                else if (nextArgs.includes('"content"')) inferredName = "write";
                else if (nextArgs.includes('"command"')) inferredName = "bash";
                else if (nextArgs.includes('"query"')) inferredName = "search";
                else if (nextArgs.includes('"agent"')) inferredName = "subagent";
              }
              toolCalls[toolCallIndex] = {
                ...currentToolCall,
                arguments: nextArgs,
                contentIndex: delta.contentIndex ?? currentToolCall.contentIndex,
                ...(inferredName && inferredName !== currentToolCall.name ? { name: inferredName } : {}),
              };
              updated.toolCalls = toolCalls;
            }
            break;
          }
          case "toolcall_end": {
            const toolCalls = [...(updated.toolCalls ?? [])];
            const toolCallIndex = findToolCallIndex(toolCalls, delta.contentIndex);
            const currentToolCall = toolCalls[toolCallIndex];
            if (currentToolCall && delta.toolCall) {
              const prevId = currentToolCall.id !== delta.toolCall.id ? currentToolCall.id : currentToolCall.previousId;
              toolCalls[toolCallIndex] = {
                ...currentToolCall,
                id: delta.toolCall.id,
                name: delta.toolCall.name,
                arguments: stringifyToolArguments(delta.toolCall.arguments),
                status: "pending",
                contentIndex: delta.contentIndex ?? currentToolCall.contentIndex,
                ...(prevId ? { previousId: prevId } : {}),
              };
              updated.toolCalls = toolCalls;
            }
            break;
          }
          case "done":
            updated.isStreaming = false;
            updated.stopReason = delta.reason;
            break;
          case "error": {
            updated.isStreaming = false;
            const aborted = isAbortReason(delta.reason);
            updated.stopReason = aborted
              ? "aborted"
              : ((delta.reason as ChatMessage["stopReason"]) ?? "error");
            updated.errorMessage =
              !aborted && delta.reason && !["error", "aborted"].includes(delta.reason)
                ? delta.reason
                : undefined;
            break;
          }
        }
      }

      const next = [...messages];
      // Some endpoints stream reasoning inside <think> tags in the text; move it
      // to `thinking` so it renders as thinking rather than as the answer.
      next[idx] = normalizeInlineThinking(updated);
      messages = next;
      break;
    }

    case "message_end": {
      if (event.type !== "message_end") break;
      const endMsg = event.message as unknown as Record<string, unknown> | undefined;
      if (endMsg?.["role"] === "user") {
        const text = extractTextFromContent(endMsg["content"] as unknown[] | undefined);
        const entryId = extractMessageEntryId(endMsg);
        const idx = messages.findIndex((item) => item.role === "user" && ((entryId && item.entryId === entryId) || (text && item.text === text)));
        if (idx !== -1) {
          const next = [...messages];
          next[idx] = { ...next[idx]!, ...(entryId ? { entryId } : {}), pending: undefined };
          messages = next;
        }
        break;
      }
      if (endMsg?.["role"] !== "assistant") {
        break;
      }
      let endIdx = findLastStreamingIndex(messages);
      if (endIdx === -1) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i]!.role === "assistant") { endIdx = i; break; }
        }
      }
      if (endIdx !== -1) {
        const msg = messages[endIdx]!;
        const updated: ChatMessage = {
          ...msg,
          isStreaming: false,
          entryId: extractMessageEntryId(endMsg ?? {}) ?? msg.entryId,
          stopReason: endMsg?.["stopReason"] as ChatMessage["stopReason"] ?? msg.stopReason,
          errorMessage: errorMsg(endMsg ?? {}) ?? msg.errorMessage,
          provider: (endMsg?.["provider"] as string) ?? msg.provider,
          api: (endMsg?.["api"] as string) ?? msg.api,
          responseId: (endMsg?.["responseId"] as string) ?? msg.responseId,
          usage: extractUsage(endMsg as Record<string, unknown> ?? {}) ?? msg.usage,
        };
        if (endMsg && Array.isArray(endMsg["content"])) {
          const content = endMsg["content"] as Record<string, unknown>[];
          const text = content.filter(c => c["type"] === "text").map(c => (c["text"] as string) ?? "").join("");
          if (text) updated.text = text;
          const thinking = content.filter(c => c["type"] === "thinking").map(c => (c["thinking"] as string) ?? "").join("");
          if (thinking) updated.thinking = thinking;
          const toolCalls = buildToolCallsFromContent(content, msg.toolCalls, "pending");
          if (toolCalls.length > 0) updated.toolCalls = toolCalls;
        }
        const next = [...messages];
        next[endIdx] = normalizeInlineThinking(updated);
        messages = next;
      }
      break;
    }

    case "tool_execution_start": {
      if (event.type !== "tool_execution_start") break;
      messages = updateToolCall(messages, event.toolCallId, (tc) => ({ ...tc, status: "running" }));
      break;
    }

    case "tool_execution_update": {
      if (event.type !== "tool_execution_update") break;
      const partial = event.partialResult
        ? extractTextFromContent(event.partialResult.content as unknown[])
        : undefined;
      const details = (event.partialResult as any)?.details;
      const progress = Array.isArray(details?.progress) ? details.progress[0] : undefined;
      if (partial !== undefined || progress) {
        messages = updateToolCall(messages, event.toolCallId, (tc) => ({
          ...tc,
          ...(partial !== undefined ? { partialResult: partial } : {}),
          ...(progress ? { progress } : {}),
        }));
      }
      break;
    }

    case "tool_execution_end": {
      if (event.type !== "tool_execution_end") break;
      const resultText = event.result
        ? extractTextFromContent(event.result.content as unknown[])
        : undefined;
      const resultImages = event.result
        ? extractImagesFromContent(event.result.content as unknown[])
        : undefined;
      const resultDetails = (event.result as any)?.details;
      const subagentMeta = resultDetails ? extractSubagentMeta(resultDetails) : undefined;
      const diff = resultDetails && typeof resultDetails.diff === "string" ? resultDetails.diff : undefined;
      messages = updateToolCall(messages, event.toolCallId, (tc) => ({
        ...tc,
        status: event.isError ? "error" : "complete",
        result: resultText,
        resultImages,
        isError: event.isError,
        ...(subagentMeta ? { subagentMeta } : {}),
        ...(diff ? { diff } : {}),
      }));
      break;
    }

    case "session_process_exited": {
      isStreaming = false;
      messages = updateLastStreaming(messages, (msg) => ({ ...msg, isStreaming: false }));
      messages = cancelInFlightToolCalls(messages);
      break;
    }

    case "session_state": {
      const data = event as unknown as { isStreaming?: boolean };
      if (typeof data.isStreaming === "boolean") {
        isStreaming = data.isStreaming;
        if (!isStreaming) {
          messages = updateLastStreaming(messages, (msg) => ({ ...msg, isStreaming: false }));
          messages = cancelInFlightToolCalls(messages);
        }
      }
      break;
    }

    case "agent_state": {
      const data = event as unknown as AgentStateData;
      if (typeof data.isStreaming === "boolean") {
        isStreaming = data.isStreaming;
        if (!isStreaming) {
          messages = updateLastStreaming(messages, (msg) => ({ ...msg, isStreaming: false }));
        }
      }
      if (typeof data.mode === "string") {
        if (data.mode === "plan") {
          mode = "plan";
        } else if (data.mode === "chat" || data.mode === "work") {
          mode = "work";
        }
      }
      agentState = data;
      break;
    }

    case "queue_update": {
      if (event.type !== "queue_update") break;
      steeringQueue = event.steering;
      followUpQueue = event.followUp;
      break;
    }

    case "extension_ui_request": {
      if (event.type !== "extension_ui_request") break;
      if ("method" in event) {
        const method = event.method;
        if (method === "select" || method === "confirm" || method === "input" || method === "editor") {
          pendingExtensionUiRequest = {
            id: event.id,
            method,
            ...(method === "select" ? { title: event.title, options: event.options, timeout: event.timeout } : {}),
            ...(method === "confirm" ? { title: event.title, message: event.message, timeout: event.timeout } : {}),
            ...(method === "input" ? { title: event.title, placeholder: event.placeholder } : {}),
            ...(method === "editor" ? { title: event.title, prefill: event.prefill } : {}),
          };
        }
        if (method === "setStatus" && event.statusKey === "plan-mode") {
          const statusText = typeof event.statusText === "string" ? event.statusText.toLowerCase() : "";
          mode = statusText.includes("plan") ? "plan" : "work";
        }
      }
      break;
    }
  }

  return {
    ...state,
    messages,
    isStreaming,
    mode,
    pendingExtensionUiRequest,
    steeringQueue,
    followUpQueue,
    agentState,
  };
}

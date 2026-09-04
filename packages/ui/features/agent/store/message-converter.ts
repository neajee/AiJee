import { isAbortReason } from "@aijee/client-sdk";
import type { ChatMessage, MessageUsageInfo, ToolCallInfo } from "../types";

export function extractTextFromContent(content: any[] | undefined): string {
  if (!Array.isArray(content)) return "";
  const text = content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");

  const imageCount = content.filter((c) => c.type === "image").length;
  if (imageCount === 0) {
    return text;
  }

  const imageLabel =
    imageCount === 1 ? "1 image output" : `${imageCount} image outputs`;
  if (!text.trim()) {
    return `[${imageLabel}]`;
  }

  return `${text}\n\n[${imageLabel}]`;
}

export function getAssistantErrorMessage(message: any): string | undefined {
  // Aborts are user actions: the runtime's AbortError text must not surface as
  // an agent error.
  if (message?.stopReason === "aborted") return undefined;
  if (
    ["error", "aborted"].includes(message?.stopReason) &&
    typeof message?.errorMessage === "string" &&
    message.errorMessage.trim() &&
    !isAbortReason(message.errorMessage)
  ) {
    return message.errorMessage.trim();
  }
  return undefined;
}

function parseTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Date.now();
}

function isModeSlashCommand(message: string): boolean {
  const firstToken = message.trim().split(/\s+/)[0];
  return firstToken === "/chat" || firstToken === "/work" || firstToken === "/plan";
}

function getStableMessageId(msg: any, role: ChatMessage["role"], index: number): string {
  const rawId =
    msg?.id ??
    msg?.messageId ??
    msg?.entryId ??
    msg?.entry_id ??
    null;

  if (rawId !== null && rawId !== undefined && rawId !== "") {
    return `${role}-${String(rawId)}`;
  }

  const timestamp =
    typeof msg?.timestamp === "number" ? msg.timestamp : "no-timestamp";
  return `${role}-${timestamp}-${index}`;
}

export function extractUsageInfo(message: any): MessageUsageInfo | undefined {
  const usage = message?.usage;
  if (!usage || typeof usage !== "object") {
    return undefined;
  }
  const cost =
    usage.cost && typeof usage.cost === "object" ? usage.cost : undefined;

  return {
    input: typeof usage.input === "number" ? usage.input : undefined,
    output: typeof usage.output === "number" ? usage.output : undefined,
    cacheRead:
      typeof usage.cacheRead === "number" ? usage.cacheRead : undefined,
    cacheWrite:
      typeof usage.cacheWrite === "number" ? usage.cacheWrite : undefined,
    cacheReadCost:
      typeof cost?.cacheRead === "number" ? cost.cacheRead : undefined,
    cacheWriteCost:
      typeof cost?.cacheWrite === "number" ? cost.cacheWrite : undefined,
    totalTokens:
      typeof usage.totalTokens === "number"
        ? usage.totalTokens
        : undefined,
    inputCost:
      typeof cost?.input === "number" ? cost.input : undefined,
    outputCost:
      typeof cost?.output === "number" ? cost.output : undefined,
    totalCost:
      typeof cost?.total === "number" ? cost.total : undefined,
    currency:
      typeof cost?.currency === "string" ? cost.currency : undefined,
  };
}

function convertPiMessage(
  msg: any,
  index: number,
): ChatMessage | null {
  if (msg.role === "user") {
    const text =
      typeof msg.content === "string"
        ? msg.content
        : extractTextFromContent(msg.content);
    return {
      id: getStableMessageId(msg, "user", index),
      role: "user",
      text,
      timestamp: parseTimestamp(msg.timestamp),
    };
  }

  if (msg.role === "assistant") {
    const content = Array.isArray(msg.content) ? msg.content : [];
    const contentText = content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    const thinking = content
      .filter((c: any) => c.type === "thinking")
      .map((c: any) => c.thinking)
      .join("");
    const toolCalls: ToolCallInfo[] = content
      .filter((c: any) => c.type === "toolCall")
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        arguments:
          typeof c.arguments === "string"
            ? c.arguments
            : JSON.stringify(c.arguments),
        status: "complete" as const,
      }));

    return {
      id: getStableMessageId(msg, "assistant", index),
      role: "assistant",
      text: contentText,
      errorMessage: getAssistantErrorMessage(msg),
      thinking: thinking || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      timestamp: parseTimestamp(msg.timestamp),
      model: msg.model,
      provider: msg.provider,
      api: msg.api,
      responseId: msg.responseId,
      usage: extractUsageInfo(msg),
      stopReason: msg.stopReason,
    };
  }

  if (msg.role === "bashExecution") {
    return {
      id: getStableMessageId(msg, "system", index),
      role: "system",
      systemKind: "bashExecution",
      text: typeof msg.output === "string" ? msg.output : "",
      command: typeof msg.command === "string" ? msg.command : undefined,
      timestamp: parseTimestamp(msg.timestamp),
      exitCode:
        typeof msg.exitCode === "number" ? msg.exitCode : undefined,
      cancelled: !!msg.cancelled,
      truncated: !!msg.truncated,
      fullOutputPath:
        typeof msg.fullOutputPath === "string"
          ? msg.fullOutputPath
          : null,
    };
  }

  return null;
}

export function convertPiMessages(piMessages: any[]): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const [index, msg] of piMessages.entries()) {
    const converted = convertPiMessage(msg, index);
    if (converted) {
      result.push(converted);
      continue;
    }

    if (msg.role === "toolResult") {
      const lastAssistant = [...result]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant?.toolCalls) {
        const tc = lastAssistant.toolCalls.find(
          (t) => t.id === msg.toolCallId,
        );
        if (tc) {
          tc.result = extractTextFromContent(msg.content);
          tc.usage = extractUsageInfo(msg);
          tc.isError = msg.isError;
          tc.status = msg.isError ? "error" : "complete";
        }
      }
    }
  }

  return result;
}

export function convertSessionEntries(entries: any[]): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const [index, entry] of entries.entries()) {
    const raw = entry?.raw && typeof entry.raw === "object" ? entry.raw : entry;
    if (!raw || typeof raw !== "object") {
      continue;
    }

    if ((raw as any).type === "message" && (raw as any).message) {
      const converted = convertPiMessage((raw as any).message, index);
      if (converted) {
        result.push(converted);
        continue;
      }

      const msg = (raw as any).message;
      if (msg?.role === "toolResult") {
        const lastAssistant = [...result]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant?.toolCalls) {
          const tc = lastAssistant.toolCalls.find(
            (t) => t.id === msg.toolCallId,
          );
          if (tc) {
            tc.result = extractTextFromContent(msg.content);
            tc.usage = extractUsageInfo(msg);
            tc.isError = msg.isError;
            tc.status = msg.isError ? "error" : "complete";
          }
        }
      }
      continue;
    }

    const rawType = (raw as any).type;
    if (rawType === "model_change") {
      const provider = (raw as any).provider ?? "provider";
      const modelId = (raw as any).modelId ?? "model";
      result.push({
        id: `system-model-${(raw as any).id ?? index}`,
        role: "system",
        systemKind: "event",
        text: `Switched model to ${provider}/${modelId}`,
        timestamp: parseTimestamp((raw as any).timestamp),
      });
      continue;
    }

    if (rawType === "thinking_level_change") {
      const level = (raw as any).thinkingLevel ?? "unknown";
      result.push({
        id: `system-thinking-${(raw as any).id ?? index}`,
        role: "system",
        systemKind: "event",
        text: `Thinking level set to ${level}`,
        timestamp: parseTimestamp((raw as any).timestamp),
      });
      continue;
    }

    if (rawType === "compaction") {
      result.push({
        id: `system-compaction-${(raw as any).id ?? index}`,
        role: "system",
        systemKind: "event",
        text: "Conversation compacted",
        timestamp: parseTimestamp((raw as any).timestamp),
      });
      continue;
    }

    if (rawType === "custom" && (raw as any).customType === "plan-mode") {
      const enabled = !!(raw as any).data?.enabled;
      result.push({
        id: `system-plan-${(raw as any).id ?? index}`,
        role: "system",
        systemKind: "event",
        text: enabled ? "Plan mode enabled" : "Plan mode disabled",
        timestamp: parseTimestamp((raw as any).timestamp),
      });
      continue;
    }

    const preview =
      typeof entry?.preview === "string" && entry.preview.trim()
        ? entry.preview.trim()
        : typeof (raw as any).text === "string" && (raw as any).text.trim()
          ? (raw as any).text.trim()
          : typeof (raw as any).message === "string" &&
              (raw as any).message.trim()
            ? (raw as any).message.trim()
            : null;

    if (preview) {
      result.push({
        id: `system-${rawType ?? "entry"}-${(raw as any).id ?? index}`,
        role: "system",
        systemKind: "event",
        text: preview,
        timestamp: parseTimestamp((raw as any).timestamp ?? entry?.timestamp),
      });
    }
  }

  return result;
}

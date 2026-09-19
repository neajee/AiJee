import type { ChatMessage, ToolCallInfo, MessageUsageInfo } from "../../types/chat-message";
import { isAbortReason } from "./content.ts";

export function updateToolCall(
  messages: ChatMessage[],
  toolCallId: string,
  updater: (tc: ToolCallInfo) => ToolCallInfo,
): ChatMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!;
    if (!msg.toolCalls) continue;
    const idx = msg.toolCalls.findIndex((t) => t.id === toolCallId || t.previousId === toolCallId);
    if (idx === -1) continue;
    const nextToolCalls = [...msg.toolCalls];
    nextToolCalls[idx] = updater(msg.toolCalls[idx]!);
    const next = [...messages];
    next[i] = { ...msg, toolCalls: nextToolCalls };
    return next;
  }
  return messages;
}

// ---------------------------------------------------------------------------
// Convert raw pi messages (from getMessages RPC) to ChatMessage[]
// ---------------------------------------------------------------------------

export function parseTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

export function stableId(msg: Record<string, unknown>, role: string, index: number): string {
  const rawId = msg["id"] ?? msg["messageId"] ?? msg["entryId"] ?? msg["entry_id"];
  if (rawId !== null && rawId !== undefined && rawId !== "") return `${role}-${String(rawId)}`;
  const ts = typeof msg["timestamp"] === "number" ? msg["timestamp"] : "no-ts";
  return `${role}-${ts}-${index}`;
}

export function extractUsage(msg: Record<string, unknown>): MessageUsageInfo | undefined {
  const usage = msg["usage"];
  if (!usage || typeof usage !== "object") return undefined;
  const u = usage as Record<string, unknown>;
  const cost = u["cost"] && typeof u["cost"] === "object" ? u["cost"] as Record<string, unknown> : undefined;
  return {
    input: typeof u["input"] === "number" ? u["input"] : undefined,
    output: typeof u["output"] === "number" ? u["output"] : undefined,
    cacheRead: typeof u["cacheRead"] === "number" ? u["cacheRead"] : undefined,
    cacheWrite: typeof u["cacheWrite"] === "number" ? u["cacheWrite"] : undefined,
    cacheReadCost: typeof cost?.["cacheRead"] === "number" ? cost["cacheRead"] as number : undefined,
    cacheWriteCost: typeof cost?.["cacheWrite"] === "number" ? cost["cacheWrite"] as number : undefined,
    inputCost: typeof cost?.["input"] === "number" ? cost["input"] as number : undefined,
    outputCost: typeof cost?.["output"] === "number" ? cost["output"] as number : undefined,
    totalCost: typeof cost?.["total"] === "number" ? cost["total"] as number : undefined,
    currency: typeof cost?.["currency"] === "string" ? cost["currency"] as string : undefined,
  };
}

export function errorMsg(msg: Record<string, unknown>): string | undefined {
  // An aborted turn carries the runtime's AbortError text; it is not an error
  // the reader needs to see, the UI renders a neutral "Stopped" notice instead.
  if (msg["stopReason"] === "aborted") return undefined;
  if (
    ["error", "aborted"].includes(msg["stopReason"] as string) &&
    typeof msg["errorMessage"] === "string" &&
    (msg["errorMessage"] as string).trim() &&
    !isAbortReason(msg["errorMessage"])
  ) {
    return (msg["errorMessage"] as string).trim();
  }
  return undefined;
}

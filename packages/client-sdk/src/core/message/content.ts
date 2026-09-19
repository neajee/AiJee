import type { ChatMessage, ToolCallInfo, ToolResultImage, SubagentMeta } from "../../types/chat-message";

export function extractTextFromContent(content: unknown[] | undefined): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c): c is { type: string; text: string } =>
      typeof c === "object" && c !== null && "type" in c && (c as { type: string }).type === "text",
    )
    .map((c) => c.text ?? "")
    .join("");
}

export function extractImagesFromContent(content: unknown[] | undefined): ToolResultImage[] | undefined {
  if (!Array.isArray(content)) return undefined;
  const images = content
    .filter((c): c is { type: string; data: string; mimeType: string } =>
      typeof c === "object" &&
      c !== null &&
      "type" in c &&
      (c as { type: string }).type === "image" &&
      "data" in c &&
      typeof (c as { data: unknown }).data === "string",
    )
    .map((c) => ({ data: c.data, mimeType: c.mimeType ?? "image/png" }));
  return images.length > 0 ? images : undefined;
}

export function extractMessageEntryId(msg: Record<string, unknown>): string | undefined {
  const rawId = msg["entryId"] ?? msg["entry_id"] ?? msg["id"] ?? msg["messageId"];
  if (typeof rawId === "string" && rawId.trim()) return rawId;
  if (typeof rawId === "number" && Number.isFinite(rawId)) return String(rawId);
  return undefined;
}

export function stampTurnEndFromBackend(
  messages: ChatMessage[],
  stats: { filesEdited?: number; filesCreated?: number; linesAdded?: number; linesRemoved?: number; durationMs?: number },
): ChatMessage[] {
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "assistant") { lastAssistantIdx = i; break; }
  }
  if (lastAssistantIdx === -1) return messages;
  const msg = messages[lastAssistantIdx]!;
  if (msg.turnDurationMs !== undefined) return messages;

  const hasFileStats = (stats.filesEdited ?? 0) > 0 || (stats.filesCreated ?? 0) > 0;
  const next = [...messages];
  next[lastAssistantIdx] = {
    ...msg,
    turnDurationMs: stats.durationMs ?? 0,
    turnFileStats: hasFileStats
      ? { filesEdited: stats.filesEdited ?? 0, filesCreated: stats.filesCreated ?? 0, linesAdded: stats.linesAdded ?? 0, linesRemoved: stats.linesRemoved ?? 0 }
      : undefined,
  };
  return next;
}

export function findLastStreamingIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "assistant" && messages[i]!.isStreaming) return i;
  }
  return -1;
}

export function updateLastStreaming(messages: ChatMessage[], updater: (msg: ChatMessage) => ChatMessage): ChatMessage[] {
  const idx = findLastStreamingIndex(messages);
  if (idx === -1) return messages;
  const next = [...messages];
  next[idx] = updater(messages[idx]!);
  return next;
}

/**
 * Abort is a user action, not a failure. The runtime surfaces it as a plain
 * `AbortError` ("This operation was aborted"), which must never be rendered as
 * an agent error.
 */
const ABORT_PATTERNS: RegExp[] = [
  /^abort(ed|ing)?\.?$/i,
  /\bAbortError\b/,
  /\b(operation|request|turn|run|stream)\s+(was\s+|has\s+been\s+)?abort(ed)?\b/i,
  /\b(user|client)\s+abort(ed)?\b/i,
  /\babort(ed)?\s+by\s+(the\s+)?user\b/i,
];

export function isAbortReason(reason: unknown): boolean {
  if (typeof reason !== "string") return false;
  const text = reason.trim();
  if (!text) return false;
  return ABORT_PATTERNS.some((pattern) => pattern.test(text));
}

const IN_FLIGHT_TOOL_STATUS: ToolCallInfo["status"][] = ["streaming", "pending", "running"];

/**
 * When a turn is aborted or the session dies, in-flight tool calls never get a
 * `tool_execution_end`. Without this they keep spinning forever.
 */
export function cancelInFlightToolCalls(messages: ChatMessage[]): ChatMessage[] {
  let changed = false;
  const next = messages.map((msg) => {
    if (!msg.toolCalls?.length) return msg;
    let msgChanged = false;
    const toolCalls = msg.toolCalls.map((tc) => {
      if (!IN_FLIGHT_TOOL_STATUS.includes(tc.status)) return tc;
      msgChanged = true;
      return { ...tc, status: "cancelled" as const };
    });
    if (!msgChanged) return msg;
    changed = true;
    return { ...msg, toolCalls };
  });
  return changed ? next : messages;
}

export function extractSubagentMeta(details: unknown): SubagentMeta | undefined {
  if (!details || typeof details !== "object") return undefined;
  const d = details as Record<string, unknown>;
  const results = Array.isArray(d["results"]) ? d["results"] as Record<string, unknown>[] : [];
  const first = results[0];
  if (!first) return undefined;
  const usage = first["usage"] as Record<string, unknown> | undefined;
  const summary = first["progressSummary"] as Record<string, unknown> | undefined;
  const meta: SubagentMeta = {};
  if (typeof first["model"] === "string") meta.model = first["model"] as string;
  if (usage) {
    if (typeof usage["cost"] === "number") meta.cost = usage["cost"] as number;
    if (typeof usage["turns"] === "number") meta.turns = usage["turns"] as number;
  }
  if (summary) {
    if (typeof summary["toolCount"] === "number") meta.toolCount = summary["toolCount"] as number;
    if (typeof summary["tokens"] === "number") meta.tokens = summary["tokens"] as number;
    if (typeof summary["durationMs"] === "number") meta.durationMs = summary["durationMs"] as number;
  }
  if (!meta.model && !meta.cost && !meta.toolCount) return undefined;
  return meta;
}

export function stringifyToolArguments(argumentsValue: unknown): string {
  if (typeof argumentsValue === "string") return argumentsValue;
  return JSON.stringify(argumentsValue ?? {});
}

export function findToolCallIndex(toolCalls: ToolCallInfo[], contentIndex?: number): number {
  if (typeof contentIndex === "number") {
    const exact = toolCalls.findIndex((tc) => tc.contentIndex === contentIndex);
    if (exact !== -1) return exact;
  }
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i]?.status === "streaming") return i;
  }
  return toolCalls.length - 1;
}

/**
 * Merges a server-side snapshot's tool call blocks into the tool calls the
 * stream has already produced.
 *
 * Identity is resolved in two passes:
 *  1. Exact match — stable id chain (`id`/`previousId`) first, content index
 *     as a weaker signal. Snapshot ids can differ from the provisional ids
 *     the stream assigned earlier (`tc-<index>` or a partial id), so neither
 *     is authoritative on its own.
 *  2. Order match — the stream emits tool calls in call order and the snapshot
 *     keeps that order, so an unmatched block continues the next unmatched
 *     local call. This is what keeps a completed tool "complete" (and its
 *     collapse state alive) across a snapshot that re-christens its id.
 *
 * Finally, calls the snapshot simply did not mention (a snapshot can arrive
 * while the stream is still assembling later calls) are kept when they are
 * still in flight, so a mid-stream remix can never temporarily drop a running
 * tool and make the UI flap around it.
 */
export function buildToolCallsFromContent(
  content: Record<string, unknown>[],
  previousToolCalls: ToolCallInfo[] | undefined,
  defaultStatus: ToolCallInfo["status"],
): ToolCallInfo[] {
  const prev = previousToolCalls ?? [];
  const unclaimed = [...prev];
  interface Entry {
    block: Record<string, unknown>;
    contentIndex: number;
    id: string;
    name: string;
    previous?: ToolCallInfo;
  }
  const entries: Entry[] = [];

  const claim = (tc: ToolCallInfo) => {
    const at = unclaimed.indexOf(tc);
    if (at !== -1) unclaimed.splice(at, 1);
  };
  // Tool type names are stable across the stream, so a block whose name does
  // not match a local call is a brand-new call, never a continuation.
  const nameCompatible = (tc: ToolCallInfo, blockName: string) =>
    !blockName || !tc.name || tc.name === blockName;

  for (const [contentIndex, block] of content.entries()) {
    if (block["type"] !== "toolCall") continue;

    const id = typeof block["id"] === "string" ? block["id"] : `tc-${contentIndex}`;
    const name = typeof block["name"] === "string" ? block["name"] : "";
    const previous =
      unclaimed.find((tc) => (tc.id === id || tc.previousId === id) && nameCompatible(tc, name)) ??
      unclaimed.find((tc) => tc.contentIndex === contentIndex && nameCompatible(tc, name));
    if (previous) claim(previous);
    entries.push({ block, contentIndex, id, name, previous });
  }

  // Second pass: pair the unmatched blocks with the unmatched local calls, in
  // order, so snapshots that renamed nothing still keep identity. Incompatible
  // names are skipped — those local calls are still in flight and will be
  // merged back below rather than mistaken for the new block.
  for (const entry of entries) {
    if (entry.previous) continue;
    for (let cursor = 0; cursor < unclaimed.length; cursor++) {
      const candidate = unclaimed[cursor]!;
      if (nameCompatible(candidate, entry.name)) {
        entry.previous = candidate;
        claim(candidate);
        break;
      }
    }
  }

  const nextToolCalls: ToolCallInfo[] = [];
  const seen = new Set<string>();
  for (const { block, contentIndex, id, name, previous } of entries) {
    const previousId = previous?.previousId ?? (previous && previous.id !== id ? previous.id : undefined);
    nextToolCalls.push({
      ...previous,
      id,
      name: typeof block["name"] === "string" ? block["name"] : previous?.name ?? "",
      arguments: stringifyToolArguments(block["arguments"]),
      status: previous?.status ?? defaultStatus,
      contentIndex,
      ...(previousId ? { previousId } : {}),
    });
    seen.add(id);
    if (previousId) seen.add(previousId);
  }

  // Keep in-flight calls the snapshot did not mention (the stream is still
  // assembling them), restored to their original relative order.
  const remaining = unclaimed.filter((tc) => IN_FLIGHT_TOOL_STATUS.includes(tc.status));
  if (remaining.length) {
    const prevIndex = new Map(prev.map((tc, i) => [tc.id, i]));
    nextToolCalls.push(...remaining);
    nextToolCalls.sort((a, b) => {
      const ia = (a.previousId ? prevIndex.get(a.previousId) : undefined) ?? prevIndex.get(a.id);
      const ib = (b.previousId ? prevIndex.get(b.previousId) : undefined) ?? prevIndex.get(b.id);
      if (ia === undefined) return ib === undefined ? 0 : 1;
      if (ib === undefined) return -1;
      return ia - ib;
    });
  }

  return nextToolCalls;
}

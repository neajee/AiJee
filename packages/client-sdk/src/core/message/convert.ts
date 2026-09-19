import type { ChatMessage, ToolCallInfo, ToolResultImage, MessageUsageInfo, SubagentMeta } from "../../types/chat-message";
import { extractTextFromContent, extractImagesFromContent, extractMessageEntryId, extractSubagentMeta, stringifyToolArguments, buildToolCallsFromContent } from "./content.ts";
import { parseTimestamp, stableId, extractUsage, errorMsg } from "./tool-calls.ts";
import { normalizeInlineThinking } from "./inline-thinking.ts";

function convertSingleMessage(msg: Record<string, unknown>, index: number): ChatMessage | null {
  const role = msg["role"] as string;

  if (role === "user") {
    const content = msg["content"];
    const text = typeof content === "string" ? content : extractTextFromContent(content as unknown[] | undefined);
    const baseId = stableId(msg, "user", index);
    const attachments = (extractImagesFromContent(content as unknown[] | undefined) ?? []).map((image, imageIndex) => ({
      id: `${baseId}:image:${imageIndex}`,
      type: "image" as const,
      mimeType: image.mimeType,
      data: image.data,
    }));
    return {
      id: baseId,
      entryId: extractMessageEntryId(msg),
      role: "user",
      text,
      ...(attachments.length > 0 ? { attachments } : {}),
      timestamp: parseTimestamp(msg["timestamp"]),
    };
  }

  if (role === "assistant") {
    const content = Array.isArray(msg["content"]) ? msg["content"] as Record<string, unknown>[] : [];
    const text = content.filter(c => c["type"] === "text").map(c => c["text"] as string ?? "").join("");
    const thinking = content.filter(c => c["type"] === "thinking").map(c => c["thinking"] as string ?? "").join("");
    const toolCalls = buildToolCallsFromContent(content, undefined, "complete");

    const backendStats = msg["turnFileStats"] as Record<string, number> | undefined;
    const backendDuration = typeof msg["turnDurationMs"] === "number" ? msg["turnDurationMs"] as number : undefined;

    // History can hold the same inline <think> tags a stream would.
    return normalizeInlineThinking<ChatMessage>({
      id: stableId(msg, "assistant", index),
      entryId: extractMessageEntryId(msg),
      role: "assistant" as const,
      text,
      errorMessage: errorMsg(msg),
      thinking: thinking || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      timestamp: parseTimestamp(msg["timestamp"]),
      model: msg["model"] as string | undefined,
      provider: msg["provider"] as string | undefined,
      api: msg["api"] as string | undefined,
      responseId: msg["responseId"] as string | undefined,
      usage: extractUsage(msg),
      stopReason: msg["stopReason"] as ChatMessage["stopReason"],
      turnDurationMs: backendDuration,
      turnFileStats: backendStats ? {
        filesEdited: backendStats["filesEdited"] ?? 0,
        filesCreated: backendStats["filesCreated"] ?? 0,
        linesAdded: backendStats["linesAdded"] ?? 0,
        linesRemoved: backendStats["linesRemoved"] ?? 0,
      } : undefined,
    });
  }

  if (role === "bashExecution") {
    return {
      id: stableId(msg, "system", index),
      role: "system",
      systemKind: "bashExecution",
      text: typeof msg["output"] === "string" ? msg["output"] : "",
      command: typeof msg["command"] === "string" ? msg["command"] : undefined,
      timestamp: parseTimestamp(msg["timestamp"]),
      exitCode: typeof msg["exitCode"] === "number" ? msg["exitCode"] : undefined,
      cancelled: !!msg["cancelled"],
      truncated: !!msg["truncated"],
      fullOutputPath: typeof msg["fullOutputPath"] === "string" ? msg["fullOutputPath"] : null,
    };
  }

  if (role === "compaction") {
    return {
      id: stableId(msg, "compaction", index),
      entryId: extractMessageEntryId(msg),
      role: "system",
      systemKind: "compaction",
      text: typeof msg["summary"] === "string" ? msg["summary"] : "",
      compactionTokensBefore: typeof msg["tokensBefore"] === "number"
        ? msg["tokensBefore"]
        : undefined,
      timestamp: parseTimestamp(msg["timestamp"]),
    };
  }

  return null;
}

export interface ConvertRawMessagesOptions {
  /** Newer messages already held by the session store. */
  tailContext?: ChatMessage[];
}

function applyToolResult(
  assistant: ChatMessage,
  raw: Record<string, unknown>,
): ChatMessage | null {
  if (assistant.role !== "assistant" || !assistant.toolCalls) return null;
  const toolCallIndex = assistant.toolCalls.findIndex(
    (toolCall) => toolCall.id === raw["toolCallId"] || toolCall.previousId === raw["toolCallId"],
  );
  if (toolCallIndex === -1) return null;

  const isError = raw["isError"] === true;
  const details = raw["details"] as Record<string, unknown> | undefined;
  const subagentMeta = extractSubagentMeta(details);
  const previous = assistant.toolCalls[toolCallIndex]!;
  const toolCall: ToolCallInfo = {
    ...previous,
    result: extractTextFromContent(raw["content"] as unknown[] | undefined),
    resultImages: extractImagesFromContent(raw["content"] as unknown[] | undefined),
    usage: extractUsage(raw),
    isError,
    status: isError ? "error" : "complete",
    ...(subagentMeta ? { subagentMeta } : {}),
    ...(typeof details?.["diff"] === "string" ? { diff: details["diff"] } : {}),
  };
  const toolCalls = [...assistant.toolCalls];
  toolCalls[toolCallIndex] = toolCall;
  return { ...assistant, toolCalls };
}

export function convertRawMessages(
  rawMessages: Record<string, string>[],
  options: ConvertRawMessagesOptions = {},
): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const [index, msg] of rawMessages.entries()) {
    const raw = msg as unknown as Record<string, unknown>;
    const converted = convertSingleMessage(raw, index);
    if (converted) {
      result.push(converted);
      continue;
    }

    if (raw["role"] === "toolResult") {
      let matched = false;
      for (let i = result.length - 1; i >= 0; i--) {
        const updated = applyToolResult(result[i]!, raw);
        if (!updated) continue;
        result[i] = updated;
        matched = true;
        break;
      }

      if (!matched) {
        for (let i = (options.tailContext?.length ?? 0) - 1; i >= 0; i--) {
          const updated = applyToolResult(options.tailContext![i]!, raw);
          if (!updated) continue;
          // Keep the context array but replace the affected message and tool call
          // immutably. loadOlderMessages spreads it into a new subject value.
          options.tailContext![i] = updated;
          break;
        }
      }
    }
  }

  return result;
}

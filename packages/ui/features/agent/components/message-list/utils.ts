import type { ToolCallInfo } from "../../types";

/** One file touched during a turn, as derived from the turn's tool calls. */
export interface TurnFileChange {
  path: string;
  kind: "created" | "edited";
  added: number;
  removed: number;
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"');
}

function extractJsonStringValue(raw: string, key: string): string | undefined {
  const keyPattern = new RegExp(`"${key}"\\s*:\\s*"`);
  const match = keyPattern.exec(raw);
  if (!match) return undefined;
  let start = match.index + match[0].length;
  let result = "";
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]!;
    if (escaped) {
      result += "\\" + ch;
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      // Streamed arguments can carry unescaped quotes inside the value (e.g. a
      // heredoc body). Only treat this quote as the end of the string when what
      // follows marks a value boundary: `,` (next key), `}` (object end), a
      // newline or the end of the buffer. Anything else is content.
      const next = raw[i + 1];
      if (next === undefined || next === "," || next === "}" || next === "\n") {
        return unescapeJsonString(result);
      }
      result += '"';
    } else {
      result += ch;
    }
  }
  return unescapeJsonString(result);
}

export function parseToolArguments(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const partial: Record<string, unknown> = {};
    const path = extractJsonStringValue(raw, "path");
    if (path !== undefined) partial.path = path;
    const command = extractJsonStringValue(raw, "command");
    if (command !== undefined) partial.command = command;
    const content = extractJsonStringValue(raw, "content");
    if (content !== undefined) partial.content = content;
    const oldText = extractJsonStringValue(raw, "oldText");
    if (oldText !== undefined) partial.oldText = oldText;
    const newText = extractJsonStringValue(raw, "newText");
    if (newText !== undefined) partial.newText = newText;
    const query = extractJsonStringValue(raw, "query");
    if (query !== undefined) partial.query = query;
    const url = extractJsonStringValue(raw, "url");
    if (url !== undefined) partial.url = url;
    const agent = extractJsonStringValue(raw, "agent");
    if (agent !== undefined) partial.agent = agent;
    const task = extractJsonStringValue(raw, "task");
    if (task !== undefined) partial.task = task;
    return partial;
  }
}

export function isToolActive(tc: ToolCallInfo): boolean {
  return tc.status === "streaming" || tc.status === "pending" || tc.status === "running";
}

export function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

/**
 * Shortens an absolute tool path for display, relative to the workspace root.
 *
 * Anything outside the workspace (or a path that is already relative) is
 * returned untouched rather than guessed at, so a path is never shown as
 * belonging somewhere it does not.
 */
export function relativePath(path: string, root: string | null | undefined): string {
  if (!path) return path;
  const normalized = path.replace(/\\/g, "/");
  if (!root) return normalized;

  const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalizedRoot) return normalized;
  if (normalized === normalizedRoot) return basename(normalized);
  if (normalized.startsWith(`${normalizedRoot}/`)) {
    return normalized.slice(normalizedRoot.length + 1);
  }
  return normalized;
}

export function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

export function truncateOutput(text: string, maxLines = 50): { text: string; truncated: boolean } {
  if (!text) return { text: "", truncated: false };
  const lines = text.split("\n");
  if (lines.length <= maxLines) return { text, truncated: false };
  return { text: lines.slice(0, maxLines).join("\n"), truncated: true };
}

export function toolDisplayName(name: string): string {
  switch (name) {
    case "bash": return "Terminal";
    case "read": return "Read";
    case "write": return "Write";
    case "edit": return "Edit";
    case "search": return "Search";
    case "scrape": return "Scrape";
    case "crawl": return "Crawl";
    case "subagent": return "Agent";
    case "questionnaire": return "Question";
    case "download": return "Download";
    default: return name;
  }
}

// Same predicates the edit tool row uses, so the summary card and the row
// never disagree about a file's +/- counts.
const DIFF_ADD = /^\+(?!\+)/;
const DIFF_REMOVE = /^-(?!-)/;

function countDiff(diff: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of diff.split("\n")) {
    if (DIFF_ADD.test(line)) added++;
    else if (DIFF_REMOVE.test(line)) removed++;
  }
  return { added, removed };
}

/**
 * An `edit` call whose result carries no diff (older sessions, or a call still
 * streaming) still has the replaced text in its arguments.
 */
function editFallbackDiff(parsed: Record<string, unknown>): string {
  const blocks = Array.isArray(parsed.edits)
    ? parsed.edits.map((item) => {
        const value = item as { oldText?: unknown; newText?: unknown };
        return {
          oldText: typeof value.oldText === "string" ? value.oldText : "",
          newText: typeof value.newText === "string" ? value.newText : "",
        };
      })
    : [
        {
          oldText: typeof parsed.oldText === "string" ? parsed.oldText : "",
          newText: typeof parsed.newText === "string" ? parsed.newText : "",
        },
      ];

  return blocks
    .flatMap((block) => {
      const lines: string[] = [];
      if (block.oldText) lines.push(...block.oldText.split("\n").map((l) => `-${l}`));
      if (block.newText) lines.push(...block.newText.split("\n").map((l) => `+${l}`));
      return lines;
    })
    .join("\n");
}

/**
 * Per-file changes for a turn, derived from its `edit` and `write` calls.
 *
 * The backend's `turnFileStats` only carries totals, so the expandable file
 * list is reconstructed here. Sessions whose tool calls were not retained
 * yield an empty list, and the summary card then stays collapsed-only.
 */
export function collectFileChanges(toolCalls: ToolCallInfo[]): TurnFileChange[] {
  const byPath = new Map<string, TurnFileChange>();

  for (const tc of toolCalls) {
    if (tc.name !== "edit" && tc.name !== "write") continue;
    // A failed or cancelled call left the file untouched.
    if (tc.isError || tc.status === "cancelled" || tc.status === "error") continue;

    const parsed = parseToolArguments(tc.arguments);
    const path = typeof parsed.path === "string" ? parsed.path : "";
    if (!path) continue;

    const entry = byPath.get(path) ?? {
      path,
      kind: tc.name === "write" ? ("created" as const) : ("edited" as const),
      added: 0,
      removed: 0,
    };

    if (tc.name === "write") {
      // A write counts as a creation even when it overwrote a file, matching
      // how the backend fills `filesCreated`.
      entry.kind = "created";
      entry.added += countLines(typeof parsed.content === "string" ? parsed.content : "");
    } else {
      const counts = countDiff(tc.diff?.trim() || editFallbackDiff(parsed));
      entry.added += counts.added;
      entry.removed += counts.removed;
    }

    byPath.set(path, entry);
  }

  return [...byPath.values()];
}

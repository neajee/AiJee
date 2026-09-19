import type { ChatMessage, ToolCallInfo, TurnFileStats } from "../types";

/**
 * One entry of a turn's work history. Steps hold references to the original
 * message fields (not copies) so memoised rows can bail out while streaming.
 */
export type WorkStep =
  | { kind: "thinking"; key: string; text: string; streaming: boolean }
  | { kind: "text"; key: string; text: string }
  | { kind: "error"; key: string; text: string }
  | { kind: "tools"; key: string; toolCalls: ToolCallInfo[] };

export interface MessageListItem {
  kind: "message";
  key: string;
  message: ChatMessage;
}

/**
 * Every assistant message between two user/system messages, folded into a
 * single row: the work history collapses behind a "Worked for X" divider and
 * only the turn's final answer stays visible.
 */
export interface TurnListItem {
  kind: "turn";
  key: string;
  steps: WorkStep[];
  final?: ChatMessage;
  /** The run was stopped (aborted) instead of finishing on its own. */
  aborted?: boolean;
  durationMs?: number;
  fileStats?: TurnFileStats;
  startedAt: number;
  /** Persisted user entry that starts this assistant turn. */
  sourceEntryId?: string;
}

export type ListItem = MessageListItem | TurnListItem;

function isAbortedMessage(msg: ChatMessage): boolean {
  return !msg.isStreaming && msg.stopReason === "aborted";
}

function buildTurn(msgs: ChatMessage[], requestedAt?: number, sourceEntryId?: string): TurnListItem {
  // The answer is the last message that produced visible output; everything
  // before it (thinking, narration, tool calls) is work history.
  let finalIdx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i]!;
    if (msg.text || msg.errorMessage) {
      finalIdx = i;
      break;
    }
  }
  const aborted = isAbortedMessage(msgs[msgs.length - 1]!);
  // A stopped turn may have produced nothing at all: keep its message as the
  // final row so the "Stopped" notice has somewhere to live.
  if (finalIdx === -1 && aborted) {
    finalIdx = msgs.length - 1;
  }

  const steps: WorkStep[] = [];
  let durationMs: number | undefined;
  let fileStats: TurnFileStats | undefined;

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i]!;
    if (durationMs === undefined) durationMs = msg.turnDurationMs;
    if (fileStats === undefined) fileStats = msg.turnFileStats;

    if (msg.thinking) {
      steps.push({
        kind: "thinking",
        key: `${msg.id}:thinking`,
        text: msg.thinking,
        streaming: !!msg.isStreaming && !msg.text,
      });
    }
    if (i !== finalIdx) {
      if (msg.text) {
        steps.push({ kind: "text", key: `${msg.id}:text`, text: msg.text });
      }
      if (msg.errorMessage) {
        steps.push({ kind: "error", key: `${msg.id}:error`, text: msg.errorMessage });
      }
    }
    if (msg.toolCalls?.length) {
      steps.push({ kind: "tools", key: `${msg.id}:tools`, toolCalls: msg.toolCalls });
    }
  }

  if (!durationMs || durationMs <= 0) {
    const timestamps = [requestedAt, ...msgs.map((msg) => msg.timestamp)]
      .filter((value): value is number => typeof value === "number")
      .map((value) => value < 1e12 ? value * 1000 : value)
      .filter((value) => Number.isFinite(value) && value > 0);
    const inferred = timestamps.length > 1
      ? Math.max(...timestamps) - Math.min(...timestamps)
      : 0;
    if (inferred > 0) durationMs = inferred;
  }

  return {
    kind: "turn",
    key: `turn:${msgs[0]!.id}`,
    steps,
    final: finalIdx >= 0 ? msgs[finalIdx] : undefined,
    ...(aborted ? { aborted: true } : {}),
    durationMs,
    fileStats,
    startedAt: requestedAt ?? msgs[0]!.timestamp,
    ...(sourceEntryId ? { sourceEntryId } : {}),
  };
}

/** Groups the flat message log into user/system rows and whole assistant turns. */
export function buildListItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let turn: ChatMessage[] = [];
  let requestedAt: number | undefined;
  let sourceEntryId: string | undefined;

  const flushTurn = () => {
    if (turn.length === 0) return;
    items.push(buildTurn(turn, requestedAt, sourceEntryId));
    turn = [];
    requestedAt = undefined;
    sourceEntryId = undefined;
  };

  for (const msg of messages) {
    if (msg.role === "assistant") {
      turn.push(msg);
      continue;
    }
    flushTurn();
    items.push({ kind: "message", key: msg.id, message: msg });
    requestedAt = msg.role === "user" ? msg.timestamp : undefined;
    sourceEntryId = msg.role === "user" ? msg.entryId : undefined;
  }
  flushTurn();

  return items;
}

function sameStep(a: WorkStep, b: WorkStep): boolean {
  if (a.key !== b.key) return false;
  if (a.kind === "tools" && b.kind === "tools") return a.toolCalls === b.toolCalls;
  if (a.kind === "thinking" && b.kind === "thinking") {
    return a.text === b.text && a.streaming === b.streaming;
  }
  if (a.kind === "text" && b.kind === "text") return a.text === b.text;
  if (a.kind === "error" && b.kind === "error") return a.text === b.text;
  return false;
}

function sameItem(a: ListItem, b: ListItem): boolean {
  if (a.kind === "message" && b.kind === "message") return a.message === b.message;
  if (a.kind !== "turn" || b.kind !== "turn") return false;
  if (
    a.final !== b.final ||
    a.aborted !== b.aborted ||
    a.durationMs !== b.durationMs ||
    a.fileStats !== b.fileStats ||
    a.startedAt !== b.startedAt ||
    a.sourceEntryId !== b.sourceEntryId ||
    a.steps.length !== b.steps.length
  ) {
    return false;
  }
  return a.steps.every((step, i) => sameStep(step, b.steps[i]!));
}

/**
 * Keeps the object identity of rows that did not change so that only the turn
 * currently streaming re-renders.
 */
export function reconcileItems(prev: ListItem[], next: ListItem[]): ListItem[] {
  if (prev.length === 0) return next;
  const byKey = new Map(prev.map((item) => [item.key, item]));
  let changed = prev.length !== next.length;
  const result = next.map((item) => {
    const previous = byKey.get(item.key);
    if (previous && sameItem(previous, item)) return previous;
    changed = true;
    return item;
  });
  return changed ? result : prev;
}

/** Mirrors `isToolActive`; kept local so this module stays type-only. */
const RUNNING_STATUSES: ReadonlySet<ToolCallInfo["status"]> = new Set([
  "streaming",
  "pending",
  "running",
]);

/** The kinds of work a turn can report, merged across its tool calls. */
export type TurnActionKind =
  | "edit"
  | "read"
  | "run"
  | "web"
  | "download"
  | "agent"
  | "other";

export interface TurnAction {
  kind: TurnActionKind;
  /** Past tense once the work is done, present participle while it runs. */
  label: string;
  /** How many calls of this kind the turn made. */
  count: number;
  running: boolean;
}

export type WorkStepSection =
  | { kind: "activity"; key: string; steps: WorkStep[] }
  | { kind: "content"; key: string; step: Extract<WorkStep, { kind: "text" | "error" }> };

const ACTION_OF_TOOL: Record<string, TurnActionKind> = {
  edit: "edit",
  write: "edit",
  read: "read",
  bash: "run",
  search: "web",
  scrape: "web",
  crawl: "web",
  download: "download",
  subagent: "agent",
};

const ACTION_LABELS: Record<TurnActionKind, { done: string; running: string }> = {
  edit: { done: "Edited files", running: "Editing files" },
  read: { done: "Read files", running: "Reading files" },
  run: { done: "Ran commands", running: "Running commands" },
  web: { done: "Searched the web", running: "Searching the web" },
  download: { done: "Downloaded files", running: "Downloading files" },
  agent: { done: "Ran agents", running: "Running agents" },
  other: { done: "Used tools", running: "Using tools" },
};

/** Reads as a sentence regardless of the order the calls actually came in. */
const ACTION_ORDER: TurnActionKind[] = [
  "edit",
  "read",
  "run",
  "web",
  "download",
  "agent",
  "other",
];

/**
 * What a turn did, as one deduplicated line: every `edit` and `write` in the
 * turn becomes a single "Edited files", every `read` a single "Read files", and
 * so on. This is the collapsed header for the whole work log, so a turn that
 * touched thirty files still reads as one row instead of thirty.
 */
export function summarizeTurnActions(steps: WorkStep[]): TurnAction[] {
  const seen = new Map<TurnActionKind, { count: number; running: boolean }>();

  for (const step of steps) {
    if (step.kind !== "tools") continue;
    for (const tc of step.toolCalls) {
      const kind = ACTION_OF_TOOL[tc.name] ?? "other";
      const entry = seen.get(kind) ?? { count: 0, running: false };
      entry.count += 1;
      if (RUNNING_STATUSES.has(tc.status)) entry.running = true;
      seen.set(kind, entry);
    }
  }

  return ACTION_ORDER.filter((kind) => seen.has(kind)).map((kind) => {
    const entry = seen.get(kind)!;
    return {
      kind,
      label: ACTION_LABELS[kind][entry.running ? "running" : "done"],
      count: entry.count,
      running: entry.running,
    };
  });
}

export function groupWorkSteps(steps: WorkStep[]): WorkStepSection[] {
  const sections: WorkStepSection[] = [];
  let activity: WorkStep[] = [];
  const flush = () => {
    if (!activity.length) return;
    sections.push({ kind: "activity", key: `activity:${activity[0]!.key}`, steps: activity });
    activity = [];
  };

  for (const step of steps) {
    if (step.kind === "text" || step.kind === "error") {
      flush();
      sections.push({ kind: "content", key: `content:${step.key}`, step });
    } else {
      activity.push(step);
    }
  }
  flush();
  return sections;
}

export function formatTurnAction(action: TurnAction): string {
  if (action.count <= 1) return action.label;
  switch (action.kind) {
    case "edit": return `${action.running ? "Editing" : "Edited"} ${action.count} files`;
    case "read": return `${action.running ? "Reading" : "Read"} ${action.count} files`;
    case "run": return `${action.running ? "Running" : "Ran"} ${action.count} commands`;
    case "web": return `${action.running ? "Searching" : "Searched"} ${action.count} web tasks`;
    case "download": return `${action.running ? "Downloading" : "Downloaded"} ${action.count} files`;
    case "agent": return `${action.running ? "Running" : "Ran"} ${action.count} agents`;
    case "other": return `${action.running ? "Using" : "Used"} ${action.count} tools`;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/** Message timestamps come from the server, so only trust plausible ones. */
export function normalizeStart(ts: number, fallback: number, now = Date.now()): number {
  if (!Number.isFinite(ts) || ts <= 0) return fallback;
  const ms = ts < 1e12 ? ts * 1000 : ts;
  return ms > now - 86_400_000 && ms <= now + 60_000 ? ms : fallback;
}

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildListItems,
  formatTurnAction,
  groupWorkSteps,
  summarizeTurnActions,
} from "../features/agent/components/message-list/turns.ts";
import type { ChatMessage, ToolCallInfo } from "../features/agent/types.ts";

function tool(name: string, status: ToolCallInfo["status"] = "complete"): ToolCallInfo {
  return { id: `${name}-${Math.random()}`, name, arguments: "{}", status };
}

function assistant(partial: Partial<ChatMessage>): ChatMessage {
  return {
    id: partial.id ?? "a1",
    role: "assistant",
    text: "",
    timestamp: 1,
    ...partial,
  } as ChatMessage;
}

test("like actions collapse into one label each, in reading order", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 0 } as ChatMessage,
    assistant({ id: "a1", toolCalls: [tool("edit"), tool("bash")] }),
    assistant({ id: "a2", toolCalls: [tool("read"), tool("read"), tool("write")] }),
    assistant({ id: "a3", text: "done" }),
  ]);

  const turn = items.at(-1)!;
  if (turn.kind !== "turn") throw new Error("expected a turn");
  const actions = summarizeTurnActions(turn.steps);

  assert.deepEqual(
    actions.map((a) => a.label),
    ["Edited files", "Read files", "Ran commands"],
  );
  assert.deepEqual(
    actions.map((a) => a.count),
    [2, 2, 1],
    "an edit and a write are the same kind of work",
  );
});

test("a running call switches only its own label to the present tense", () => {
  const actions = summarizeTurnActions([
    { kind: "tools", key: "k", toolCalls: [tool("read"), tool("bash", "running")] },
  ]);

  assert.deepEqual(
    actions.map((a) => a.label),
    ["Read files", "Running commands"],
  );
  assert.deepEqual(
    actions.map((a) => a.running),
    [false, true],
  );
});

test("unknown tools merge under a single label instead of one row each", () => {
  const actions = summarizeTurnActions([
    { kind: "tools", key: "k", toolCalls: [tool("questionnaire"), tool("mcp__thing")] },
  ]);

  assert.deepEqual(actions, [
    { kind: "other", label: "Used tools", count: 2, running: false },
  ]);
});

test("a turn with no tool calls reports nothing to merge", () => {
  const actions = summarizeTurnActions([
    { kind: "thinking", key: "t", text: "hmm", streaming: false },
    { kind: "text", key: "x", text: "narration" },
  ]);

  assert.deepEqual(actions, []);
});

test("visible narration splits adjacent activity into separate disclosures", () => {
  const sections = groupWorkSteps([
    { kind: "thinking", key: "t1", text: "plan", streaming: false },
    { kind: "tools", key: "tools-1", toolCalls: [tool("edit"), tool("read")] },
    { kind: "text", key: "text", text: "Step 2" },
    { kind: "tools", key: "tools-2", toolCalls: [tool("bash"), tool("bash")] },
  ]);

  assert.deepEqual(sections.map((section) => section.kind), ["activity", "content", "activity"]);
  const last = sections[2];
  if (last?.kind !== "activity") throw new Error("expected activity");
  assert.equal(formatTurnAction(summarizeTurnActions(last.steps)[0]!), "Ran 2 commands");
});

test("an old turn infers its duration from assistant message timestamps", () => {
  const items = buildListItems([
    assistant({ id: "a1", timestamp: 1_700_000_000_000, toolCalls: [tool("read")] }),
    assistant({ id: "a2", timestamp: 1_700_000_012_000, text: "done" }),
  ]);
  const turn = items[0];
  if (turn?.kind !== "turn") throw new Error("expected a turn");
  assert.equal(turn.durationMs, 12_000);
});

test("a single-message turn measures from the user request", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 1_700_000_000_000 } as ChatMessage,
    assistant({ id: "a1", timestamp: 1_700_000_009_000, text: "done" }),
  ]);
  const turn = items[1];
  if (turn?.kind !== "turn") throw new Error("expected a turn");
  assert.equal(turn.durationMs, 9_000);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildListItems,
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

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildListItems } from "../features/agent/utils/turns.ts";
import type { ChatMessage } from "../features/agent/types.ts";

function assistant(partial: Partial<ChatMessage>): ChatMessage {
  return {
    id: partial.id ?? "a1",
    role: "assistant",
    text: "",
    timestamp: 1,
    ...partial,
  } as ChatMessage;
}

test("a stopped turn is flagged and keeps its last answer visible", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 0 } as ChatMessage,
    assistant({ id: "a1", text: "Now the fixes. Server side first:" }),
    assistant({ id: "a2", stopReason: "aborted" }),
  ]);

  const turn = items.at(-1)!;
  assert.equal(turn.kind, "turn");
  if (turn.kind !== "turn") return;
  assert.equal(turn.aborted, true);
  assert.equal(turn.final?.id, "a1", "the narration stays the visible answer");
});

test("a stopped turn without output still renders a final row", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 0 } as ChatMessage,
    assistant({ id: "a1", stopReason: "aborted" }),
  ]);

  const turn = items.at(-1)!;
  if (turn.kind !== "turn") throw new Error("expected a turn");
  assert.equal(turn.aborted, true);
  assert.equal(turn.final?.id, "a1");
});

test("a completed turn is not flagged as stopped", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 0 } as ChatMessage,
    assistant({ id: "a1", text: "done", stopReason: "stop" }),
  ]);

  const turn = items.at(-1)!;
  if (turn.kind !== "turn") throw new Error("expected a turn");
  assert.equal(turn.aborted, undefined);
  assert.equal(turn.final?.id, "a1");
});

test("a streaming turn is not flagged as stopped", () => {
  const items = buildListItems([
    { id: "u1", role: "user", text: "go", timestamp: 0 } as ChatMessage,
    assistant({ id: "a1", isStreaming: true, stopReason: "aborted" }),
  ]);

  const turn = items.at(-1)!;
  if (turn.kind !== "turn") throw new Error("expected a turn");
  assert.equal(turn.aborted, undefined);
});

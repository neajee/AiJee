import assert from "node:assert/strict";
import { test } from "node:test";
import { convertRawMessages } from "../src/core/message-reducer.ts";
import type { ChatMessage } from "../src/types/chat-message.ts";

const toolResult = (toolCallId: string) => ({
  role: "toolResult",
  toolCallId,
  content: [{ type: "text", text: "tool output" }],
});

test("a paged toolResult updates its assistant host in tailContext", () => {
  const original: ChatMessage = {
    id: "assistant-1",
    entryId: "entry-1",
    role: "assistant",
    text: "",
    timestamp: 1,
    toolCalls: [{ id: "call-1", name: "read", arguments: "{}", status: "complete" }],
  };
  const tailContext = [original];

  const converted = convertRawMessages([toolResult("call-1")] as never, { tailContext });

  assert.deepEqual(converted, []);
  assert.notEqual(tailContext[0], original);
  assert.equal(tailContext[0]!.toolCalls![0]!.result, "tool output");
  assert.equal(tailContext[0]!.toolCalls![0]!.status, "complete");
});

test("a same-page toolResult still attaches to its preceding assistant", () => {
  const converted = convertRawMessages([
    {
      role: "assistant",
      id: "entry-1",
      content: [{ type: "toolCall", id: "call-1", name: "read", arguments: {} }],
    },
    toolResult("call-1"),
  ] as never);

  assert.equal(converted.length, 1);
  assert.equal(converted[0]!.toolCalls![0]!.result, "tool output");
});

test("an unmatched toolResult is ignored without throwing", () => {
  assert.doesNotThrow(() => convertRawMessages([toolResult("missing")] as never));
});

test("a compaction history entry becomes a system divider message", () => {
  const [message] = convertRawMessages([{
    role: "compaction",
    entryId: "compact-1",
    timestamp: "2026-01-01T00:00:00.000Z",
    summary: "prior context",
    tokensBefore: 123,
  }] as never);

  assert.equal(message?.role, "system");
  assert.equal(message?.systemKind, "compaction");
  assert.equal(message?.entryId, "compact-1");
  assert.equal(message?.compactionTokensBefore, 123);
});

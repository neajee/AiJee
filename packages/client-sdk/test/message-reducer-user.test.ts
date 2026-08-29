import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmptySessionState, reduceStreamEvent } from "../src/core/message-reducer.ts";
import type { StreamEventEnvelope } from "../src/types/stream-events.ts";

let nextId = 1;
function event(type: string, message: Record<string, unknown>): StreamEventEnvelope {
  return { id: nextId++, session_id: "s1", type, data: { type, message }, timestamp: Date.now() } as unknown as StreamEventEnvelope;
}

test("reduces live user messages and makes duplicate delivery idempotent", () => {
  const start = event("message_start", {
    role: "user",
    entryId: "entry-1",
    content: [{ type: "text", text: "hello" }, { type: "image", data: "abc", mimeType: "image/png" }],
  });
  let state = reduceStreamEvent(createEmptySessionState(), start);
  state = reduceStreamEvent(state, start);
  assert.equal(state.messages.length, 1);
  assert.equal(state.messages[0]?.text, "hello");
  assert.equal(state.messages[0]?.entryId, "entry-1");
  assert.equal(state.messages[0]?.attachments?.length, 1);
});

test("does not render mode commands as user messages", () => {
  const state = reduceStreamEvent(createEmptySessionState(), event("message_start", {
    role: "user",
    content: [{ type: "text", text: "/plan build it" }],
  }));
  assert.equal(state.messages.length, 0);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasInlineThinking,
  normalizeInlineThinking,
  splitInlineThinking,
} from "../src/core/message-reducer.ts";

test("text without tags is untouched", () => {
  const result = splitInlineThinking("just an answer");
  assert.equal(result.text, "just an answer");
  assert.equal(result.thinking, "");
});

test("a closed think block moves out of the answer", () => {
  const result = splitInlineThinking("<think>weighing options</think>The answer.");
  assert.equal(result.text, "The answer.");
  assert.equal(result.thinking, "weighing options");
});

test("an unterminated block is thinking so far, not answer", () => {
  // This is every streaming frame before the closing tag arrives.
  const result = splitInlineThinking("<think>still going");
  assert.equal(result.text, "");
  assert.equal(result.thinking, "still going");
});

test("thinking in the middle keeps the surrounding answer", () => {
  const result = splitInlineThinking("Before <think>hmm</think> after");
  assert.equal(result.text, "Before  after");
  assert.equal(result.thinking, "hmm");
});

test("multiple blocks are joined in order", () => {
  const result = splitInlineThinking("<think>one</think>A<think>two</think>B");
  assert.equal(result.text, "AB");
  assert.equal(result.thinking, "one\n\ntwo");
});

test("the <thinking> spelling works too", () => {
  const result = splitInlineThinking("<thinking>via long tag</thinking>done");
  assert.equal(result.text, "done");
  assert.equal(result.thinking, "via long tag");
});

test("blank runs left behind by a removed block collapse", () => {
  const result = splitInlineThinking("<think>x</think>\n\n\n\nAnswer");
  assert.equal(result.text, "Answer");
});

test("normalize leaves a message alone when there are no tags", () => {
  const message = { text: "hello", thinking: "" };
  assert.equal(normalizeInlineThinking(message), message);
});

test("normalize appends to an existing thinking block", () => {
  const result = normalizeInlineThinking({
    text: "<think>second</think>answer",
    thinking: "first",
  });
  assert.equal(result.text, "answer");
  assert.equal(result.thinking, "first\n\nsecond");
});

test("normalize does not duplicate thinking it already has", () => {
  const result = normalizeInlineThinking({
    text: "<think>same</think>answer",
    thinking: "same",
  });
  assert.equal(result.thinking, "same");
});

test("a stray closing tag is not mistaken for a block", () => {
  const result = splitInlineThinking("answer</think>");
  assert.equal(result.text, "answer</think>");
  assert.equal(result.thinking, "");
});

test("the cheap pre-check matches the splitter", () => {
  assert.equal(hasInlineThinking("no tags"), false);
  assert.equal(hasInlineThinking("<think>"), true);
  assert.equal(hasInlineThinking("<thinking>"), true);
});

test("a streamed deepseek turn ends up with thinking split from the answer", () => {
  // Frames as an inline-tag endpoint sends them: tag opens, content dribbles
  // in, tag closes, then the real answer.
  const frames = ["<think>", "let me ", "check", "</think>", "Done."];
  let text = "";
  let message: { text?: string; thinking?: string } = {};

  for (const frame of frames) {
    text += frame;
    message = normalizeInlineThinking({ ...message, text });
    // The raw tag must never be visible to the renderer.
    assert.ok(!message.text?.includes("<think"));
  }

  assert.equal(message.text, "Done.");
  assert.equal(message.thinking, "let me check");
});

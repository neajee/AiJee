import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseToolArguments,
  isToolActive,
  truncateOutput,
} from "../features/agent/utils/message-list.ts";
import type { ToolCallInfo } from "../features/agent/types.ts";

test("parses a heredoc command whose body has unescaped quotes", () => {
  const raw = `{"command":"cat > /tmp/dbg.ts << 'EOF'\nlet a = "hello";\nEOF"}`;
  const parsed = parseToolArguments(raw);
  // The value must survive the quotes inside the heredoc body, not stop at the
  // first one (which used to truncate the command the reader was looking at).
  assert.equal(parsed.command, "cat > /tmp/dbg.ts << 'EOF'\nlet a = \"hello\";\nEOF");
});

test("parses a streamed, unterminated argument buffer as far as it got", () => {
  const raw = `{"command":"cat > /tmp/dbg.ts << 'EOF'\nlet a = "hello`;
  const parsed = parseToolArguments(raw);
  assert.equal(parsed.command, "cat > /tmp/dbg.ts << 'EOF'\nlet a = \"hello");
});

test("stops cleanly at the real value boundary in a complete object", () => {
  const raw = `{"command":"cat x && tail -f log | grep '"' err","path":"/a.ts"}`;
  const parsed = parseToolArguments(raw);
  assert.equal(parsed.command, "cat x && tail -f log | grep '\"' err");
  assert.equal(parsed.path, "/a.ts");
});

test("arguments keys survive an unescaped newline in the value", () => {
  const raw = `{"command":"cat > f << 'EOF'\nimport x\nEOF","query":"later"}`;
  const parsed = parseToolArguments(raw);
  assert.equal(parsed.command, "cat > f << 'EOF'\nimport x\nEOF");
  assert.equal(parsed.query, "later");
});

test("isToolActive covers exactly the in-flight statuses", () => {
  for (const status of ["streaming", "pending", "running"]) {
    assert.equal(isToolActive({ status } as ToolCallInfo), true);
  }
  for (const status of ["complete", "error", "cancelled"]) {
    assert.equal(isToolActive({ status } as ToolCallInfo), false);
  }
});

test("truncateOutput keeps short output intact and flags long output", () => {
  const short = Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n");
  assert.deepEqual(truncateOutput(short), { text: short, truncated: false });

  const long = Array.from({ length: 60 }, (_, i) => `line ${i}`).join("\n");
  const result = truncateOutput(long);
  assert.equal(result.truncated, true);
  assert.equal(result.text.split("\n").length, 50);
});
